from django.contrib import admin
from .models import Job


@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    list_display = ['title', 'organization', 'created_by', 'status', 'candidate_count', 'created_at']
    list_filter = ['status', 'created_at', 'organization']
    search_fields = ['title', 'description']
