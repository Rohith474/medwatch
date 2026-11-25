from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    OTPRequestView, OTPVerifyView, UserProfileView,
    StaffLoginView, StaffPendingResultsView, StaffAddDrugView,
    StaffAddRegulationView, StaffDashboardStatsView,
    StaffManagementView, StaffVerifyView, StaffChangePasswordView,
    StaffSendNotificationView, StaffRegisterView,
    StaffDeleteView, StaffDrugManageView, StaffCDSCOImportView,
)

urlpatterns = [
    # Public auth
    path('otp/request/', OTPRequestView.as_view(), name='otp-request'),
    path('otp/verify/', OTPVerifyView.as_view(), name='otp-verify'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('profile/', UserProfileView.as_view(), name='user-profile'),

    # Staff portal — authentication
    path('staff/register/', StaffRegisterView.as_view(), name='staff-register'),
    path('staff/login/', StaffLoginView.as_view(), name='staff-login'),
    path('staff/change-password/', StaffChangePasswordView.as_view(), name='staff-change-password'),

    # Staff portal — data operations
    path('staff/cdsco-import/', StaffCDSCOImportView.as_view(), name='staff-cdsco-import'),
    path('staff/drugs/', StaffDrugManageView.as_view(), name='staff-drugs-list'),
    path('staff/drugs/<int:pk>/', StaffDrugManageView.as_view(), name='staff-drugs-detail'),
    path('staff/pending-results/', StaffPendingResultsView.as_view(), name='staff-pending'),
    path('staff/pending-results/<int:pk>/', StaffPendingResultsView.as_view(), name='staff-approve'),
    path('staff/add-drug/', StaffAddDrugView.as_view(), name='staff-add-drug'),
    path('staff/regulations/', StaffAddRegulationView.as_view(), name='staff-regulations'),
    path('staff/regulations/<int:pk>/', StaffAddRegulationView.as_view(), name='staff-regulations-delete'),
    path('staff/stats/', StaffDashboardStatsView.as_view(), name='staff-stats'),
    path('staff/notifications/send/', StaffSendNotificationView.as_view(), name='staff-notify'),

    # Staff management — Super Admin only
    path('staff/manage/', StaffManagementView.as_view(), name='staff-manage'),
    path('staff/manage/<int:pk>/', StaffDeleteView.as_view(), name='staff-delete'),
    path('staff/manage/<int:pk>/verify/', StaffVerifyView.as_view(), name='staff-verify'),
]
