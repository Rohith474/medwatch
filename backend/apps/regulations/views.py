from rest_framework import generics, permissions
from rest_framework.response import Response
from .models import Regulation
from .serializers import RegulationSerializer


class RegulationListView(generics.ListAPIView):
    queryset = Regulation.objects.filter(is_active=True)
    serializer_class = RegulationSerializer
    permission_classes = [permissions.AllowAny]
    search_fields = ['title', 'issued_by', 'description']
    ordering_fields = ['issued_on']
