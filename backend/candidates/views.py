import csv
import json
import re
import logging

from django.conf import settings
from django.db.models import Q
from django.http import HttpResponse
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser

from .models import Candidate, CandidateNote, ProcessingBatch
from .serializers import (
    CandidateListSerializer,
    CandidateDetailSerializer,
    CandidateStatusSerializer,
    CandidateNoteSerializer,
    ProcessingBatchSerializer,
    CandidateCompareSerializer,
)
from .tasks import process_resume
from jobs.models import Job
from accounts.permissions import IsOrganizationMember, CanManageCandidates, check_resume_limit

info_logger = logging.getLogger('app_info')
error_logger = logging.getLogger('app_error')

ALLOWED_EXTENSIONS = ('.pdf', '.docx')
MAX_RESUME_SIZE = getattr(settings, 'MAX_RESUME_SIZE_MB', 10) * 1024 * 1024


def _get_org_job(job_id, user):
    """Get a job that belongs to the user's organization."""
    try:
        return Job.objects.get(id=job_id, organization=user.organization)
    except Job.DoesNotExist:
        return None


def _get_org_candidate(pk, user):
    """Get a candidate that belongs to the user's organization."""
    try:
        return Candidate.objects.get(
            id=pk,
            job__organization=user.organization,
        )
    except Candidate.DoesNotExist:
        return None


class ResumeUploadView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsOrganizationMember, CanManageCandidates]
    parser_classes = [MultiPartParser]
    throttle_scope = 'upload'

    def post(self, request, job_id):
        job = _get_org_job(job_id, request.user)
        if not job:
            return Response({'detail': 'Job not found.'}, status=status.HTTP_404_NOT_FOUND)

        check_resume_limit(job)

        files = request.FILES.getlist('files')
        if not files:
            return Response({'detail': 'No files provided.'}, status=status.HTTP_400_BAD_REQUEST)

        # Check how many more resumes we can accept
        current_count = job.candidates.count()
        remaining_slots = job.organization.max_resumes_per_job - current_count

        candidates = []
        skipped = []

        # Create batch record
        batch = ProcessingBatch.objects.create(
            job=job,
            created_by=request.user,
            total_count=0,  # Will update after processing files
        )

        for f in files:
            if len(candidates) >= remaining_slots:
                skipped.append({
                    'file': f.name,
                    'reason': f'Resume limit reached ({job.organization.max_resumes_per_job}).',
                })
                continue

            ext = f.name.lower().rsplit('.', 1)[-1] if '.' in f.name else ''
            if f'.{ext}' not in ALLOWED_EXTENSIONS:
                skipped.append({
                    'file': f.name,
                    'reason': 'Unsupported file type. Only PDF and DOCX are allowed.',
                })
                continue

            if f.size > MAX_RESUME_SIZE:
                skipped.append({
                    'file': f.name,
                    'reason': f'File exceeds {settings.MAX_RESUME_SIZE_MB}MB limit.',
                })
                continue

            candidate = Candidate.objects.create(
                job=job,
                batch=batch,
                resume_file=f,
                name=f.name.rsplit('.', 1)[0],
            )
            process_resume.delay(candidate.id)
            candidates.append({
                'id': candidate.id,
                'name': candidate.name,
                'status': candidate.status,
            })

        # Update batch count
        batch.total_count = len(candidates)
        if not candidates:
            batch.status = 'completed'
        batch.save(update_fields=['total_count', 'status'])

        response_data = {
            'candidates': candidates,
            'batch_id': batch.id,
        }
        if skipped:
            response_data['skipped'] = skipped

        if not candidates:
            info_logger.info(f"Resume upload: 0 valid files for job={job_id} by {request.user.username} (skipped={len(skipped)})")
            return Response(
                {'detail': 'No valid files were uploaded.', 'skipped': skipped},
                status=status.HTTP_400_BAD_REQUEST,
            )

        info_logger.info(
            f"Resume upload: {len(candidates)} resumes for job={job_id} batch={batch.id} "
            f"by {request.user.username} (skipped={len(skipped)})"
        )
        return Response(response_data, status=status.HTTP_201_CREATED)


class CandidateListView(generics.ListAPIView):
    serializer_class = CandidateListSerializer
    permission_classes = [permissions.IsAuthenticated, IsOrganizationMember]

    def get_queryset(self):
        job_id = self.kwargs['job_id']
        queryset = Candidate.objects.filter(
            job_id=job_id,
            job__organization=self.request.user.organization,
        ).prefetch_related('skill_matches', 'notes')

        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        # Search across resume_text and parsed_data
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(resume_text__icontains=search)
                | Q(name__icontains=search)
                | Q(email__icontains=search)
            )

        # Score range filters
        min_score = self.request.query_params.get('min_score')
        max_score = self.request.query_params.get('max_score')
        if min_score:
            queryset = queryset.filter(overall_score__gte=float(min_score))
        if max_score:
            queryset = queryset.filter(overall_score__lte=float(max_score))

        # Skills filter
        skills = self.request.query_params.get('skills')
        if skills:
            skill_list = [s.strip() for s in skills.split(',') if s.strip()]
            for skill in skill_list:
                queryset = queryset.filter(
                    skill_matches__skill_name__iexact=skill,
                    skill_matches__found=True,
                )

        # Experience filter
        experience_min = self.request.query_params.get('experience_min')
        if experience_min:
            queryset = queryset.filter(
                parsed_data__total_experience_years__gte=int(experience_min)
            )

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

        return queryset.distinct()


class CandidateDetailView(generics.RetrieveAPIView):
    serializer_class = CandidateDetailSerializer
    permission_classes = [permissions.IsAuthenticated, IsOrganizationMember]

    def get_queryset(self):
        return Candidate.objects.filter(
            job__organization=self.request.user.organization
        ).prefetch_related('skill_matches', 'notes__user')


class CandidateStatusUpdateView(generics.UpdateAPIView):
    serializer_class = CandidateStatusSerializer
    permission_classes = [permissions.IsAuthenticated, IsOrganizationMember, CanManageCandidates]
    http_method_names = ['patch']

    def get_queryset(self):
        return Candidate.objects.filter(
            job__organization=self.request.user.organization
        )


class CandidateReprocessView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsOrganizationMember, CanManageCandidates]
    throttle_scope = 'ai_reprocess'

    def post(self, request, pk):
        candidate = _get_org_candidate(pk, request.user)
        if not candidate:
            return Response({'detail': 'Candidate not found.'}, status=status.HTTP_404_NOT_FOUND)

        if candidate.status == 'processing':
            return Response(
                {'detail': 'Candidate is already being processed.'},
                status=status.HTTP_409_CONFLICT,
            )

        candidate.status = 'pending'
        candidate.save(update_fields=['status'])
        process_resume.delay(candidate.id)
        info_logger.info(f"Candidate reprocess triggered: id={pk} by {request.user.username}")

        return Response({'detail': 'Reprocessing started.', 'status': 'pending'})


# --- Candidate Notes ---

class CandidateNoteListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsOrganizationMember, CanManageCandidates]

    def get(self, request, pk):
        candidate = _get_org_candidate(pk, request.user)
        if not candidate:
            return Response({'detail': 'Candidate not found.'}, status=status.HTTP_404_NOT_FOUND)

        notes = CandidateNote.objects.filter(candidate=candidate).select_related('user')
        serializer = CandidateNoteSerializer(notes, many=True)
        return Response(serializer.data)

    def post(self, request, pk):
        candidate = _get_org_candidate(pk, request.user)
        if not candidate:
            return Response({'detail': 'Candidate not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = CandidateNoteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        note = CandidateNote.objects.create(
            candidate=candidate,
            user=request.user,
            content=serializer.validated_data['content'],
        )
        return Response(
            CandidateNoteSerializer(note).data,
            status=status.HTTP_201_CREATED,
        )


class CandidateNoteDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsOrganizationMember, CanManageCandidates]

    def _get_note(self, note_id, user):
        try:
            return CandidateNote.objects.get(
                id=note_id,
                candidate__job__organization=user.organization,
            )
        except CandidateNote.DoesNotExist:
            return None

    def patch(self, request, note_id):
        note = self._get_note(note_id, request.user)
        if not note:
            return Response({'detail': 'Note not found.'}, status=status.HTTP_404_NOT_FOUND)

        if note.user != request.user and not request.user.is_org_admin:
            return Response(
                {'detail': 'You can only edit your own notes.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = CandidateNoteSerializer(note, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        note.content = serializer.validated_data.get('content', note.content)
        note.save(update_fields=['content', 'updated_at'])
        return Response(CandidateNoteSerializer(note).data)

    def delete(self, request, note_id):
        note = self._get_note(note_id, request.user)
        if not note:
            return Response({'detail': 'Note not found.'}, status=status.HTTP_404_NOT_FOUND)

        if note.user != request.user and not request.user.is_org_admin:
            return Response(
                {'detail': 'You can only delete your own notes.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        note.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# --- Batch Status ---

class BatchDetailView(generics.RetrieveAPIView):
    serializer_class = ProcessingBatchSerializer
    permission_classes = [permissions.IsAuthenticated, IsOrganizationMember]

    def get_queryset(self):
        return ProcessingBatch.objects.filter(
            job__organization=self.request.user.organization,
        )


# --- Candidate Comparison ---

class CandidateCompareView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsOrganizationMember, CanManageCandidates]

    def post(self, request, job_id):
        job = _get_org_job(job_id, request.user)
        if not job:
            return Response({'detail': 'Job not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = CandidateCompareSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        candidate_ids = serializer.validated_data['candidate_ids']
        candidates = Candidate.objects.filter(
            id__in=candidate_ids,
            job=job,
            status__in=['scored', 'shortlisted'],
        ).prefetch_related('skill_matches')

        if candidates.count() < 2:
            return Response(
                {'detail': 'At least 2 scored candidates are required for comparison.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        candidate_data = CandidateDetailSerializer(
            candidates, many=True, context={'request': request}
        ).data

        # Build comparison matrix
        all_skills = set()
        for c in candidates:
            for sm in c.skill_matches.all():
                all_skills.add(sm.skill_name)

        comparison_matrix = {}
        for skill in sorted(all_skills):
            comparison_matrix[skill] = {}
            for c in candidates:
                match = c.skill_matches.filter(skill_name=skill).first()
                comparison_matrix[skill][str(c.id)] = {
                    'found': match.found if match else False,
                    'proficiency': match.proficiency if match else 'none',
                }

        # AI comparison (optional - falls back gracefully)
        comparison_summary = ''
        recommendation = ''
        try:
            from .services.comparison import compare_candidates
            ai_result = compare_candidates(candidates, job)
            comparison_summary = ai_result.get('comparison_summary', '')
            recommendation = ai_result.get('recommendation', '')
        except Exception as e:
            error_logger.error(f"AI comparison failed for job={job_id}: {e}", exc_info=True)
            comparison_summary = 'AI comparison unavailable.'

        return Response({
            'candidates': candidate_data,
            'comparison_summary': comparison_summary,
            'recommendation': recommendation,
            'comparison_matrix': comparison_matrix,
        })


# --- Export ---

class CandidateExportView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsOrganizationMember, CanManageCandidates]

    def get(self, request, job_id):
        job = _get_org_job(job_id, request.user)
        if not job:
            return Response({'detail': 'Job not found.'}, status=status.HTTP_404_NOT_FOUND)

        export_format = request.query_params.get('format', 'csv')

        candidates = Candidate.objects.filter(job=job).order_by(
            '-overall_score'
        ).prefetch_related('skill_matches')

        if export_format == 'csv':
            info_logger.info(f"CSV export: job={job_id} candidates={candidates.count()} by {request.user.username}")
            return self._export_csv(job, candidates)

        return Response(
            {'detail': 'Unsupported format. Use csv.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    def _export_csv(self, job, candidates):
        safe_title = re.sub(r'[^\w\s-]', '', job.title).strip().replace(' ', '_')[:50]
        filename = f'candidates_{safe_title}.csv'

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'

        writer = csv.writer(response)
        writer.writerow([
            'Name', 'Email', 'Phone', 'Overall Score', 'Skill Match Score',
            'Experience Score', 'Education Score', 'Status', 'Strengths',
            'Red Flags', 'Skills Found', 'Scoring Reasoning', 'Applied Date',
        ])

        for c in candidates:
            skills_found = ', '.join(
                sm.skill_name for sm in c.skill_matches.all() if sm.found
            )
            writer.writerow([
                c.name,
                c.email,
                c.phone,
                c.overall_score,
                c.skill_match_score,
                c.experience_score,
                c.education_score,
                c.status,
                '; '.join(c.strengths) if c.strengths else '',
                '; '.join(c.red_flags) if c.red_flags else '',
                skills_found,
                c.scoring_reasoning,
                c.created_at.strftime('%Y-%m-%d') if c.created_at else '',
            ])

        return response
