from django.contrib import admin
from .models import EmailTemplate, SentEmail


@admin.register(EmailTemplate)
class EmailTemplateAdmin(admin.ModelAdmin):
    list_display = ['name', 'type', 'organization', 'is_default', 'created_at']
    list_filter = ['type', 'is_default']
    search_fields = ['name', 'subject']


@admin.register(SentEmail)
class SentEmailAdmin(admin.ModelAdmin):
    list_display = ['recipient_email', 'subject', 'status', 'sender', 'sent_at']
    list_filter = ['status', 'sent_at']
    search_fields = ['recipient_email', 'subject']
    readonly_fields = ['sent_at']
