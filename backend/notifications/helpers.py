import logging
from .models import Notification

logger = logging.getLogger(__name__)


def create_notification(user, notification_type, title, message, data=None):
    """Create a notification for a user."""
    try:
        return Notification.objects.create(
            user=user,
            type=notification_type,
            title=title,
            message=message,
            data=data or {},
        )
    except Exception as e:
        logger.error(f"Failed to create notification for {user}: {e}")
        return None


def notify_org_members(organization, notification_type, title, message, data=None, exclude_user=None):
    """Send a notification to all members of an organization."""
    members = organization.members.all()
    if exclude_user:
        members = members.exclude(id=exclude_user.id)

    notifications = []
    for member in members:
        notifications.append(
            Notification(
                user=member,
                type=notification_type,
                title=title,
                message=message,
                data=data or {},
            )
        )

    if notifications:
        Notification.objects.bulk_create(notifications)
    return notifications
