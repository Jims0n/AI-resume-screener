import csv
from django.http import HttpResponse
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser

from .models import Candidate
from .serializers import (
    CandidateListSerializer, CandidateDetailSerializer, CandidateStatusSerializer
)
from .tasks import process_resume
from jobs.models import Job


class ResumeUploadView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser]

    def post(self, request, job_id):
        try:
            job = Job.objects.get(id=job_id, user=request.user)
        except Job.DoesNotExist:
            return Response({'detail': 'Job not found.'}, status=status.HTTP_404_NOT_FOUND)

        files = request.FILES.getlist('files')
        if not files:
            return Response({'detail': 'No files provided.'}, status=status.HTTP_400_BAD_REQUEST)

        candidates = []
        for f in files:
            # Validate file type
            if not (f.name.lower().endswith('.pdf') or f.name.lower().endswith('.docx')):
                continue

            candidate = Candidate.objects.create(
                job=job,
                resume_file=f,
                name=f.name.rsplit('.', 1)[0],
            )
            # Dispatch Celery task
            process_resume.delay(candidate.id)
            candidates.append({
                'id': candidate.id,
                'name': candidate.name,
                'status': candidate.status,
            })

        return Response({'candidates': candidates}, status=status.HTTP_201_CREATED)


class CandidateListView(generics.ListAPIView):
    serializer_class = CandidateListSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        job_id = self.kwargs['job_id']
        queryset = Candidate.objects.filter(
            job_id=job_id, job__user=self.request.user
        ).prefetch_related('skill_matches')

        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        # Ordering
        ordering = self.request.query_params.get('ordering', '-overall_score')
        allowed_orderings = [
            'overall_score', '-overall_score',
            'skill_match_score', '-skill_match_score',
            'experience_score', '-experience_score',
            'education_score', '-education_score',
            'created_at', '-created_at',
            'name', '-name',
        ]
        if ordering in allowed_orderings:
            queryset = queryset.order_by(ordering)

        return queryset


class CandidateDetailView(generics.RetrieveAPIView):
    serializer_class = CandidateDetailSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Candidate.objects.filter(
            job__user=self.request.user
        ).prefetch_related('skill_matches')


class CandidateStatusUpdateView(generics.UpdateAPIView):
    serializer_class = CandidateStatusSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Candidate.objects.filter(job__user=self.request.user)


class CandidateReprocessView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            candidate = Candidate.objects.get(id=pk, job__user=request.user)
        except Candidate.DoesNotExist:
            return Response({'detail': 'Candidate not found.'}, status=status.HTTP_404_NOT_FOUND)

        candidate.status = 'pending'
        candidate.save(update_fields=['status'])
        process_resume.delay(candidate.id)

        return Response({'detail': 'Reprocessing started.', 'status': 'pending'})


class CandidateExportView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, job_id):
        try:
            job = Job.objects.get(id=job_id, user=request.user)
        except Job.DoesNotExist:
            return Response({'detail': 'Job not found.'}, status=status.HTTP_404_NOT_FOUND)

        candidates = Candidate.objects.filter(job=job).order_by('-overall_score')

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="candidates_{job.title}.csv"'

        writer = csv.writer(response)
        writer.writerow([
            'Name', 'Email', 'Overall Score', 'Skill Match Score',
            'Experience Score', 'Education Score', 'Status',
        ])
        for c in candidates:
            writer.writerow([
                c.name, c.email, c.overall_score, c.skill_match_score,
                c.experience_score, c.education_score, c.status,
            ])

        return response
