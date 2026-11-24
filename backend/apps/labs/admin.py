from django.contrib import admin
from .models import Lab


@admin.register(Lab)
class LabAdmin(admin.ModelAdmin):
    list_display = ['name', 'state', 'lab_type', 'accreditation_no', 'is_active']
    search_fields = ['name', 'accreditation_no']
    list_filter = ['lab_type', 'state', 'is_active']
