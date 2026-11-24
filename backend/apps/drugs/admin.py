from django.contrib import admin
from django.utils.html import format_html
from .models import Manufacturer, Drug, LabResult


def get_role(user):
    if user.is_superuser:
        return 'SUPER_ADMIN'
    try:
        return user.admin_profile.role
    except Exception:
        return None


RESULT_COLORS = {
    'NSQ': '#dc2626',
    'SPURIOUS': '#ea580c',
    'ADULTERATED': '#d97706',
    'MISBRANDED': '#db2777',
    'NO_ADVERSE': '#16a34a',
}


# ─── Manufacturer ────────────────────────────────────────────────────────────

@admin.register(Manufacturer)
class ManufacturerAdmin(admin.ModelAdmin):
    list_display = ['name', 'license_number', 'state', 'contact']
    search_fields = ['name', 'license_number']
    list_filter = ['state']

    def has_view_permission(self, request, obj=None):
        return get_role(request.user) in ('SUPER_ADMIN', 'APPROVER', 'UPLOADER')

    def has_add_permission(self, request):
        return get_role(request.user) in ('SUPER_ADMIN', 'UPLOADER')

    def has_change_permission(self, request, obj=None):
        return get_role(request.user) in ('SUPER_ADMIN', 'UPLOADER')

    def has_delete_permission(self, request, obj=None):
        return get_role(request.user) == 'SUPER_ADMIN'


# ─── Drug ─────────────────────────────────────────────────────────────────────

@admin.register(Drug)
class DrugAdmin(admin.ModelAdmin):
    list_display = ['brand_name', 'generic_name', 'dosage_form', 'manufacturer']
    search_fields = ['brand_name', 'generic_name', 'salt_composition']
    list_filter = ['dosage_form', 'manufacturer__state']
    raw_id_fields = ['manufacturer']

    def has_view_permission(self, request, obj=None):
        return get_role(request.user) in ('SUPER_ADMIN', 'APPROVER', 'UPLOADER')

    def has_add_permission(self, request):
        return get_role(request.user) in ('SUPER_ADMIN', 'UPLOADER')

    def has_change_permission(self, request, obj=None):
        return get_role(request.user) in ('SUPER_ADMIN', 'UPLOADER')

    def has_delete_permission(self, request, obj=None):
        return get_role(request.user) == 'SUPER_ADMIN'


# ─── Lab Result ───────────────────────────────────────────────────────────────

@admin.register(LabResult)
class LabResultAdmin(admin.ModelAdmin):
    list_display = ['drug', 'batch_no', 'result_badge', 'lab', 'test_date', 'source', 'approval_status']
    search_fields = ['batch_no', 'drug__brand_name', 'drug__generic_name']
    list_filter = ['result_type', 'source', 'is_active']
    raw_id_fields = ['drug', 'lab']
    date_hierarchy = 'test_date'

    def result_badge(self, obj):
        color = RESULT_COLORS.get(obj.result_type, '#6b7280')
        return format_html(
            '<span style="background:{};color:white;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:700;">{}</span>',
            color, obj.get_result_type_display()
        )
    result_badge.short_description = 'Result'

    def approval_status(self, obj):
        if obj.is_active:
            return format_html('<span style="color:#16a34a;font-weight:700;">✅ Live</span>')
        return format_html('<span style="color:#dc2626;font-weight:700;">⏳ Pending Approval</span>')
    approval_status.short_description = 'Status'

    def get_readonly_fields(self, request, obj=None):
        role = get_role(request.user)
        # Approvers can ONLY change is_active (approve/reject)
        if role == 'APPROVER':
            all_fields = [f.name for f in self.model._meta.fields]
            return [f for f in all_fields if f != 'is_active']
        return []

    def has_view_permission(self, request, obj=None):
        return get_role(request.user) in ('SUPER_ADMIN', 'APPROVER', 'UPLOADER')

    def has_add_permission(self, request):
        return get_role(request.user) in ('SUPER_ADMIN', 'UPLOADER')

    def has_change_permission(self, request, obj=None):
        # Uploaders add; Approvers can only flip is_active
        return get_role(request.user) in ('SUPER_ADMIN', 'APPROVER', 'UPLOADER')

    def has_delete_permission(self, request, obj=None):
        return get_role(request.user) == 'SUPER_ADMIN'
