from django.contrib import admin
from django.urls import path, include
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response


@api_view(['GET'])
@permission_classes([AllowAny])
def api_root(request):
    return Response({
        'name': 'MEDWATCH API - Kerala Drug Control Department',
        'version': 'v1',
        'status': 'healthy',
        'endpoints': {
            'search': '/api/v1/search/?q=<drug_name_or_batch>',
            'drugs': '/api/v1/drugs/',
            'notifications_alerts': '/api/v1/notifications/',
            'regulations': '/api/v1/regulations/',
            'auth': {
                'otp_request': '/api/v1/auth/otp/request/',
                'otp_verify': '/api/v1/auth/otp/verify/',
                'staff_login': '/api/v1/auth/staff/login/',
                'staff_manage': '/api/v1/auth/staff/manage/',
                'staff_stats': '/api/v1/auth/staff/stats/',
                'staff_pending': '/api/v1/auth/staff/pending-results/',
            },
            'admin_panel': '/admin/',
        },
        'frontend_ui': 'http://localhost:3000',
    })


urlpatterns = [
    path('', api_root, name='root'),
    path('api/v1/', api_root, name='api-root'),
    path('admin/', admin.site.urls),
    path('api/v1/drugs/', include('apps.drugs.urls')),
    path('api/v1/search/', include('apps.search.urls')),
    path('api/v1/auth/', include('apps.users.urls')),
    path('api/v1/regulations/', include('apps.regulations.urls')),
    path('api/v1/notifications/', include('apps.notifications.urls')),
]

