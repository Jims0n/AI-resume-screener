from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.db import transaction

from .models import Organization, OrganizationInvite

User = get_user_model()


class OrganizationSerializer(serializers.ModelSerializer):
    member_count = serializers.IntegerField(read_only=True)
    active_job_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Organization
        fields = [
            'id', 'name', 'slug', 'logo', 'max_jobs',
            'max_resumes_per_job', 'max_users', 'member_count',
            'active_job_count', 'created_at',
        ]
        read_only_fields = [
            'id', 'slug', 'max_jobs', 'max_resumes_per_job',
            'max_users', 'created_at',
        ]


class OrganizationUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = ['name', 'logo']


class UserSerializer(serializers.ModelSerializer):
    organization = OrganizationSerializer(read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'company', 'role',
            'avatar', 'organization', 'date_joined',
        ]
        read_only_fields = ['id', 'date_joined', 'organization']


class UserListSerializer(serializers.ModelSerializer):
    """Lightweight user serializer for member lists."""

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'avatar', 'date_joined']
        read_only_fields = ['id', 'date_joined']


class RegisterSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    company = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password_confirm', 'company']

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('A user with this email already exists.')
        return value.lower()

    def validate(self, attrs):
        if attrs['password'] != attrs.pop('password_confirm'):
            raise serializers.ValidationError({'password_confirm': 'Passwords do not match.'})
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        company_name = validated_data.pop('company', '') or validated_data['username']

        org = Organization.objects.create(name=company_name)

        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            company=company_name,
            organization=org,
            role='owner',
        )

        # Set generous defaults for new signups
        org.max_users = 5
        org.max_jobs = 5
        org.max_resumes_per_job = 25
        org.save(update_fields=['max_users', 'max_jobs', 'max_resumes_per_job'])

        return user


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)


class InviteSerializer(serializers.Serializer):
    email = serializers.EmailField()
    role = serializers.ChoiceField(
        choices=[c for c in User.ROLE_CHOICES if c[0] != 'owner'],
        default='recruiter',
    )

    def validate_email(self, value):
        value = value.lower()
        org = self.context['organization']

        if User.objects.filter(email__iexact=value, organization=org).exists():
            raise serializers.ValidationError('This user is already a member of your organization.')

        if OrganizationInvite.objects.filter(
            email__iexact=value,
            organization=org,
            status='pending',
        ).exists():
            raise serializers.ValidationError('An invite has already been sent to this email.')

        return value


class JoinOrganizationSerializer(serializers.Serializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    username = serializers.CharField()

    def validate_username(self, value):
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError('This username is already taken.')
        return value

    def validate(self, attrs):
        if attrs['password'] != attrs.pop('password_confirm'):
            raise serializers.ValidationError({'password_confirm': 'Passwords do not match.'})
        return attrs


class InviteListSerializer(serializers.ModelSerializer):
    invited_by_email = serializers.CharField(source='invited_by.email', read_only=True)

    class Meta:
        model = OrganizationInvite
        fields = [
            'id', 'email', 'role', 'status', 'invited_by_email',
            'created_at', 'expires_at',
        ]


class MemberUpdateSerializer(serializers.Serializer):
    role = serializers.ChoiceField(
        choices=[c for c in User.ROLE_CHOICES if c[0] != 'owner'],
    )
