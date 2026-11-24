from rest_framework import serializers
from .models import Drug, LabResult, Manufacturer
from apps.labs.models import Lab


class ManufacturerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Manufacturer
        fields = ['id', 'name', 'license_number', 'state', 'contact']


class LabSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lab
        fields = ['id', 'name', 'accreditation_no', 'state', 'lab_type']


class LabResultSerializer(serializers.ModelSerializer):
    lab = LabSerializer(read_only=True)

    class Meta:
        model = LabResult
        fields = [
            'id', 'batch_no', 'result_type', 'sample_id',
            'test_date', 'report_ref', 'action_taken', 'source', 'lab'
        ]


class DrugSerializer(serializers.ModelSerializer):
    manufacturer = ManufacturerSerializer(read_only=True)
    results = LabResultSerializer(many=True, read_only=True)

    class Meta:
        model = Drug
        fields = [
            'id', 'brand_name', 'generic_name', 'salt_composition',
            'dosage_form', 'manufacturer', 'results'
        ]
