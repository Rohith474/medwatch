from rest_framework import serializers
from apps.drugs.models import Drug, LabResult, Manufacturer
from apps.labs.models import Lab


class SearchResultSerializer(serializers.Serializer):
    """Full result card shown to the citizen."""
    brand_name = serializers.CharField()
    generic_name = serializers.CharField()
    salt_composition = serializers.CharField()
    dosage_form = serializers.CharField()
    batch_no = serializers.CharField()
    manufacturer_name = serializers.CharField()
    manufacturer_license = serializers.CharField()
    result_status = serializers.CharField()
    result_label = serializers.CharField()
    lab_name = serializers.CharField()
    lab_accreditation = serializers.CharField()
    report_ref = serializers.CharField()
    sample_id = serializers.CharField()
    test_date = serializers.DateField()
    action_taken = serializers.CharField()
    source = serializers.CharField()


class SuggestedMatchSerializer(serializers.ModelSerializer):
    """Partial match / suggestion when exact search fails."""
    manufacturer_name = serializers.CharField(source='manufacturer.name')

    class Meta:
        model = Drug
        fields = ['id', 'brand_name', 'generic_name', 'manufacturer_name']
