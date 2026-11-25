from django.conf import settings
from rest_framework import generics, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Notification, PushSubscription
from .serializers import NotificationSerializer


class NotificationListView(generics.ListAPIView):
    """Public read-only endpoint for live alerts — no login required."""
    serializer_class = NotificationSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return Notification.objects.filter(is_sent=True).order_by('-sent_at')[:50]


class VapidPublicKeyView(APIView):
    """Return the VAPID public key so browsers can subscribe to free Web Push."""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({'public_key': settings.VAPID_PUBLIC_KEY})


class PushSubscribeView(APIView):
    """Save an anonymous browser push subscription."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        endpoint = request.data.get('endpoint', '').strip()
        keys = request.data.get('keys') or {}
        p256dh = keys.get('p256dh', '').strip()
        auth = keys.get('auth', '').strip()

        if not endpoint or not p256dh or not auth:
            return Response({'error': 'Invalid push subscription payload.'}, status=400)

        sub, created = PushSubscription.objects.update_or_create(
            endpoint=endpoint,
            defaults={'p256dh': p256dh, 'auth': auth},
        )
        return Response({
            'message': 'Subscribed to live MEDWATCH alerts.',
            'id': sub.id,
            'created': created,
        }, status=201 if created else 200)
