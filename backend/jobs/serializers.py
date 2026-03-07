from rest_framework import serializers
from .models import Job


class JobSerializer(serializers.ModelSerializer):
    candidate_count = serializers.IntegerField(read_only=True, required=False)
    average_score = serializers.FloatField(read_only=True, required=False)
    created_by_email = serializers.CharField(source='created_by.email', read_only=True, default=None)

    class Meta:
        model = Job
        fields = [
            'id', 'title', 'description', 'required_skills',
            'nice_to_have_skills', 'min_experience_years', 'status',
            'skill_weight', 'experience_weight', 'education_weight',
            'custom_criteria', 'candidate_count', 'average_score',
            'created_by_email', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class JobCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Job
        fields = [
            'title', 'description', 'required_skills', 'nice_to_have_skills',
            'min_experience_years', 'status', 'skill_weight',
            'experience_weight', 'education_weight', 'custom_criteria',
        ]
        extra_kwargs = {
            'required_skills': {'required': False},
            'nice_to_have_skills': {'required': False},
            'min_experience_years': {'required': False},
            'skill_weight': {'required': False},
            'experience_weight': {'required': False},
            'education_weight': {'required': False},
            'custom_criteria': {'required': False},
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

    def validate(self, attrs):
        skill_w = attrs.get('skill_weight', 0.5)
        exp_w = attrs.get('experience_weight', 0.3)
        edu_w = attrs.get('education_weight', 0.2)
        total = skill_w + exp_w + edu_w
        if total > 1.01:
            raise serializers.ValidationError(
                {'detail': f'Scoring weights must sum to 1.0 or less. Current sum: {total:.2f}'}
            )

        custom_criteria = attrs.get('custom_criteria', [])
        if custom_criteria:
            for criterion in custom_criteria:
                if not isinstance(criterion, dict):
                    raise serializers.ValidationError(
                        {'custom_criteria': 'Each criterion must be an object.'}
                    )
                if 'name' not in criterion:
                    raise serializers.ValidationError(
                        {'custom_criteria': 'Each criterion must have a "name" field.'}
                    )

        return attrs
