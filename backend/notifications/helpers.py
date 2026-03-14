import logging
from .models import Notification

info_logger = logging.getLogger('app_info')
error_logger = logging.getLogger('app_error')


def create_notification(user, notification_type, title, message, data=None):
    """Create a notification for a user."""
    try:
        notification = Notification.objects.create(
            user=user,
            type=notification_type,
            title=title,
            message=message,
            data=data or {},
        )
        info_logger.info(f"Notification created: type='{notification_type}' user={user.username} title='{title}'")
        return notification
    except Exception as e:
        error_logger.error(f"Failed to create notification for {user}: {e}", exc_info=True)
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
        info_logger.info(
            f"Org notifications sent: type='{notification_type}' org={organization.name} "
            f"recipients={len(notifications)}"
        )
    return notifications
