from django.contrib import admin
from .models import SearchLog


@admin.register(SearchLog)
class SearchLogAdmin(admin.ModelAdmin):
    list_display = ['batch_no', 'drug_name', 'result_shown', 'timestamp', 'ip_address']
    search_fields = ['batch_no', 'drug_name']
    list_filter = ['result_shown']
    date_hierarchy = 'timestamp'
    readonly_fields = ['batch_no', 'drug_name', 'result_shown', 'timestamp', 'ip_address', 'user']
