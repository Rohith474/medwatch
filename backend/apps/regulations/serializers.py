from rest_framework import serializers
from .models import Regulation


class RegulationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Regulation
        fields = ['id', 'title', 'description', 'issued_by', 'issued_on', 'pdf_url', 'pdf_file']
