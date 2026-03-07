import tempfile
from django.test import TestCase, override_settings
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient
from rest_framework import status
from accounts.models import Organization
from jobs.models import Job
from candidates.models import Candidate, SkillMatch

User = get_user_model()

TEMP_MEDIA = tempfile.mkdtemp()


@override_settings(MEDIA_ROOT=TEMP_MEDIA)
class JobAnalyticsViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.org = Organization.objects.create(
            name='Test Org', slug='test-org',
            max_jobs=10, max_resumes_per_job=50, max_users=10,
        )
        self.user = User.objects.create_user(
            username='recruiter', email='rec@example.com', password='TestPass123!',
            organization=self.org, role='owner',
        )
        self.job = Job.objects.create(
            organization=self.org,
            created_by=self.user,
            title='Python Dev',
            description='desc',
            required_skills=['Python', 'Django'],
        )
        self.client.force_authenticate(user=self.user)
        self.url = f'/api/jobs/{self.job.id}/analytics'

    def test_analytics_empty_job(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total_candidates'], 0)
        self.assertEqual(response.data['total_scored'], 0)

    def test_analytics_with_candidates(self):
        c1 = Candidate.objects.create(
            job=self.job, name='Alice', overall_score=80,
            skill_match_score=85, experience_score=75, education_score=70,
            status='scored',
            resume_file=SimpleUploadedFile('a.pdf', b'c'),
        )
        c2 = Candidate.objects.create(
            job=self.job, name='Bob', overall_score=60,
            skill_match_score=55, experience_score=65, education_score=60,
            status='scored',
            resume_file=SimpleUploadedFile('b.pdf', b'c'),
        )
        Candidate.objects.create(
            job=self.job, name='Pending', status='pending',
            resume_file=SimpleUploadedFile('p.pdf', b'c'),
        )

        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total_candidates'], 3)
        self.assertEqual(response.data['total_scored'], 2)

        # Pipeline
        self.assertEqual(response.data['pipeline']['scored'], 2)
        self.assertEqual(response.data['pipeline']['pending'], 1)

        # Average scores
        self.assertEqual(response.data['average_scores']['average_overall'], 70.0)

        # Score distribution
        self.assertTrue(len(response.data['score_distribution']) > 0)

        # Top candidates
        self.assertEqual(len(response.data['top_candidates']), 2)
        self.assertEqual(response.data['top_candidates'][0]['name'], 'Alice')

    def test_analytics_skill_gap(self):
        c1 = Candidate.objects.create(
            job=self.job, name='Alice', overall_score=80, status='scored',
            resume_file=SimpleUploadedFile('a.pdf', b'c'),
        )
        c2 = Candidate.objects.create(
            job=self.job, name='Bob', overall_score=60, status='scored',
            resume_file=SimpleUploadedFile('b.pdf', b'c'),
        )
        # Alice has both skills
        SkillMatch.objects.create(candidate=c1, skill_name='Python', found=True)
        SkillMatch.objects.create(candidate=c1, skill_name='Django', found=True)
        # Bob has only Python
        SkillMatch.objects.create(candidate=c2, skill_name='Python', found=True)
        SkillMatch.objects.create(candidate=c2, skill_name='Django', found=False)

        response = self.client.get(self.url)
        skill_gap = {s['skill']: s['percentage'] for s in response.data['skill_gap']}
        self.assertEqual(skill_gap['Python'], 100.0)
        self.assertEqual(skill_gap['Django'], 50.0)

    def test_analytics_nonexistent_job(self):
        response = self.client.get('/api/jobs/9999/analytics')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_analytics_other_users_job(self):
        other_org = Organization.objects.create(
            name='Other Org', slug='other-org',
            max_jobs=10, max_resumes_per_job=50, max_users=10,
        )
        other = User.objects.create_user(
            username='other', email='other@example.com', password='TestPass123!',
            organization=other_org, role='owner',
        )
        other_job = Job.objects.create(
            organization=other_org, created_by=other,
            title='Other', description='desc',
        )
        response = self.client.get(f'/api/jobs/{other_job.id}/analytics')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_analytics_unauthenticated(self):
        client = APIClient()
        response = client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
