from django.urls import path
from .views import NotificationListView, VapidPublicKeyView, PushSubscribeView

urlpatterns = [
    path('', NotificationListView.as_view(), name='notification-list'),
    path('vapid-key/', VapidPublicKeyView.as_view(), name='notification-vapid-key'),
    path('subscribe/', PushSubscribeView.as_view(), name='notification-subscribe'),
]
