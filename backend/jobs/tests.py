from unittest.mock import patch, MagicMock
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from accounts.models import Organization
from .models import Job

User = get_user_model()


class JobModelTests(TestCase):
    def setUp(self):
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
            title='Senior Python Developer',
            description='Looking for a senior Python developer.',
            required_skills=['Python', 'Django'],
            nice_to_have_skills=['React'],
            min_experience_years=3,
        )

    def test_job_str(self):
        self.assertEqual(str(self.job), 'Senior Python Developer')

    def test_job_default_status(self):
        self.assertEqual(self.job.status, 'active')

    def test_candidate_count_zero(self):
        self.assertEqual(self.job.candidate_count, 0)

    def test_average_score_none(self):
        self.assertIsNone(self.job.average_score)

    def test_job_ordering(self):
        job2 = Job.objects.create(
            organization=self.org, created_by=self.user,
            title='Job 2', description='desc',
        )
        jobs = list(Job.objects.all())
        self.assertEqual(jobs[0], job2)  # newer first


class JobViewSetTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.org = Organization.objects.create(
            name='Test Org', slug='test-org',
            max_jobs=10, max_resumes_per_job=50, max_users=10,
        )
        self.other_org = Organization.objects.create(
            name='Other Org', slug='other-org',
            max_jobs=10, max_resumes_per_job=50, max_users=10,
        )
        self.user = User.objects.create_user(
            username='recruiter', email='rec@example.com', password='TestPass123!',
            organization=self.org, role='owner',
        )
        self.other_user = User.objects.create_user(
            username='other', email='other@example.com', password='TestPass123!',
            organization=self.other_org, role='owner',
        )
        self.client.force_authenticate(user=self.user)
        self.url = '/api/jobs'

    def test_create_job(self):
        data = {
            'title': 'Backend Developer',
            'description': 'Build APIs with Django.',
            'required_skills': ['Python', 'Django'],
            'nice_to_have_skills': ['Docker'],
            'min_experience_years': 2,
        }
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['title'], 'Backend Developer')
        self.assertEqual(response.data['required_skills'], ['Python', 'Django'])

    def test_create_job_minimal(self):
        data = {
            'title': 'Engineer',
            'description': 'A great role.',
        }
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    @patch('jobs.views.extract_skills_from_description')
    def test_create_job_auto_extract_skills(self, mock_extract):
        mock_extract.return_value = {
            'required_skills': ['Python', 'SQL'],
            'nice_to_have_skills': ['AWS'],
            'min_experience_years': 2,
        }
        data = {
            'title': 'Data Engineer',
            'description': 'We need someone who knows Python and SQL for data pipelines on AWS.',
        }
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        mock_extract.assert_called_once()
        self.assertEqual(response.data['required_skills'], ['Python', 'SQL'])

    def test_list_jobs(self):
        Job.objects.create(
            organization=self.org, created_by=self.user,
            title='Job 1', description='desc 1',
        )
        Job.objects.create(
            organization=self.org, created_by=self.user,
            title='Job 2', description='desc 2',
        )
        Job.objects.create(
            organization=self.other_org, created_by=self.other_user,
            title='Other Job', description='desc',
        )
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 2)

    def test_retrieve_job(self):
        job = Job.objects.create(
            organization=self.org, created_by=self.user,
            title='My Job', description='desc',
        )
        response = self.client.get(f'{self.url}/{job.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'My Job')

    def test_retrieve_other_user_job_404(self):
        job = Job.objects.create(
            organization=self.other_org, created_by=self.other_user,
            title='Not Mine', description='desc',
        )
        response = self.client.get(f'{self.url}/{job.id}')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_job(self):
        job = Job.objects.create(
            organization=self.org, created_by=self.user,
            title='Old Title', description='desc',
        )
        response = self.client.patch(
            f'{self.url}/{job.id}', {'title': 'New Title'}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'New Title')

    def test_delete_job(self):
        job = Job.objects.create(
            organization=self.org, created_by=self.user,
            title='Delete Me', description='desc',
        )
        response = self.client.delete(f'{self.url}/{job.id}')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Job.objects.filter(id=job.id).exists())

    def test_unauthenticated(self):
        client = APIClient()
        response = client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_invalid_skills_type(self):
        data = {
            'title': 'Dev',
            'description': 'desc',
            'required_skills': 'Python',  # should be a list
        }
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_negative_experience(self):
        data = {
            'title': 'Dev',
            'description': 'desc',
            'min_experience_years': -1,
        }
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class JobSerializerValidationTests(TestCase):
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
        self.client.force_authenticate(user=self.user)

    def test_skills_must_be_strings(self):
        data = {
            'title': 'Dev',
            'description': 'desc',
            'required_skills': [123, None],
        }
        response = self.client.post('/api/jobs', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_empty_string_in_skills(self):
        data = {
            'title': 'Dev',
            'description': 'desc',
            'required_skills': ['Python', ''],
        }
        response = self.client.post('/api/jobs', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
