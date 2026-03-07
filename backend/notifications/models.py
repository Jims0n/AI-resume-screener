from django.conf import settings
from django.db import models


class Notification(models.Model):
    TYPE_CHOICES = [
        ('processing_complete', 'Processing Complete'),
        ('batch_complete', 'Batch Complete'),
        ('candidate_shortlisted', 'Candidate Shortlisted'),
        ('candidate_rejected', 'Candidate Rejected'),
        ('plan_limit_warning', 'Plan Limit Warning'),
        ('invite_accepted', 'Invite Accepted'),
        ('member_joined', 'Member Joined'),
        ('job_created', 'Job Created'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications',
    )
    type = models.CharField(max_length=50, choices=TYPE_CHOICES)
    title = models.CharField(max_length=255)
    message = models.TextField()
    data = models.JSONField(default=dict, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'is_read', '-created_at']),
            models.Index(fields=['type']),
        ]

    def __str__(self):
        return f"{self.title} — {self.user.email}"
