import logging

from rest_framework import viewsets, permissions
from rest_framework.response import Response
from rest_framework import status as http_status

from .models import Job
from .serializers import JobSerializer, JobCreateSerializer
from .services import extract_skills_from_description
from accounts.permissions import (
    IsOrganizationMember,
    CanManageJobs,
    CanDeleteJobs,
    check_job_limit,
)

info_logger = logging.getLogger('app_info')
error_logger = logging.getLogger('app_error')


class JobViewSet(viewsets.ModelViewSet):
    serializer_class = JobSerializer
    permission_classes = [
        permissions.IsAuthenticated,
        IsOrganizationMember,
        CanManageJobs,
        CanDeleteJobs,
    ]

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
            info_logger.info(f"Auto-extracting skills from job description for org={org.name}")
            extracted = extract_skills_from_description(description)
            serializer.validated_data['required_skills'] = extracted['required_skills']
            serializer.validated_data['nice_to_have_skills'] = extracted['nice_to_have_skills']
            if not serializer.validated_data.get('min_experience_years'):
                serializer.validated_data['min_experience_years'] = extracted['min_experience_years']

        job = serializer.save(organization=org, created_by=request.user)
        info_logger.info(
            f"Job created: id={job.id} title='{job.title}' "
            f"org={org.name} by {request.user.username} "
            f"skills={len(job.required_skills)} required, {len(job.nice_to_have_skills)} nice-to-have"
        )
        return Response(JobSerializer(job).data, status=http_status.HTTP_201_CREATED)

    def perform_update(self, serializer):
        job = serializer.save()
        info_logger.info(f"Job updated: id={job.id} title='{job.title}' by {self.request.user.username}")

    def perform_destroy(self, instance):
        job_id, title = instance.id, instance.title
        instance.delete()
        info_logger.info(f"Job deleted: id={job_id} title='{title}' by {self.request.user.username}")
