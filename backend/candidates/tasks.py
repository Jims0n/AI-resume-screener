import logging
from celery import shared_task
from django.utils import timezone

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=2, default_retry_delay=30)
def process_resume(self, candidate_id: int):
    """
    Full pipeline: extract text → parse structured data → score against job.
    Updates candidate status throughout: pending → processing → scored.
    On failure, resets to pending with error message in scoring_reasoning.
    """
    from .models import Candidate, SkillMatch
    from .services.parser import extract_text
    from .services.extractor import extract_resume_data
    from .services.scorer import score_candidate

    try:
        candidate = Candidate.objects.select_related('job').get(id=candidate_id)
    except Candidate.DoesNotExist:
        logger.error(f"Candidate {candidate_id} not found")
        return

    try:
        # Step 1: Set status to processing
        candidate.status = 'processing'
        candidate.save(update_fields=['status'])

        # Step 2: Extract text from resume file
        file_path = candidate.resume_file.path
        resume_text = extract_text(file_path)
        candidate.resume_text = resume_text
        candidate.save(update_fields=['resume_text'])

        # Step 3: Extract structured data from resume text
        parsed_data = extract_resume_data(resume_text)
        candidate.parsed_data = parsed_data
        candidate.name = parsed_data.get('name', 'Unknown')
        candidate.email = parsed_data.get('email', '') or ''
        candidate.phone = parsed_data.get('phone', '') or ''
        candidate.save(update_fields=['parsed_data', 'name', 'email', 'phone'])

        # Step 4: Score candidate against job
        job = candidate.job
        scores = score_candidate(parsed_data, job)

        candidate.overall_score = scores.get('overall_score', 0)
        candidate.skill_match_score = scores.get('skill_match_score', 0)
        candidate.experience_score = scores.get('experience_score', 0)
        candidate.education_score = scores.get('education_score', 0)
        candidate.scoring_reasoning = scores.get('reasoning', '')
        candidate.strengths = scores.get('strengths', [])
        candidate.red_flags = scores.get('red_flags', [])
        candidate.save(update_fields=[
            'overall_score', 'skill_match_score', 'experience_score',
            'education_score', 'scoring_reasoning', 'strengths', 'red_flags',
        ])

        # Step 5: Create SkillMatch records
        SkillMatch.objects.filter(candidate=candidate).delete()
        skill_matches = scores.get('skill_matches', [])
        for sm in skill_matches:
            SkillMatch.objects.create(
                candidate=candidate,
                skill_name=sm.get('skill_name', ''),
                found=sm.get('found', False),
                proficiency=sm.get('proficiency', 'none'),
                evidence=sm.get('evidence', ''),
                is_required=sm.get('is_required', True),
            )

        # Step 6: Set status to scored
        candidate.status = 'scored'
        candidate.processed_at = timezone.now()
        candidate.save(update_fields=['status', 'processed_at'])

        logger.info(f"Successfully processed candidate {candidate_id}: score={candidate.overall_score}")

    except Exception as exc:
        logger.error(f"Failed to process candidate {candidate_id}: {exc}")
        candidate.status = 'pending'
        candidate.scoring_reasoning = f"Processing failed: {str(exc)}"
        candidate.save(update_fields=['status', 'scoring_reasoning'])

        # Retry
        try:
            self.retry(exc=exc)
        except self.MaxRetriesExceededError:
            candidate.scoring_reasoning = f"Processing failed after max retries: {str(exc)}"
            candidate.save(update_fields=['scoring_reasoning'])
