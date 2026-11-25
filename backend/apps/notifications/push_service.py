import json
from django.conf import settings
from pywebpush import webpush, WebPushException
from .models import PushSubscription


def send_web_push_to_all(notification) -> dict:
    """
    Send a DPDP-safe discreet Web Push notification to all subscribed browsers/phones.
    100% free via VAPID (no SMS or paid push gateway required).
    """
    payload = json.dumps({
        'title': notification.discreet_title or 'MEDWATCH Health Advisory',
        'body': notification.discreet_body or 'Important safety update available. Tap to view.',
        'severity': notification.severity,
        'url': '/alerts',
        'id': notification.id,
    })

    sent = 0
    failed = 0
    for sub in PushSubscription.objects.all():
        try:
            webpush(
                subscription_info={
                    'endpoint': sub.endpoint,
                    'keys': {
                        'p256dh': sub.p256dh,
                        'auth': sub.auth,
                    },
                },
                data=payload,
                vapid_private_key=settings.VAPID_PRIVATE_KEY,
                vapid_claims={'sub': settings.VAPID_ADMIN_EMAIL},
                timeout=5,
            )
            sent += 1
        except WebPushException as exc:
            failed += 1
            # Remove expired / unsubscribed endpoints (404 or 410)
            if exc.response is not None and exc.response.status_code in (404, 410):
                sub.delete()
        except Exception:
            failed += 1

    return {'sent': sent, 'failed': failed}
