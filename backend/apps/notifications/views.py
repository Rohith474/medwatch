from rest_framework import generics, permissions
from .models import Notification
from .serializers import NotificationSerializer


class NotificationListView(generics.ListAPIView):
    """Public read-only endpoint for live alerts — no login required."""
    serializer_class = NotificationSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return Notification.objects.filter(is_sent=True).order_by('-sent_at')[:50]

