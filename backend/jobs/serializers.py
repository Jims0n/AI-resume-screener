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

    def _validate_skill_list(self, value, field_name):
        if not isinstance(value, list):
            raise serializers.ValidationError(f'{field_name} must be a list.')
        for item in value:
            if not isinstance(item, str) or not item.strip():
                raise serializers.ValidationError(f'Each item in {field_name} must be a non-empty string.')
        return [item.strip() for item in value]

    def validate_required_skills(self, value):
        return self._validate_skill_list(value, 'required_skills')

    def validate_nice_to_have_skills(self, value):
        return self._validate_skill_list(value, 'nice_to_have_skills')

    def validate_min_experience_years(self, value):
        if value < 0:
            raise serializers.ValidationError('Minimum experience years cannot be negative.')
        return value
