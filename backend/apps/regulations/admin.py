from django.contrib import admin
from django.utils.html import format_html
from .models import Regulation


def get_role(user):
    if user.is_superuser:
        return 'SUPER_ADMIN'
    try:
        return user.admin_profile.role
    except Exception:
        return None


@admin.register(Regulation)
class RegulationAdmin(admin.ModelAdmin):
    list_display = ['title', 'issued_by', 'issued_on', 'active_badge']
    search_fields = ['title', 'issued_by', 'description']
    list_filter = ['issued_by', 'is_active']
    date_hierarchy = 'issued_on'

    def active_badge(self, obj):
        if obj.is_active:
            return format_html('<span style="color:#16a34a;font-weight:700;">✅ Active</span>')
        return format_html('<span style="color:#9ca3af;">— Archived</span>')
    active_badge.short_description = 'Status'

    # Department Officers + Super Admin can manage regulations
    def has_view_permission(self, request, obj=None):
        return get_role(request.user) in ('SUPER_ADMIN', 'DEPT_OFFICER', 'APPROVER')

    def has_add_permission(self, request):
        return get_role(request.user) in ('SUPER_ADMIN', 'DEPT_OFFICER')

    def has_change_permission(self, request, obj=None):
        return get_role(request.user) in ('SUPER_ADMIN', 'DEPT_OFFICER')

    def has_delete_permission(self, request, obj=None):
        return get_role(request.user) == 'SUPER_ADMIN'
