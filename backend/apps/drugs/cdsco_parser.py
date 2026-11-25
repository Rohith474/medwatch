import io
import re
from datetime import date, datetime
import pdfplumber
from apps.drugs.models import Drug, LabResult, Manufacturer, ResultType
from apps.labs.models import Lab


def _detect_result_type(text: str) -> str:
    """Infer official ResultType from CDSCO failure reason / remarks."""
    t = (text or '').lower()
    if 'spurious' in t or 'fake' in t or 'counterfeit' in t:
        return ResultType.SPURIOUS
    if 'adulterat' in t:
        return ResultType.ADULTERATED
    if 'misbrand' in t:
        return ResultType.MISBRANDED
    return ResultType.NSQ


def _parse_date(val: str) -> date:
    """Best-effort date parser for common Indian / CDSCO date formats."""
    if not val:
        return date.today()
    cleaned = re.sub(r'\s+', ' ', str(val)).strip()
    for fmt in ('%d/%m/%Y', '%d-%m-%Y', '%Y-%m-%d', '%d.%m.%Y', '%b %Y', '%B %Y'):
        try:
            return datetime.strptime(cleaned, fmt).date()
        except ValueError:
            continue
    return date.today()


def _map_headers(header_row: list) -> dict:
    """Map table column indices by matching CDSCO header keywords."""
    mapping = {}
    for idx, cell in enumerate(header_row):
        h = re.sub(r'\s+', ' ', str(cell or '')).strip().lower()
        if not h:
            continue
        if any(k in h for k in ('name of drug', 'drug name', 'brand', 'product')):
            mapping.setdefault('drug', idx)
        elif 'generic' in h or 'composition' in h:
            mapping.setdefault('generic', idx)
        elif 'batch' in h or 'b.no' in h or 'b no' in h:
            mapping.setdefault('batch', idx)
        elif 'mfg' in h or 'manufactur' in h or 'marketed' in h:
            mapping.setdefault('manufacturer', idx)
        elif 'reason' in h or 'remark' in h or 'failure' in h or 'result' in h or 'defect' in h:
            mapping.setdefault('reason', idx)
        elif 'lab' in h or 'tested' in h:
            mapping.setdefault('lab', idx)
        elif 'date' in h:
            mapping.setdefault('date', idx)
    return mapping


def parse_cdsco_pdf(pdf_source, source_label: str = 'CDSCO') -> dict:
    """
    Parse a CDSCO / State Lab NSQ PDF (file path, file-like object, or bytes)
    and insert records into staging (is_active=False) for Approver review.
    """
    if isinstance(pdf_source, (bytes, bytearray)):
        pdf_source = io.BytesIO(pdf_source)

    imported = []
    skipped = 0

    with pdfplumber.open(pdf_source) as pdf:
        for page in pdf.pages:
            tables = page.extract_tables() or []
            for table in tables:
                if not table or len(table) < 2:
                    continue

                # Find header row within first 3 rows
                header_idx = 0
                col_map = {}
                for i in range(min(3, len(table))):
                    candidate = _map_headers(table[i])
                    if 'drug' in candidate and 'batch' in candidate:
                        header_idx = i
                        col_map = candidate
                        break

                if not col_map:
                    # Fallback positional mapping for standard CDSCO 5+ col tables:
                    # [Sl.No, Drug Name, Batch No, Manufacturer, Reason/Lab]
                    if len(table[0]) >= 4:
                        col_map = {'drug': 1, 'batch': 2, 'manufacturer': 3, 'reason': 4}
                        header_idx = 0
                    else:
                        continue

                for row in table[header_idx + 1:]:
                    if not row or len(row) <= max(col_map.values()):
                        continue

                    def cell(key):
                        idx = col_map.get(key)
                        if idx is None or idx >= len(row):
                            return ''
                        return re.sub(r'\s+', ' ', str(row[idx] or '')).strip()

                    drug_name = cell('drug')
                    batch_no = cell('batch')
                    if not drug_name or not batch_no:
                        continue
                    # Skip repeated header rows across pages
                    if drug_name.lower().startswith('name of drug') or batch_no.lower().startswith('batch'):
                        continue

                    mfr_name = cell('manufacturer') or 'Unknown Manufacturer'
                    generic_name = cell('generic') or drug_name
                    reason = cell('reason') or 'Failed quality standard in CDSCO / Lab testing'
                    lab_name = cell('lab')
                    test_date = _parse_date(cell('date'))
                    result_type = _detect_result_type(reason)

                    # Manufacturer (unique license_number fallback)
                    mfr = Manufacturer.objects.filter(name__iexact=mfr_name).first()
                    if not mfr:
                        safe_lic = f"CDSCO-{abs(hash(mfr_name)) % 10**8}"
                        mfr, _ = Manufacturer.objects.get_or_create(
                            license_number=safe_lic,
                            defaults={'name': mfr_name[:255], 'state': 'India'},
                        )

                    drug, _ = Drug.objects.get_or_create(
                        brand_name=drug_name[:255],
                        defaults={'generic_name': generic_name[:255], 'manufacturer': mfr},
                    )

                    # Deduplicate by (drug, batch_no)
                    if LabResult.objects.filter(drug=drug, batch_no=batch_no[:100]).exists():
                        skipped += 1
                        continue

                    lab = Lab.objects.filter(name__icontains=lab_name).first() if lab_name else None

                    lr = LabResult.objects.create(
                        drug=drug,
                        batch_no=batch_no[:100],
                        lab=lab,
                        result_type=result_type,
                        test_date=test_date,
                        action_taken=reason,
                        source=source_label,
                        is_active=False,  # Staging: requires Data Approver sign-off
                    )
                    imported.append({
                        'id': lr.id,
                        'brand_name': drug.brand_name,
                        'batch_no': lr.batch_no,
                        'manufacturer': mfr.name,
                        'result_type': lr.result_type,
                        'test_date': str(lr.test_date),
                    })

    return {
        'imported_count': len(imported),
        'skipped_count': skipped,
        'records': imported,
    }
