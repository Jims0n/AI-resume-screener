from django.contrib import admin
from .models import Candidate, SkillMatch, CandidateNote, ProcessingBatch


@admin.register(Candidate)
class CandidateAdmin(admin.ModelAdmin):
    list_display = ['name', 'job', 'overall_score', 'status', 'created_at']
    list_filter = ['status', 'job']
    search_fields = ['name', 'email']


@admin.register(SkillMatch)
class SkillMatchAdmin(admin.ModelAdmin):
    list_display = ['candidate', 'skill_name', 'found', 'proficiency', 'is_required']
    list_filter = ['found', 'proficiency', 'is_required']


@admin.register(CandidateNote)
class CandidateNoteAdmin(admin.ModelAdmin):
    list_display = ['candidate', 'user', 'created_at']
    search_fields = ['content', 'candidate__name']


@admin.register(ProcessingBatch)
class ProcessingBatchAdmin(admin.ModelAdmin):
    list_display = ['job', 'total_count', 'processed_count', 'failed_count', 'status', 'started_at']
    list_filter = ['status']
    readonly_fields = ['started_at', 'completed_at']
