from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from django.db.models import Q
from apps.drugs.models import Drug, LabResult
from .models import SearchLog
from .serializers import SearchResultSerializer, SuggestedMatchSerializer


RESULT_LABELS = {
    'NSQ':         'NSQ FOUND — Batch failed lab quality test.',
    'SPURIOUS':    'SPURIOUS DRUG — Fake / counterfeit drug identified.',
    'ADULTERATED': 'ADULTERATED — Drug contains harmful substances.',
    'MISBRANDED':  'MISBRANDED — Incorrect label or identity.',
    'NO_ADVERSE':  'NO ADVERSE REPORT FOUND — Not in any failed list. This is NOT a quality clearance.',
}

# DATA_UNAVAILABLE is returned when input is insufficient (handled separately in the view)


class DrugSearchView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        batch_no = request.data.get('batch_no', '').strip()
        drug_name = request.data.get('drug_name', '').strip()

        if not batch_no or not drug_name:
            return Response(
                {'status': 'DATA_UNAVAILABLE', 'message': 'Both batch number and drug name are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Step 1: Exact batch + drug name match
        result = LabResult.objects.filter(
            batch_no__iexact=batch_no,
            is_active=True
        ).filter(
            Q(drug__brand_name__iexact=drug_name) |
            Q(drug__generic_name__iexact=drug_name)
        ).select_related('drug', 'drug__manufacturer', 'lab').first()

        if result:
            data = self._build_result(result, batch_no)
            self._log_search(request, batch_no, drug_name, result.result_type)
            return Response({'status': 'FOUND', 'result': data})

        # Step 2: Fuzzy drug name match (pg_trgm similarity)
        try:
            from django.db import connection
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT id FROM apps_drugs_drug
                    WHERE similarity(brand_name, %s) > 0.3
                       OR similarity(generic_name, %s) > 0.3
                    ORDER BY GREATEST(similarity(brand_name, %s), similarity(generic_name, %s)) DESC
                    LIMIT 5
                    """,
                    [drug_name, drug_name, drug_name, drug_name]
                )
                similar_ids = [row[0] for row in cursor.fetchall()]
        except Exception:
            similar_ids = []

        if similar_ids:
            suggestions = Drug.objects.filter(id__in=similar_ids)
            self._log_search(request, batch_no, drug_name, 'NO_ADVERSE')
            return Response({
                'status': 'NO_MATCH_SUGGESTIONS',
                'message': 'No exact match found. Did you mean one of these?',
                'suggestions': SuggestedMatchSerializer(suggestions, many=True).data
            })

        # Step 3: No match at all
        self._log_search(request, batch_no, drug_name, 'NO_ADVERSE')
        return Response({
            'status': 'NO_ADVERSE',
            'message': RESULT_LABELS['NO_ADVERSE']
        })

    def _build_result(self, result: LabResult, batch_no: str) -> dict:
        drug = result.drug
        lab = result.lab
        manufacturer = drug.manufacturer
        return {
            'brand_name': drug.brand_name,
            'generic_name': drug.generic_name,
            'salt_composition': drug.salt_composition,
            'dosage_form': drug.dosage_form,
            'batch_no': batch_no,
            'manufacturer_name': manufacturer.name if manufacturer else '',
            'manufacturer_license': manufacturer.license_number if manufacturer else '',
            'result_status': result.result_type,
            'result_label': RESULT_LABELS.get(result.result_type, result.result_type),
            'lab_name': lab.name if lab else '',
            'lab_accreditation': lab.accreditation_no if lab else '',
            'report_ref': result.report_ref,
            'sample_id': result.sample_id,
            'test_date': result.test_date,
            'action_taken': result.action_taken,
            'source': result.source,
        }

    def _log_search(self, request, batch_no, drug_name, result_shown):
        user = request.user if request.user.is_authenticated else None
        
        # Privacy & DPDP Act 2023 Compliance:
        # Anonymize client IP before writing to audit database (masking last octet)
        raw_ip = request.META.get('REMOTE_ADDR', '')
        if raw_ip and '.' in raw_ip:
            parts = raw_ip.split('.')
            anonymized_ip = f"{parts[0]}.{parts[1]}.{parts[2]}.0"  # e.g., 192.168.1.0
        elif raw_ip and ':' in raw_ip:
            parts = raw_ip.split(':')
            anonymized_ip = f"{':'.join(parts[:3])}::"  # IPv6 subnet prefix
        else:
            anonymized_ip = None

        SearchLog.objects.create(
            batch_no=batch_no,
            drug_name=drug_name,
            result_shown=result_shown,
            user=user,
            ip_address=anonymized_ip
        )
