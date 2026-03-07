import uuid
from datetime import timedelta

from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
from django.utils.text import slugify


class Organization(models.Model):
    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    logo = models.ImageField(upload_to='org_logos/', blank=True, null=True)
    max_jobs = models.IntegerField(default=3)
    max_resumes_per_job = models.IntegerField(default=10)
    max_users = models.IntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.name) or 'org'
            slug = base_slug
            counter = 1
            while Organization.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f'{base_slug}-{counter}'
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)

    @property
    def member_count(self):
        return self.members.count()

    @property
    def active_job_count(self):
        return self.jobs.filter(status='active').count()


class User(AbstractUser):
    ROLE_CHOICES = [
        ('owner', 'Owner'),
        ('admin', 'Admin'),
        ('recruiter', 'Recruiter'),
        ('hiring_manager', 'Hiring Manager'),
        ('viewer', 'Viewer'),
    ]

    email = models.EmailField(unique=True)
    company = models.CharField(max_length=255, blank=True)
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name='members',
        null=True,
        blank=True,
    )
    role = models.CharField(max_length=50, choices=ROLE_CHOICES, default='recruiter')
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)

    class Meta:
        ordering = ['-date_joined']

    def __str__(self):
        return self.email or self.username

    @property
    def is_org_admin(self):
        return self.role in ('owner', 'admin')


class OrganizationInvite(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('expired', 'Expired'),
        ('cancelled', 'Cancelled'),
    ]

    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name='invites',
    )
    email = models.EmailField()
    role = models.CharField(max_length=50, choices=User.ROLE_CHOICES, default='recruiter')
    token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    invited_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='sent_invites',
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['token']),
            models.Index(fields=['email', 'organization']),
        ]

    def __str__(self):
        return f"Invite for {self.email} to {self.organization.name}"

    def save(self, *args, **kwargs):
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(days=7)
        super().save(*args, **kwargs)

    @property
    def is_expired(self):
        return timezone.now() > self.expires_at

    @property
    def is_valid(self):
        return self.status == 'pending' and not self.is_expired


class ActivityLog(models.Model):
    ACTION_CHOICES = [
        ('created_job', 'Created Job'),
        ('updated_job', 'Updated Job'),
        ('closed_job', 'Closed Job'),
        ('uploaded_resumes', 'Uploaded Resumes'),
        ('shortlisted', 'Shortlisted Candidate'),
        ('rejected', 'Rejected Candidate'),
        ('reprocessed', 'Reprocessed Candidate'),
        ('sent_email', 'Sent Email'),
        ('invited_member', 'Invited Member'),
        ('removed_member', 'Removed Member'),
        ('updated_member_role', 'Updated Member Role'),
        ('added_note', 'Added Note'),
        ('compared_candidates', 'Compared Candidates'),
        ('exported_data', 'Exported Data'),
    ]

    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name='activity_logs',
    )
    user = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='activity_logs',
    )
    action = models.CharField(max_length=50, choices=ACTION_CHOICES)
    target_type = models.CharField(max_length=50)  # 'job', 'candidate', 'user', etc.
    target_id = models.IntegerField(null=True, blank=True)
    details = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['organization', '-created_at']),
            models.Index(fields=['action']),
            models.Index(fields=['target_type', 'target_id']),
        ]

    def __str__(self):
        user_label = self.user.email if self.user else 'System'
        return f"{user_label} {self.action} {self.target_type}#{self.target_id}"
