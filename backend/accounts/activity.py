import logging
from .models import ActivityLog

logger = logging.getLogger(__name__)


def log_activity(user, action, target_type, target_id=None, details=None, request=None):
    """Log an activity for the user's organization."""
    if not user or not user.organization:
        return None

    ip_address = None
    if request:
        ip_address = _get_client_ip(request)

    try:
        return ActivityLog.objects.create(
            organization=user.organization,
            user=user,
            action=action,
            target_type=target_type,
            target_id=target_id,
            details=details or {},
            ip_address=ip_address,
        )
    except Exception as e:
        logger.error(f"Failed to log activity: {e}")
        return None


def _get_client_ip(request):
    """Extract client IP from request headers."""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')
