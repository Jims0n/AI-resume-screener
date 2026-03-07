import logging
from celery import shared_task
from django.db import transaction
from django.db.models import F
from django.utils import timezone

logger = logging.getLogger(__name__)


def _update_batch(candidate, success=True):
    """Update batch counters and status after processing a candidate."""
    if not candidate.batch_id:
        return

    from .models import ProcessingBatch

    try:
        if success:
            ProcessingBatch.objects.filter(id=candidate.batch_id).update(
                processed_count=F('processed_count') + 1
            )
        else:
            ProcessingBatch.objects.filter(id=candidate.batch_id).update(
                failed_count=F('failed_count') + 1
            )

        # Check if batch is complete
        batch = ProcessingBatch.objects.get(id=candidate.batch_id)
        total_done = batch.processed_count + batch.failed_count
        if total_done >= batch.total_count:
            if batch.failed_count > 0 and batch.processed_count > 0:
                batch.status = 'partial'
            elif batch.failed_count == batch.total_count:
                batch.status = 'partial'
            else:
                batch.status = 'completed'
            batch.completed_at = timezone.now()
            batch.save(update_fields=['status', 'completed_at'])

            # Create notification for batch completion
            _notify_batch_complete(batch)

    except ProcessingBatch.DoesNotExist:
        logger.warning(f"Batch {candidate.batch_id} not found for candidate {candidate.id}")


def _notify_batch_complete(batch):
    """Send notification when a batch completes processing."""
    try:
        from notifications.helpers import create_notification

        if batch.created_by:
            create_notification(
                user=batch.created_by,
                notification_type='batch_complete',
                title='Resume processing complete',
                message=f'{batch.processed_count} of {batch.total_count} resumes processed for "{batch.job.title}".',
                data={
                    'batch_id': batch.id,
                    'job_id': batch.job_id,
                    'processed_count': batch.processed_count,
                    'failed_count': batch.failed_count,
                },
            )
    except Exception as e:
        logger.warning(f"Failed to create batch notification: {e}")


def _notify_processing_complete(candidate):
    """Send notification when a single candidate finishes processing."""
    try:
        from notifications.helpers import create_notification

        if candidate.job.created_by:
            create_notification(
                user=candidate.job.created_by,
                notification_type='processing_complete',
                title='Resume scored',
                message=f'{candidate.name} scored {candidate.overall_score}/100 for "{candidate.job.title}".',
                data={
                    'candidate_id': candidate.id,
                    'job_id': candidate.job_id,
                    'score': candidate.overall_score,
                },
            )
    except Exception as e:
        logger.warning(f"Failed to create processing notification: {e}")


@shared_task(bind=True, max_retries=2, default_retry_delay=30)
def process_resume(self, candidate_id: int):
    """
    Full pipeline: extract text -> parse structured data -> score against job.
    Updates candidate status: pending -> processing -> scored.
    On permanent failure, sets status to 'pending' with error in scoring_reasoning.
    """
    from .models import Candidate, SkillMatch
    from .services.parser import extract_text
    from .services.extractor import extract_resume_data
    from .services.scorer import score_candidate

    try:
        candidate = Candidate.objects.select_related('job', 'job__created_by').get(id=candidate_id)
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
        with transaction.atomic():
            SkillMatch.objects.filter(candidate=candidate).delete()
            skill_matches = scores.get('skill_matches', [])
            SkillMatch.objects.bulk_create([
                SkillMatch(
                    candidate=candidate,
                    skill_name=sm.get('skill_name', ''),
                    found=sm.get('found', False),
                    proficiency=sm.get('proficiency', 'none'),
                    evidence=sm.get('evidence', ''),
                    is_required=sm.get('is_required', True),
                )
                for sm in skill_matches
            ])

        # Step 6: Set status to scored
        candidate.status = 'scored'
        candidate.processed_at = timezone.now()
        candidate.save(update_fields=['status', 'processed_at'])

        logger.info(f"Successfully processed candidate {candidate_id}: score={candidate.overall_score}")

        # Update batch and send notifications
        _update_batch(candidate, success=True)
        _notify_processing_complete(candidate)

    except Exception as exc:
        logger.error(f"Failed to process candidate {candidate_id}: {exc}")

        # Retry if retries remain
        if self.request.retries < self.max_retries:
            candidate.scoring_reasoning = f"Processing attempt {self.request.retries + 1} failed, retrying..."
            candidate.save(update_fields=['scoring_reasoning'])
            raise self.retry(exc=exc)

        # Max retries exceeded
        candidate.status = 'pending'
        candidate.scoring_reasoning = f"Processing failed after {self.max_retries + 1} attempts: {str(exc)}"
        candidate.save(update_fields=['status', 'scoring_reasoning'])

        _update_batch(candidate, success=False)
