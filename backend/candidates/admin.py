from django.contrib import admin
from .models import Candidate, SkillMatch


@admin.register(Candidate)
class CandidateAdmin(admin.ModelAdmin):
    list_display = ['name', 'job', 'overall_score', 'status', 'created_at']
    list_filter = ['status', 'job']
    search_fields = ['name', 'email']


@admin.register(SkillMatch)
class SkillMatchAdmin(admin.ModelAdmin):
    list_display = ['candidate', 'skill_name', 'found', 'proficiency', 'is_required']
    list_filter = ['found', 'proficiency', 'is_required']
