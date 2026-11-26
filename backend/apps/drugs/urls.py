from django.urls import path
from .views import CitizenReportCreateView, CitizenReportTrackView

urlpatterns = [
    path('report/', CitizenReportCreateView.as_view(), name='citizen-report'),
    path('report/track/', CitizenReportTrackView.as_view(), name='citizen-report-track'),
]
