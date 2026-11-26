from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import CitizenReport


class CitizenReportCreateView(APIView):
    """Anonymous public endpoint for citizens to report suspected fake or adverse medicines."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        d = request.data
        drug_name = d.get('drug_name', '').strip()
        description = d.get('description', '').strip()

        if not drug_name or not description:
            return Response(
                {'error': 'Drug name and description of the issue are required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        issue_type = d.get('issue_type', 'SUSPECTED_FAKE').strip()
        valid_types = dict(CitizenReport.ISSUE_TYPES)
        if issue_type not in valid_types:
            issue_type = 'SUSPECTED_FAKE'

        report = CitizenReport.objects.create(
            drug_name=drug_name[:255],
            batch_no=d.get('batch_no', '').strip()[:100],
            manufacturer_name=d.get('manufacturer_name', '').strip()[:255],
            issue_type=issue_type,
            pharmacy_or_location=d.get('pharmacy_or_location', '').strip()[:255],
            district=d.get('district', '').strip()[:100],
            description=description,
            reporter_contact=d.get('reporter_contact', '').strip()[:100],
        )

        return Response({
            'message': 'Thank you. Your report has been submitted to Kerala Drug Control Inspectors.',
            'report_id': report.id,
            'reference_code': f'MW-RPT-{report.id}',
        }, status=status.HTTP_201_CREATED)


class CitizenReportTrackView(APIView):
    """Anonymous status tracker for citizen reports by reference code (e.g. MW-RPT-2)."""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        ref = request.GET.get('ref', '').strip().upper()
        if not ref:
            return Response({'error': 'Please enter a reference code (e.g. MW-RPT-2).'}, status=400)

        num_str = ref.replace('MW-RPT-', '').strip()
        if not num_str.isdigit():
            return Response({'error': 'Invalid reference format. Example: MW-RPT-2'}, status=400)

        try:
            r = CitizenReport.objects.get(pk=int(num_str))
        except CitizenReport.DoesNotExist:
            return Response({'error': f'No report found for {ref}.'}, status=404)

        return Response({
            'reference_code': f'MW-RPT-{r.id}',
            'drug_name': r.drug_name,
            'batch_no': r.batch_no,
            'issue_label': r.get_issue_type_display(),
            'district': r.district,
            'status': r.status,
            'inspector_notes': r.inspector_notes,
            'created_at': r.created_at.strftime('%d %b %Y, %I:%M %p'),
        })
