from django.urls import path
from .views import DrugSearchView

urlpatterns = [
    path('', DrugSearchView.as_view(), name='drug-search'),
]
