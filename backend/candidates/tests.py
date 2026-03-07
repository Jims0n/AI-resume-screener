import os
import tempfile
from unittest.mock import patch, MagicMock
from django.test import TestCase, override_settings
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient
from rest_framework import status
from accounts.models import Organization
from .models import Candidate, SkillMatch
from jobs.models import Job

User = get_user_model()

TEMP_MEDIA = tempfile.mkdtemp()


class CandidateModelTests(TestCase):
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
            title='Python Dev',
            description='desc',
            required_skills=['Python'],
        )

    @override_settings(MEDIA_ROOT=TEMP_MEDIA)
    def test_candidate_str(self):
        candidate = Candidate.objects.create(
            job=self.job,
            name='John Doe',
            resume_file=SimpleUploadedFile('resume.pdf', b'content'),
        )
        self.assertIn('John Doe', str(candidate))
        self.assertIn('Python Dev', str(candidate))

    @override_settings(MEDIA_ROOT=TEMP_MEDIA)
    def test_candidate_default_status(self):
        candidate = Candidate.objects.create(
            job=self.job,
            resume_file=SimpleUploadedFile('resume.pdf', b'content'),
        )
        self.assertEqual(candidate.status, 'pending')
        self.assertEqual(candidate.name, 'Unknown')

    @override_settings(MEDIA_ROOT=TEMP_MEDIA)
    def test_candidate_ordering(self):
        c1 = Candidate.objects.create(
            job=self.job, name='Low', overall_score=30,
            resume_file=SimpleUploadedFile('r1.pdf', b'c'),
        )
        c2 = Candidate.objects.create(
            job=self.job, name='High', overall_score=90,
            resume_file=SimpleUploadedFile('r2.pdf', b'c'),
        )
        candidates = list(Candidate.objects.all())
        self.assertEqual(candidates[0], c2)  # higher score first


class SkillMatchModelTests(TestCase):
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
            organization=self.org, created_by=self.user,
            title='Dev', description='desc',
        )

    @override_settings(MEDIA_ROOT=TEMP_MEDIA)
    def test_skill_match_str_found(self):
        candidate = Candidate.objects.create(
            job=self.job,
            resume_file=SimpleUploadedFile('r.pdf', b'c'),
        )
        sm = SkillMatch.objects.create(
            candidate=candidate, skill_name='Python', found=True,
            proficiency='advanced',
        )
        self.assertIn('Python', str(sm))

    @override_settings(MEDIA_ROOT=TEMP_MEDIA)
    def test_skill_match_unique_together(self):
        candidate = Candidate.objects.create(
            job=self.job,
            resume_file=SimpleUploadedFile('r.pdf', b'c'),
        )
        SkillMatch.objects.create(
            candidate=candidate, skill_name='Python', found=True,
        )
        with self.assertRaises(Exception):
            SkillMatch.objects.create(
                candidate=candidate, skill_name='Python', found=False,
            )


@override_settings(MEDIA_ROOT=TEMP_MEDIA)
class ResumeUploadViewTests(TestCase):
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
            organization=self.org, created_by=self.user,
            title='Dev', description='desc',
        )
        self.client.force_authenticate(user=self.user)
        self.url = f'/api/jobs/{self.job.id}/upload'

    @patch('candidates.views.process_resume.delay')
    def test_upload_pdf(self, mock_task):
        pdf_file = SimpleUploadedFile('resume.pdf', b'%PDF-fake', content_type='application/pdf')
        response = self.client.post(self.url, {'files': pdf_file}, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(response.data['candidates']), 1)
        mock_task.assert_called_once()

    @patch('candidates.views.process_resume.delay')
    def test_upload_docx(self, mock_task):
        docx_file = SimpleUploadedFile('resume.docx', b'fake-docx', content_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document')
        response = self.client.post(self.url, {'files': docx_file}, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(response.data['candidates']), 1)

    @patch('candidates.views.process_resume.delay')
    def test_upload_invalid_type_skipped(self, mock_task):
        txt_file = SimpleUploadedFile('resume.txt', b'text content', content_type='text/plain')
        response = self.client.post(self.url, {'files': txt_file}, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('skipped', response.data)
        mock_task.assert_not_called()

    @patch('candidates.views.process_resume.delay')
    def test_upload_multiple_files(self, mock_task):
        pdf1 = SimpleUploadedFile('r1.pdf', b'%PDF-1', content_type='application/pdf')
        pdf2 = SimpleUploadedFile('r2.pdf', b'%PDF-2', content_type='application/pdf')
        response = self.client.post(self.url, {'files': [pdf1, pdf2]}, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(response.data['candidates']), 2)
        self.assertEqual(mock_task.call_count, 2)

    def test_upload_no_files(self):
        response = self.client.post(self.url, {}, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_upload_to_nonexistent_job(self):
        url = '/api/jobs/9999/upload'
        pdf_file = SimpleUploadedFile('resume.pdf', b'%PDF', content_type='application/pdf')
        response = self.client.post(url, {'files': pdf_file}, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_upload_to_other_users_job(self):
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
        url = f'/api/jobs/{other_job.id}/upload'
        pdf_file = SimpleUploadedFile('resume.pdf', b'%PDF', content_type='application/pdf')
        response = self.client.post(url, {'files': pdf_file}, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


@override_settings(MEDIA_ROOT=TEMP_MEDIA)
class CandidateListViewTests(TestCase):
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
            organization=self.org, created_by=self.user,
            title='Dev', description='desc',
        )
        self.client.force_authenticate(user=self.user)
        self.url = f'/api/jobs/{self.job.id}/candidates'

        self.c1 = Candidate.objects.create(
            job=self.job, name='Alice', overall_score=80, status='scored',
            resume_file=SimpleUploadedFile('a.pdf', b'c'),
        )
        self.c2 = Candidate.objects.create(
            job=self.job, name='Bob', overall_score=60, status='scored',
            resume_file=SimpleUploadedFile('b.pdf', b'c'),
        )

    def test_list_candidates(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 2)

    def test_filter_by_status(self):
        Candidate.objects.create(
            job=self.job, name='Pending', status='pending',
            resume_file=SimpleUploadedFile('p.pdf', b'c'),
        )
        response = self.client.get(f'{self.url}?status=scored')
        self.assertEqual(response.data['count'], 2)

    def test_ordering_by_name(self):
        response = self.client.get(f'{self.url}?ordering=name')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        names = [c['name'] for c in response.data['results']]
        self.assertEqual(names, ['Alice', 'Bob'])

    def test_ordering_by_score_desc(self):
        response = self.client.get(f'{self.url}?ordering=-overall_score')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        scores = [c['overall_score'] for c in response.data['results']]
        self.assertEqual(scores, [80, 60])


@override_settings(MEDIA_ROOT=TEMP_MEDIA)
class CandidateDetailViewTests(TestCase):
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
            organization=self.org, created_by=self.user,
            title='Dev', description='desc',
        )
        self.candidate = Candidate.objects.create(
            job=self.job, name='Alice', overall_score=80, status='scored',
            resume_file=SimpleUploadedFile('a.pdf', b'c'),
            scoring_reasoning='Strong candidate.',
        )
        self.client.force_authenticate(user=self.user)

    def test_retrieve_candidate(self):
        url = f'/api/candidates/{self.candidate.id}'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Alice')
        self.assertEqual(response.data['job_title'], 'Dev')

    def test_retrieve_other_users_candidate(self):
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
        other_candidate = Candidate.objects.create(
            job=other_job, name='Eve',
            resume_file=SimpleUploadedFile('e.pdf', b'c'),
        )
        url = f'/api/candidates/{other_candidate.id}'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


@override_settings(MEDIA_ROOT=TEMP_MEDIA)
class CandidateStatusUpdateViewTests(TestCase):
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
            organization=self.org, created_by=self.user,
            title='Dev', description='desc',
        )
        self.candidate = Candidate.objects.create(
            job=self.job, name='Alice', status='scored',
            resume_file=SimpleUploadedFile('a.pdf', b'c'),
        )
        self.client.force_authenticate(user=self.user)

    def test_update_status(self):
        url = f'/api/candidates/{self.candidate.id}/status'
        response = self.client.patch(url, {'status': 'shortlisted'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.candidate.refresh_from_db()
        self.assertEqual(self.candidate.status, 'shortlisted')

    def test_reject_candidate(self):
        url = f'/api/candidates/{self.candidate.id}/status'
        response = self.client.patch(url, {'status': 'rejected'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.candidate.refresh_from_db()
        self.assertEqual(self.candidate.status, 'rejected')


@override_settings(MEDIA_ROOT=TEMP_MEDIA)
class CandidateReprocessViewTests(TestCase):
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
            organization=self.org, created_by=self.user,
            title='Dev', description='desc',
        )
        self.candidate = Candidate.objects.create(
            job=self.job, name='Alice', status='scored',
            resume_file=SimpleUploadedFile('a.pdf', b'c'),
        )
        self.client.force_authenticate(user=self.user)

    @patch('candidates.views.process_resume.delay')
    def test_reprocess(self, mock_task):
        url = f'/api/candidates/{self.candidate.id}/reprocess'
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.candidate.refresh_from_db()
        self.assertEqual(self.candidate.status, 'pending')
        mock_task.assert_called_once_with(self.candidate.id)

    def test_reprocess_already_processing(self):
        self.candidate.status = 'processing'
        self.candidate.save()
        url = f'/api/candidates/{self.candidate.id}/reprocess'
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)


@override_settings(MEDIA_ROOT=TEMP_MEDIA)
class CandidateExportViewTests(TestCase):
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
            organization=self.org, created_by=self.user,
            title='Dev Role', description='desc',
        )
        Candidate.objects.create(
            job=self.job, name='Alice', email='alice@test.com',
            overall_score=85, status='scored',
            resume_file=SimpleUploadedFile('a.pdf', b'c'),
        )
        self.client.force_authenticate(user=self.user)

    def test_export_csv(self):
        url = f'/api/jobs/{self.job.id}/export'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Content-Type'], 'text/csv')
        self.assertIn('attachment', response['Content-Disposition'])
        content = response.content.decode()
        self.assertIn('Alice', content)
        self.assertIn('alice@test.com', content)

    def test_export_nonexistent_job(self):
        url = '/api/jobs/9999/export'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class ServicesTests(TestCase):
    def test_parse_json_response_valid(self):
        from candidates.services.utils import parse_json_response
        result = parse_json_response('{"key": "value"}')
        self.assertEqual(result, {'key': 'value'})

    def test_parse_json_response_with_wrapping_text(self):
        from candidates.services.utils import parse_json_response
        text = 'Here is the result:\n{"key": "value"}\nDone.'
        result = parse_json_response(text)
        self.assertEqual(result, {'key': 'value'})

    def test_parse_json_response_invalid(self):
        from candidates.services.utils import parse_json_response
        with self.assertRaises(ValueError):
            parse_json_response('no json here at all')

    def test_extract_text_unsupported_format(self):
        from candidates.services.parser import extract_text
        with self.assertRaises(ValueError):
            extract_text('/tmp/file.txt')
