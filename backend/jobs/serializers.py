from rest_framework import serializers
from .models import Job


class JobSerializer(serializers.ModelSerializer):
    candidate_count = serializers.IntegerField(read_only=True, required=False)
    average_score = serializers.FloatField(read_only=True, required=False)

    class Meta:
        model = Job
        fields = [
            'id', 'title', 'description', 'required_skills',
            'nice_to_have_skills', 'min_experience_years', 'status',
            'candidate_count', 'average_score', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class JobCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Job
        fields = ['title', 'description', 'required_skills', 'nice_to_have_skills', 'min_experience_years', 'status']
        extra_kwargs = {
            'required_skills': {'required': False},
            'nice_to_have_skills': {'required': False},
            'min_experience_years': {'required': False},
        }
