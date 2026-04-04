import logging
from django.conf import settings
from django.template.loader import render_to_string

info_logger = logging.getLogger('app_info')
error_logger = logging.getLogger('app_error')


def send_html_email(to, subject, template_name, context=None):
    """
    Render an HTML email template and send it via Resend.

    Falls back to console logging if RESEND_API_KEY is not configured.
    """
    context = context or {}
    context.setdefault('frontend_url', settings.FRONTEND_URL)
    context.setdefault('email_title', subject)

    html_content = render_to_string(template_name, context)

    api_key = getattr(settings, 'RESEND_API_KEY', '')
    from_email = settings.DEFAULT_FROM_EMAIL

    if not api_key:
        # Fallback: log to console when no API key (dev mode)
        # Do NOT log context — it may contain sensitive data (e.g. reset tokens)
        info_logger.warning(
            f"[EMAIL-DEV] RESEND_API_KEY not configured. Email not sent: "
            f"to={to} subject='{subject}' template={template_name}"
        )
        return {'id': 'dev-mode', 'to': to, 'subject': subject}

    try:
        import resend
        resend.api_key = api_key

        params = {
            'from': from_email,
            'to': [to] if isinstance(to, str) else to,
            'subject': subject,
            'html': html_content,
        }

        response = resend.Emails.send(params)
        info_logger.info(f"Email sent via Resend: to={to} subject='{subject}' id={response.get('id', 'N/A')}")
        return response

    except Exception as e:
        error_logger.error(f"Failed to send email via Resend: to={to} subject='{subject}' error={e}", exc_info=True)
        raise
