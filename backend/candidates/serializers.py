from rest_framework import serializers
from .models import Candidate, SkillMatch, CandidateNote, ProcessingBatch


class SkillMatchSerializer(serializers.ModelSerializer):
    class Meta:
        model = SkillMatch
        fields = ['id', 'skill_name', 'found', 'proficiency', 'evidence', 'is_required']


class CandidateNoteSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_name = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = CandidateNote
        fields = ['id', 'content', 'user_email', 'user_name', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class CandidateListSerializer(serializers.ModelSerializer):
    skill_matches = SkillMatchSerializer(many=True, read_only=True)
    note_count = serializers.SerializerMethodField()

    class Meta:
        model = Candidate
        fields = [
            'id', 'name', 'email', 'phone', 'overall_score',
            'skill_match_score', 'experience_score', 'education_score',
            'status', 'created_at', 'processed_at', 'skill_matches',
            'note_count',
        ]

    def get_note_count(self, obj):
        return obj.notes.count()


class CandidateDetailSerializer(serializers.ModelSerializer):
    skill_matches = SkillMatchSerializer(many=True, read_only=True)
    notes = CandidateNoteSerializer(many=True, read_only=True)
    job_title = serializers.CharField(source='job.title', read_only=True)
    resume_url = serializers.SerializerMethodField()

    class Meta:
        model = Candidate
        fields = [
            'id', 'job', 'job_title', 'name', 'email', 'phone',
            'resume_url', 'resume_text', 'parsed_data',
            'overall_score', 'skill_match_score', 'experience_score',
            'education_score', 'scoring_reasoning', 'strengths', 'red_flags',
            'status', 'processed_at', 'created_at', 'skill_matches', 'notes',
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


class ProcessingBatchSerializer(serializers.ModelSerializer):
    progress_percentage = serializers.FloatField(read_only=True)
    job_title = serializers.CharField(source='job.title', read_only=True)

    class Meta:
        model = ProcessingBatch
        fields = [
            'id', 'job', 'job_title', 'total_count', 'processed_count',
            'failed_count', 'status', 'progress_percentage',
            'started_at', 'completed_at',
        ]
        read_only_fields = ['id', 'started_at', 'completed_at']


class CandidateCompareSerializer(serializers.Serializer):
    candidate_ids = serializers.ListField(
        child=serializers.IntegerField(),
        min_length=2,
        max_length=5,
    )
