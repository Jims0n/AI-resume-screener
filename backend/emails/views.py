import logging

from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import EmailTemplate, SentEmail
from .serializers import (
    EmailTemplateSerializer,
    SendEmailSerializer,
    BulkEmailSerializer,
    SentEmailSerializer,
)
from .services import send_candidate_email
from accounts.permissions import IsOrganizationMember, CanManageEmails
from candidates.models import Candidate
from jobs.models import Job

info_logger = logging.getLogger('app_info')
error_logger = logging.getLogger('app_error')


class EmailTemplateListCreateView(generics.ListCreateAPIView):
    serializer_class = EmailTemplateSerializer
    permission_classes = [permissions.IsAuthenticated, IsOrganizationMember, CanManageEmails]

    def get_queryset(self):
        queryset = EmailTemplate.objects.filter(
            organization=self.request.user.organization,
        )
        template_type = self.request.query_params.get('type')
        if template_type:
            queryset = queryset.filter(type=template_type)
        return queryset

    def perform_create(self, serializer):
        template = serializer.save(organization=self.request.user.organization)
        info_logger.info(
            f"Email template created: id={template.id} type='{template.type}' "
            f"org={self.request.user.organization.name} by {self.request.user.username}"
        )


class EmailTemplateDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = EmailTemplateSerializer
    permission_classes = [permissions.IsAuthenticated, IsOrganizationMember, CanManageEmails]

    def get_queryset(self):
        return EmailTemplate.objects.filter(
            organization=self.request.user.organization,
        )


class SendCandidateEmailView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsOrganizationMember, CanManageEmails]

    def post(self, request, pk):
        org = request.user.organization

        try:
            candidate = Candidate.objects.get(
                id=pk,
                job__organization=org,
            )
        except Candidate.DoesNotExist:
            return Response(
                {'detail': 'Candidate not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = SendEmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        template = None
        template_id = serializer.validated_data.get('template_id')
        if template_id:
            try:
                template = EmailTemplate.objects.get(id=template_id, organization=org)
            except EmailTemplate.DoesNotExist:
                return Response(
                    {'detail': 'Email template not found.'},
                    status=status.HTTP_404_NOT_FOUND,
                )
            subject = template.subject
            body = template.body
        else:
            subject = serializer.validated_data['subject']
            body = serializer.validated_data['body']

        sent_email = send_candidate_email(
            organization=org,
            candidate=candidate,
            sender=request.user,
            subject=subject,
            body=body,
            template=template,
        )

        info_logger.info(
            f"Email sent to candidate: candidate={pk} "
            f"status={sent_email.status} by {request.user.username}"
        )

        return Response(
            SentEmailSerializer(sent_email).data,
            status=status.HTTP_201_CREATED,
        )


class BulkEmailView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsOrganizationMember, CanManageEmails]

    def post(self, request, job_id):
        org = request.user.organization

        try:
            job = Job.objects.get(id=job_id, organization=org)
        except Job.DoesNotExist:
            return Response(
                {'detail': 'Job not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = BulkEmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        template = None
        template_id = serializer.validated_data.get('template_id')
        if template_id:
            try:
                template = EmailTemplate.objects.get(id=template_id, organization=org)
            except EmailTemplate.DoesNotExist:
                return Response(
                    {'detail': 'Email template not found.'},
                    status=status.HTTP_404_NOT_FOUND,
                )
            subject = template.subject
            body = template.body
        else:
            subject = serializer.validated_data['subject']
            body = serializer.validated_data['body']

        candidate_ids = serializer.validated_data['candidate_ids']
        candidates = Candidate.objects.filter(
            id__in=candidate_ids,
            job=job,
        )

        # Dispatch each email as an async Celery task
        from .tasks import send_candidate_email_task

        queued_count = 0
        for candidate in candidates:
            send_candidate_email_task.delay(
                org_id=org.id,
                candidate_id=candidate.id,
                sender_id=request.user.id,
                subject=subject,
                body=body,
                template_id=template_id,
            )
            queued_count += 1

        info_logger.info(
            f"Bulk email queued: job={job_id} count={queued_count} by {request.user.username}"
        )

        return Response({
            'detail': f'{queued_count} emails queued for delivery.',
            'queued_count': queued_count,
        }, status=status.HTTP_202_ACCEPTED)


class SentEmailListView(generics.ListAPIView):
    serializer_class = SentEmailSerializer
    permission_classes = [permissions.IsAuthenticated, IsOrganizationMember]

    def get_queryset(self):
        queryset = SentEmail.objects.filter(
            organization=self.request.user.organization,
        ).select_related('candidate', 'sender')

        # Filter by candidate
        candidate_id = self.request.query_params.get('candidate_id')
        if candidate_id:
            queryset = queryset.filter(candidate_id=candidate_id)

        # Filter by status
        email_status = self.request.query_params.get('status')
        if email_status:
            queryset = queryset.filter(status=email_status)

        return queryset
