from django.db import models
from django.db.models import Avg
from django.conf import settings


class Job(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('active', 'Active'),
        ('closed', 'Closed'),
    ]

    organization = models.ForeignKey(
        'accounts.Organization',
        on_delete=models.CASCADE,
        related_name='jobs',
        null=True,
        blank=True,
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_jobs',
    )
    title = models.CharField(max_length=255)
    description = models.TextField()
    required_skills = models.JSONField(default=list, blank=True)
    nice_to_have_skills = models.JSONField(default=list, blank=True)
    min_experience_years = models.IntegerField(default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')

    # Custom scoring weights
    skill_weight = models.FloatField(default=0.5)
    experience_weight = models.FloatField(default=0.3)
    education_weight = models.FloatField(default=0.2)
    custom_criteria = models.JSONField(default=list, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['organization', 'status']),
            models.Index(fields=['-created_at']),
        ]

    def __str__(self):
        return self.title

    @property
    def candidate_count(self):
        return self.candidates.count()

    @property
    def average_score(self):
        result = self.candidates.filter(
            overall_score__isnull=False
        ).aggregate(avg=Avg('overall_score'))
        avg = result['avg']
        return round(avg, 1) if avg is not None else None
