from django.db import models


class Candidate(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('scored', 'Scored'),
        ('shortlisted', 'Shortlisted'),
        ('rejected', 'Rejected'),
    ]

    job = models.ForeignKey('jobs.Job', on_delete=models.CASCADE, related_name='candidates')
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
        status = "✓" if self.found else "✗"
        return f"{status} {self.skill_name} ({self.proficiency})"
