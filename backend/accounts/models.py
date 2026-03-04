from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    company = models.CharField(max_length=255, blank=True)
    role = models.CharField(
        max_length=50,
        choices=[
            ('recruiter', 'Recruiter'),
            ('hiring_manager', 'Hiring Manager'),
            ('admin', 'Admin'),
        ],
        default='recruiter',
    )

    class Meta:
        ordering = ['-date_joined']

    def __str__(self):
        return self.email or self.username
