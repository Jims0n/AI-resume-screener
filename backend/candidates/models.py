from django.conf import settings
from django.db import models


class ProcessingBatch(models.Model):
    STATUS_CHOICES = [
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('partial', 'Partially Completed'),
    ]

    job = models.ForeignKey('jobs.Job', on_delete=models.CASCADE, related_name='batches')
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='upload_batches',
    )
    total_count = models.IntegerField(default=0)
    processed_count = models.IntegerField(default=0)
    failed_count = models.IntegerField(default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='processing')
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-started_at']

    def __str__(self):
        return f"Batch for {self.job.title} ({self.processed_count}/{self.total_count})"

    @property
    def progress_percentage(self):
        if self.total_count == 0:
            return 0
        return round((self.processed_count + self.failed_count) / self.total_count * 100, 1)


class Candidate(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('scored', 'Scored'),
        ('shortlisted', 'Shortlisted'),
        ('rejected', 'Rejected'),
    ]

    job = models.ForeignKey('jobs.Job', on_delete=models.CASCADE, related_name='candidates')
    batch = models.ForeignKey(
        ProcessingBatch,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='candidates',
    )
    name = models.CharField(max_length=255, default='Unknown')
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=50, blank=True)
    resume_file = models.FileField(upload_to='resumes/%Y/%m/')
    resume_text = models.TextField(blank=True)
    parsed_data = models.JSONField(default=dict, blank=True)
    overall_score = models.FloatField(null=True, blank=True)
    skill_match_score = models.FloatField(null=True, blank=True)
    experience_score = models.FloatField(null=True, blank=True)
    education_score = models.FloatField(null=True, blank=True)
    scoring_reasoning = models.TextField(blank=True)
    strengths = models.JSONField(default=list, blank=True)
    red_flags = models.JSONField(default=list, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    processed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-overall_score', '-created_at']
        indexes = [
            models.Index(fields=['job', 'status']),
            models.Index(fields=['-overall_score']),
            models.Index(fields=['-created_at']),
        ]

    def __str__(self):
        return f"{self.name} — {self.job.title}"


class SkillMatch(models.Model):
    PROFICIENCY_CHOICES = [
        ('none', 'Not Found'),
        ('beginner', 'Beginner'),
        ('intermediate', 'Intermediate'),
        ('advanced', 'Advanced'),
        ('expert', 'Expert'),
    ]

    candidate = models.ForeignKey(Candidate, on_delete=models.CASCADE, related_name='skill_matches')
    skill_name = models.CharField(max_length=100)
    found = models.BooleanField(default=False)
    proficiency = models.CharField(max_length=20, choices=PROFICIENCY_CHOICES, default='none')
    evidence = models.TextField(blank=True)
    is_required = models.BooleanField(default=True)

    class Meta:
        ordering = ['-is_required', '-found', 'skill_name']
        unique_together = ['candidate', 'skill_name']

    def __str__(self):
        icon = "✓" if self.found else "✗"
        return f"{icon} {self.skill_name} ({self.proficiency})"


class CandidateNote(models.Model):
    candidate = models.ForeignKey(Candidate, on_delete=models.CASCADE, related_name='notes')
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='candidate_notes',
    )
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Note by {self.user.email} on {self.candidate.name}"
