import requests
from celery import shared_task
from .cdsco_parser import parse_cdsco_pdf


@shared_task(name='apps.drugs.tasks.ingest_cdsco_pdf_from_url')
def ingest_cdsco_pdf_from_url(pdf_url: str, source_label: str = 'CDSCO') -> dict:
    """Download a CDSCO NSQ PDF from a URL and stage records for Approver review."""
    resp = requests.get(pdf_url, timeout=30)
    resp.raise_for_status()
    return parse_cdsco_pdf(resp.content, source_label=source_label)


@shared_task(name='apps.drugs.tasks.ingest_cdsco_pdf_file')
def ingest_cdsco_pdf_file(file_path: str, source_label: str = 'CDSCO') -> dict:
    """Parse a local CDSCO NSQ PDF file and stage records for Approver review."""
    return parse_cdsco_pdf(file_path, source_label=source_label)
