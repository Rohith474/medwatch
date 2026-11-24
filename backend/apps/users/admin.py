from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from .models import User, OTPRecord, AdminUser


def get_role(user):
    """Returns the AdminUser role string, or 'SUPER_ADMIN' for Django superusers."""
    if user.is_superuser:
        return 'SUPER_ADMIN'
    try:
        return user.admin_profile.role
    except AdminUser.DoesNotExist:
        return None


# ─── User ───────────────────────────────────────────────────────────────────

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['name', 'mobile', 'email', 'role_badge', 'is_active', 'registered_at']
    search_fields = ['name', 'mobile', 'email']
    list_filter = ['is_active', 'is_staff']
    ordering = ['-registered_at']
    fieldsets = (
        (None, {'fields': ('mobile', 'password')}),
        ('Personal Info', {'fields': ('name', 'email', 'state', 'district')}),
        ('Privacy', {'fields': ('privacy_mode', 'fcm_token')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('mobile', 'name', 'password1', 'password2'),
        }),
    )

    def role_badge(self, obj):
        try:
            role = obj.admin_profile.get_role_display()
            colors = {
                'Super Admin': '#1e40af',
                'Data Approver': '#7c3aed',
                'Data Uploader': '#0891b2',
                'Department Officer': '#059669',
            }
            color = colors.get(role, '#6b7280')
            return format_html(
                '<span style="background:{};color:white;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:700;">{}</span>',
                color, role
            )
        except AdminUser.DoesNotExist:
            return format_html('<span style="color:#9ca3af;font-size:11px;">No Role</span>')
    role_badge.short_description = 'Admin Role'

    def has_view_permission(self, request, obj=None):
        return get_role(request.user) == 'SUPER_ADMIN'

    def has_add_permission(self, request):
        return get_role(request.user) == 'SUPER_ADMIN'

    def has_change_permission(self, request, obj=None):
        return get_role(request.user) == 'SUPER_ADMIN'

    def has_delete_permission(self, request, obj=None):
        return get_role(request.user) == 'SUPER_ADMIN'


# ─── OTP Record ─────────────────────────────────────────────────────────────

@admin.register(OTPRecord)
class OTPRecordAdmin(admin.ModelAdmin):
    list_display = ['mobile', 'created_at', 'is_used', 'expires_at']
    list_filter = ['is_used']
    search_fields = ['mobile']

    def has_view_permission(self, request, obj=None):
        return get_role(request.user) == 'SUPER_ADMIN'

    def has_add_permission(self, request):
        return False  # OTPs are system-generated only

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return get_role(request.user) == 'SUPER_ADMIN'


# ─── Admin User Profiles ─────────────────────────────────────────────────────

@admin.register(AdminUser)
class AdminUserAdmin(admin.ModelAdmin):
    list_display = ['user', 'role_badge', 'department', 'created_at']
    list_filter = ['role']
    search_fields = ['user__name', 'user__mobile']
    autocomplete_fields = ['user']

    def role_badge(self, obj):
        colors = {
            'SUPER_ADMIN': '#1e40af',
            'APPROVER': '#7c3aed',
            'UPLOADER': '#0891b2',
            'DEPT_OFFICER': '#059669',
        }
        color = colors.get(obj.role, '#6b7280')
        return format_html(
            '<span style="background:{};color:white;padding:2px 10px;border-radius:12px;font-size:11px;font-weight:700;">{}</span>',
            color, obj.get_role_display()
        )
    role_badge.short_description = 'Role'

    def has_view_permission(self, request, obj=None):
        return get_role(request.user) == 'SUPER_ADMIN'

    def has_add_permission(self, request):
        return get_role(request.user) == 'SUPER_ADMIN'

    def has_change_permission(self, request, obj=None):
        return get_role(request.user) == 'SUPER_ADMIN'

    def has_delete_permission(self, request, obj=None):
        return get_role(request.user) == 'SUPER_ADMIN'
