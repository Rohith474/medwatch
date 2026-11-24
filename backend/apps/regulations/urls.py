from django.urls import path
from .views import RegulationListView

urlpatterns = [
    path('', RegulationListView.as_view(), name='regulation-list'),
]
