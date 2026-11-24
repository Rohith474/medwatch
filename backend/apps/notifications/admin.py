from django.contrib import admin
from django.utils.html import format_html
from .models import Notification


def get_role(user):
    if user.is_superuser:
        return 'SUPER_ADMIN'
    try:
        return user.admin_profile.role
    except Exception:
        return None


SEVERITY_COLORS = {
    'CRITICAL': '#dc2626',
    'STANDARD': '#ea580c',
    'ADVISORY': '#ca8a04',
}


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['title', 'severity_badge', 'affected_batch', 'sent_status', 'sent_at', 'created_by']
    search_fields = ['title', 'body', 'affected_batch']
    list_filter = ['severity', 'is_sent']
    raw_id_fields = ['drug', 'created_by', 'approved_by']
    readonly_fields = ['sent_at', 'created_by', 'approved_by']

    fieldsets = (
        ('Alert Info', {
            'fields': ('title', 'body', 'severity', 'affected_batch', 'drug')
        }),
        ('Privacy (Lock Screen Safe)', {
            'fields': ('discreet_title', 'discreet_body'),
            'description': 'These are shown on device lock screens — no drug name visible (DPDP Act 2023)'
        }),
        ('Status', {
            'fields': ('is_sent', 'sent_at', 'created_by', 'approved_by'),
        }),
    )

    def severity_badge(self, obj):
        color = SEVERITY_COLORS.get(obj.severity, '#6b7280')
        return format_html(
            '<span style="background:{};color:white;padding:2px 10px;border-radius:12px;font-size:11px;font-weight:700;">{}</span>',
            color, obj.severity
        )
    severity_badge.short_description = 'Severity'

    def sent_status(self, obj):
        if obj.is_sent:
            return format_html('<span style="color:#16a34a;font-weight:700;">✅ Sent</span>')
        return format_html('<span style="color:#dc2626;font-weight:700;">⏳ Pending</span>')
    sent_status.short_description = 'Sent?'

    def save_model(self, request, obj, form, change):
        if not change:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)

    # Only Super Admin can send/manage notifications
    def has_view_permission(self, request, obj=None):
        return get_role(request.user) in ('SUPER_ADMIN', 'APPROVER')

    def has_add_permission(self, request):
        return get_role(request.user) == 'SUPER_ADMIN'

    def has_change_permission(self, request, obj=None):
        return get_role(request.user) == 'SUPER_ADMIN'

    def has_delete_permission(self, request, obj=None):
        return get_role(request.user) == 'SUPER_ADMIN'
