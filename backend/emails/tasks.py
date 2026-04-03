import logging
from celery import shared_task
from django.conf import settings

info_logger = logging.getLogger('app_info')
error_logger = logging.getLogger('app_error')


@shared_task(bind=True, max_retries=3, default_retry_delay=30)
def send_welcome_email_task(self, user_email, username):
    """Send welcome email after user registration."""
    try:
        from .resend_service import send_html_email

        send_html_email(
            to=user_email,
            subject='Welcome to Shortlyst! 🎉',
            template_name='welcome.html',
            context={
                'username': username,
                'frontend_url': settings.FRONTEND_URL,
            },
        )
    except Exception as exc:
        error_logger.error(f"Failed to send welcome email to {user_email}: {exc}")
        raise self.retry(exc=exc)


@shared_task(bind=True, max_retries=3, default_retry_delay=30)
def send_team_invite_email_task(self, email, org_name, invite_token, inviter_name, role):
    """Send team invite email with join link."""
    try:
        from .resend_service import send_html_email

        send_html_email(
            to=email,
            subject=f'{inviter_name} invited you to join {org_name} on Shortlyst',
            template_name='team_invite.html',
            context={
                'inviter_name': inviter_name,
                'organization_name': org_name,
                'invite_token': invite_token,
                'role': role,
                'frontend_url': settings.FRONTEND_URL,
            },
        )
    except Exception as exc:
        error_logger.error(f"Failed to send team invite email to {email}: {exc}")
        raise self.retry(exc=exc)


@shared_task(bind=True, max_retries=3, default_retry_delay=30)
def send_login_notification_task(self, user_email, username, ip_address, user_agent, login_time):
    """Send login notification email."""
    try:
        from .resend_service import send_html_email

        send_html_email(
            to=user_email,
            subject='New login to your Shortlyst account',
            template_name='login_notification.html',
            context={
                'username': username,
                'ip_address': ip_address,
                'user_agent': user_agent,
                'login_time': login_time,
            },
        )
    except Exception as exc:
        error_logger.error(f"Failed to send login notification to {user_email}: {exc}")
        raise self.retry(exc=exc)


@shared_task(bind=True, max_retries=3, default_retry_delay=30)
def send_password_reset_email_task(self, user_email, username, reset_token):
    """Send password reset email with reset link."""
    try:
        from .resend_service import send_html_email

        send_html_email(
            to=user_email,
            subject='Reset your Shortlyst password',
            template_name='password_reset.html',
            context={
                'username': username,
                'reset_token': reset_token,
                'frontend_url': settings.FRONTEND_URL,
            },
        )
    except Exception as exc:
        error_logger.error(f"Failed to send password reset email to {user_email}: {exc}")
        raise self.retry(exc=exc)


@shared_task(bind=True, max_retries=2, default_retry_delay=15)
def send_candidate_email_task(self, org_id, candidate_id, sender_id, subject, body, template_id=None):
    """Send email to a candidate asynchronously."""
    try:
        from django.contrib.auth import get_user_model
        from candidates.models import Candidate
        from accounts.models import Organization
        from .models import EmailTemplate, SentEmail
        from .services import send_candidate_email

        User = get_user_model()
        organization = Organization.objects.get(id=org_id)
        candidate = Candidate.objects.select_related('job').get(id=candidate_id)
        sender = User.objects.get(id=sender_id)
        template = EmailTemplate.objects.get(id=template_id, organization=organization) if template_id else None

        send_candidate_email(
            organization=organization,
            candidate=candidate,
            sender=sender,
            subject=subject,
            body=body,
            template=template,
        )
    except Exception as exc:
        error_logger.error(f"Failed to send candidate email task: candidate={candidate_id} error={exc}")
        raise self.retry(exc=exc)
