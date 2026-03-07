from rest_framework import viewsets, permissions
from rest_framework.response import Response
from rest_framework import status as http_status

from .models import Job
from .serializers import JobSerializer, JobCreateSerializer
from .services import extract_skills_from_description
from accounts.permissions import IsOrganizationMember, check_job_limit


class JobViewSet(viewsets.ModelViewSet):
    serializer_class = JobSerializer
    permission_classes = [permissions.IsAuthenticated, IsOrganizationMember]

    def get_queryset(self):
        return Job.objects.filter(
            organization=self.request.user.organization
        ).select_related('created_by')

    def get_serializer_class(self):
        if self.action in ('create', 'update', 'partial_update'):
            return JobCreateSerializer
        return JobSerializer

    def create(self, request, *args, **kwargs):
        org = request.user.organization
        check_job_limit(org)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Auto-extract skills from description if not provided
        description = serializer.validated_data.get('description', '')
        required_skills = serializer.validated_data.get('required_skills', [])
        nice_to_have_skills = serializer.validated_data.get('nice_to_have_skills', [])

        if not required_skills and not nice_to_have_skills and description:
            extracted = extract_skills_from_description(description)
            serializer.validated_data['required_skills'] = extracted['required_skills']
            serializer.validated_data['nice_to_have_skills'] = extracted['nice_to_have_skills']
            if not serializer.validated_data.get('min_experience_years'):
                serializer.validated_data['min_experience_years'] = extracted['min_experience_years']

        job = serializer.save(organization=org, created_by=request.user)
        return Response(JobSerializer(job).data, status=http_status.HTTP_201_CREATED)

    def perform_update(self, serializer):
        serializer.save()
