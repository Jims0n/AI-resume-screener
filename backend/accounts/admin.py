from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth import get_user_model

from .models import Organization, OrganizationInvite, ActivityLog

User = get_user_model()


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['username', 'email', 'organization', 'role', 'is_active', 'date_joined']
    list_filter = ['role', 'is_active', 'is_staff', 'organization']
    search_fields = ['username', 'email', 'company']
    ordering = ['-date_joined']
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Profile', {'fields': ('company', 'organization', 'role', 'avatar')}),
    )


@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'max_jobs', 'max_resumes_per_job', 'max_users', 'created_at']
    search_fields = ['name', 'slug']
    readonly_fields = ['created_at']


@admin.register(OrganizationInvite)
class OrganizationInviteAdmin(admin.ModelAdmin):
    list_display = ['email', 'organization', 'role', 'status', 'created_at', 'expires_at']
    list_filter = ['status', 'role']
    search_fields = ['email']
    readonly_fields = ['token', 'created_at']


@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    list_display = ['user', 'action', 'target_type', 'target_id', 'organization', 'created_at']
    list_filter = ['action', 'target_type', 'created_at']
    search_fields = ['user__email', 'action']
    readonly_fields = ['created_at']
