from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    drug_name = serializers.CharField(source='drug.brand_name', read_only=True, default='')

    class Meta:
        model = Notification
        fields = [
            'id', 'title', 'body', 'discreet_title', 'discreet_body',
            'severity', 'affected_batch', 'drug_name', 'sent_at'
        ]
