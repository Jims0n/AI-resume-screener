import logging

from django.conf import settings

from .models import SentEmail
from .resend_service import send_html_email

info_logger = logging.getLogger('app_info')
error_logger = logging.getLogger('app_error')


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
    """Send an email to a candidate via Resend and record it."""
    if not candidate.email:
        info_logger.warning(f"Email skipped: candidate={candidate.id} has no email address")
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
        send_html_email(
            to=candidate.email,
            subject=rendered_subject,
            template_name='candidate_email.html',
            context={
                'email_subject': rendered_subject,
                'email_body': rendered_body,
                'greeting_tag': '',
                'closing_tag': organization.name,
            },
        )
        sent_status = 'sent'
        error_msg = ''
    except Exception as e:
        error_logger.error(f"Failed to send email: candidate={candidate.id} error={e}", exc_info=True)
        sent_status = 'failed'
        error_msg = str(e)

    info_logger.info(f"Email delivery: candidate={candidate.id} status={sent_status}")
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
