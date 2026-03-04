from rest_framework import serializers
from .models import Candidate, SkillMatch


class SkillMatchSerializer(serializers.ModelSerializer):
    class Meta:
        model = SkillMatch
        fields = ['id', 'skill_name', 'found', 'proficiency', 'evidence', 'is_required']


class CandidateListSerializer(serializers.ModelSerializer):
    skill_matches = SkillMatchSerializer(many=True, read_only=True)

    class Meta:
        model = Candidate
        fields = [
            'id', 'name', 'email', 'phone', 'overall_score',
            'skill_match_score', 'experience_score', 'education_score',
            'status', 'created_at', 'processed_at', 'skill_matches',
        ]


class CandidateDetailSerializer(serializers.ModelSerializer):
    skill_matches = SkillMatchSerializer(many=True, read_only=True)
    job_title = serializers.CharField(source='job.title', read_only=True)
    resume_url = serializers.SerializerMethodField()

    class Meta:
        model = Candidate
        fields = [
            'id', 'job', 'job_title', 'name', 'email', 'phone',
            'resume_file', 'resume_url', 'resume_text', 'parsed_data',
            'overall_score', 'skill_match_score', 'experience_score',
            'education_score', 'scoring_reasoning', 'strengths', 'red_flags',
            'status', 'processed_at', 'created_at', 'skill_matches',
        ]

    def get_resume_url(self, obj):
        if obj.resume_file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.resume_file.url)
            return obj.resume_file.url
        return None


class CandidateStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Candidate
        fields = ['status']
