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

logger = logging.getLogger(__name__)


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
        serializer.save(organization=self.request.user.organization)


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

        results = []
        for candidate in candidates:
            sent_email = send_candidate_email(
                organization=org,
                candidate=candidate,
                sender=request.user,
                subject=subject,
                body=body,
                template=template,
            )
            results.append(SentEmailSerializer(sent_email).data)

        sent_count = sum(1 for r in results if r['status'] == 'sent')
        failed_count = sum(1 for r in results if r['status'] == 'failed')

        return Response({
            'detail': f'{sent_count} emails sent, {failed_count} failed.',
            'results': results,
        }, status=status.HTTP_201_CREATED)


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
