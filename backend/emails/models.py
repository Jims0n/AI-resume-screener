from django.conf import settings
from django.db import models


class EmailTemplate(models.Model):
    TYPE_CHOICES = [
        ('shortlist', 'Shortlist'),
        ('rejection', 'Rejection'),
        ('interview_invite', 'Interview Invite'),
        ('custom', 'Custom'),
    ]

    organization = models.ForeignKey(
        'accounts.Organization',
        on_delete=models.CASCADE,
        related_name='email_templates',
    )
    name = models.CharField(max_length=100)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='custom')
    subject = models.CharField(max_length=255)
    body = models.TextField(
        help_text='Supports placeholders: {{candidate_name}}, {{job_title}}, {{company_name}}'
    )
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-is_default', '-created_at']

    def __str__(self):
        return f"{self.name} ({self.type})"


class SentEmail(models.Model):
    STATUS_CHOICES = [
        ('sent', 'Sent'),
        ('failed', 'Failed'),
    ]

    organization = models.ForeignKey(
        'accounts.Organization',
        on_delete=models.CASCADE,
        related_name='sent_emails',
    )
    candidate = models.ForeignKey(
        'candidates.Candidate',
        on_delete=models.CASCADE,
        related_name='sent_emails',
    )
    template = models.ForeignKey(
        EmailTemplate,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
    )
    recipient_email = models.EmailField()
    subject = models.CharField(max_length=255)
    body = models.TextField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='sent')
    error_message = models.TextField(blank=True)
    sent_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-sent_at']

    def __str__(self):
        return f"Email to {self.recipient_email} ({self.status})"
