from django.db.models import Avg, Count, Q, Case, When, FloatField
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from candidates.models import Candidate
from jobs.models import Job


class JobAnalyticsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, job_id):
        try:
            job = Job.objects.get(id=job_id, user=request.user)
        except Job.DoesNotExist:
            return Response({'detail': 'Job not found.'}, status=404)

        candidates = Candidate.objects.filter(job=job)
        scored = candidates.filter(overall_score__isnull=False)

        # Score distribution histogram
        score_distribution = []
        buckets = [(0, 20), (20, 40), (40, 60), (60, 80), (80, 100)]
        for low, high in buckets:
            count = scored.filter(overall_score__gte=low, overall_score__lt=high).count()
            # Include 100 in the last bucket
            if high == 100:
                count = scored.filter(overall_score__gte=low, overall_score__lte=100).count()
            score_distribution.append({
                'range': f'{low}-{high}',
                'count': count,
            })

        # Skill gap analysis (% of candidates with each required skill)
        skill_gap = []
        total_scored = scored.count()
        for skill in job.required_skills:
            if total_scored > 0:
                has_skill = scored.filter(
                    skill_matches__skill_name=skill,
                    skill_matches__found=True,
                ).distinct().count()
                percentage = round((has_skill / total_scored) * 100, 1)
            else:
                percentage = 0
            skill_gap.append({'skill': skill, 'percentage': percentage})

        # Pipeline counts by status
        pipeline = {}
        for status_val, _ in Candidate.STATUS_CHOICES:
            pipeline[status_val] = candidates.filter(status=status_val).count()

        # Average scores
        avg_scores = scored.aggregate(
            average_overall=Avg('overall_score'),
            average_skill_match=Avg('skill_match_score'),
            average_experience=Avg('experience_score'),
            average_education=Avg('education_score'),
        )
        average_scores = {
            key: round(val, 1) if val else 0
            for key, val in avg_scores.items()
        }

        # Top 5 candidates
        top_candidates = scored.order_by('-overall_score')[:5].values(
            'id', 'name', 'overall_score', 'skill_match_score',
            'experience_score', 'education_score', 'status',
        )

        return Response({
            'score_distribution': score_distribution,
            'skill_gap': skill_gap,
            'pipeline': pipeline,
            'average_scores': average_scores,
            'top_candidates': list(top_candidates),
            'total_candidates': candidates.count(),
            'total_scored': total_scored,
        })
