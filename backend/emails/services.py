import logging
import re

from django.core.mail import send_mail
from django.conf import settings

from .models import SentEmail

logger = logging.getLogger(__name__)


def replace_placeholders(text, candidate, job, organization):
    """Replace template placeholders with actual values."""
    replacements = {
        '{{candidate_name}}': candidate.name or 'Candidate',
        '{{job_title}}': job.title,
        '{{company_name}}': organization.name,
        '{{candidate_email}}': candidate.email or '',
    }
    for placeholder, value in replacements.items():
        text = text.replace(placeholder, value)
    return text


def send_candidate_email(
    organization, candidate, sender, subject, body,
    template=None,
):
    """Send an email to a candidate and record it."""
    if not candidate.email:
        return SentEmail.objects.create(
            organization=organization,
            candidate=candidate,
            template=template,
            sender=sender,
            recipient_email='',
            subject=subject,
            body=body,
            status='failed',
            error_message='Candidate has no email address.',
        )

    job = candidate.job

    # Replace placeholders
    rendered_subject = replace_placeholders(subject, candidate, job, organization)
    rendered_body = replace_placeholders(body, candidate, job, organization)

    try:
        from_email = settings.DEFAULT_FROM_EMAIL if hasattr(settings, 'DEFAULT_FROM_EMAIL') else None
        send_mail(
            subject=rendered_subject,
            message=rendered_body,
            from_email=from_email,
            recipient_list=[candidate.email],
            fail_silently=False,
        )
        sent_status = 'sent'
        error_msg = ''
    except Exception as e:
        logger.error(f"Failed to send email to {candidate.email}: {e}")
        sent_status = 'failed'
        error_msg = str(e)

    return SentEmail.objects.create(
        organization=organization,
        candidate=candidate,
        template=template,
        sender=sender,
        recipient_email=candidate.email,
        subject=rendered_subject,
        body=rendered_body,
        status=sent_status,
        error_message=error_msg,
    )
