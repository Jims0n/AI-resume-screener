from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

User = get_user_model()


class UserModelTests(TestCase):
    def test_create_user(self):
        user = User.objects.create_user(
            username='testuser', email='test@example.com', password='TestPass123!'
        )
        self.assertEqual(user.username, 'testuser')
        self.assertEqual(user.email, 'test@example.com')
        self.assertEqual(user.role, 'recruiter')
        self.assertTrue(user.check_password('TestPass123!'))

    def test_user_str(self):
        user = User.objects.create_user(
            username='testuser', email='test@example.com', password='TestPass123!'
        )
        self.assertEqual(str(user), 'test@example.com')

    def test_user_str_no_email(self):
        user = User.objects.create_user(
            username='testuser', email='', password='TestPass123!'
        )
        self.assertEqual(str(user), 'testuser')

    def test_email_unique(self):
        User.objects.create_user(
            username='user1', email='same@example.com', password='TestPass123!'
        )
        with self.assertRaises(Exception):
            User.objects.create_user(
                username='user2', email='same@example.com', password='TestPass123!'
            )

    def test_role_choices(self):
        user = User.objects.create_user(
            username='manager', email='mgr@example.com', password='TestPass123!',
            role='hiring_manager'
        )
        self.assertEqual(user.role, 'hiring_manager')


class RegisterViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = '/api/auth/register/'

    def test_register_success(self):
        data = {
            'username': 'newuser',
            'email': 'new@example.com',
            'password': 'StrongPass123!',
            'password_confirm': 'StrongPass123!',
        }
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertEqual(response.data['user']['username'], 'newuser')
        self.assertEqual(response.data['user']['email'], 'new@example.com')

    def test_register_password_mismatch(self):
        data = {
            'username': 'newuser',
            'email': 'new@example.com',
            'password': 'StrongPass123!',
            'password_confirm': 'DifferentPass123!',
        }
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_weak_password(self):
        data = {
            'username': 'newuser',
            'email': 'new@example.com',
            'password': '123',
            'password_confirm': '123',
        }
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_duplicate_email(self):
        User.objects.create_user(
            username='existing', email='dup@example.com', password='TestPass123!'
        )
        data = {
            'username': 'newuser',
            'email': 'dup@example.com',
            'password': 'StrongPass123!',
            'password_confirm': 'StrongPass123!',
        }
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_missing_email(self):
        data = {
            'username': 'newuser',
            'password': 'StrongPass123!',
            'password_confirm': 'StrongPass123!',
        }
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_with_company_and_role(self):
        data = {
            'username': 'newuser',
            'email': 'new@example.com',
            'password': 'StrongPass123!',
            'password_confirm': 'StrongPass123!',
            'company': 'Acme Inc',
            'role': 'hiring_manager',
        }
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['user']['company'], 'Acme Inc')
        self.assertEqual(response.data['user']['role'], 'hiring_manager')


class LoginViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = '/api/auth/login/'
        self.user = User.objects.create_user(
            username='testuser', email='test@example.com', password='TestPass123!'
        )

    def test_login_success(self):
        data = {'username': 'testuser', 'password': 'TestPass123!'}
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_login_invalid_password(self):
        data = {'username': 'testuser', 'password': 'WrongPass'}
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_login_nonexistent_user(self):
        data = {'username': 'nouser', 'password': 'TestPass123!'}
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class ProfileViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = '/api/auth/me/'
        self.user = User.objects.create_user(
            username='testuser', email='test@example.com', password='TestPass123!',
            company='TestCo', role='recruiter'
        )
        self.client.force_authenticate(user=self.user)

    def test_get_profile(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'testuser')
        self.assertEqual(response.data['email'], 'test@example.com')
        self.assertEqual(response.data['company'], 'TestCo')

    def test_update_profile(self):
        response = self.client.patch(self.url, {'company': 'NewCo'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['company'], 'NewCo')

    def test_profile_unauthenticated(self):
        client = APIClient()
        response = client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class TokenRefreshTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser', email='test@example.com', password='TestPass123!'
        )

    def test_refresh_token(self):
        login_response = self.client.post(
            '/api/auth/login/',
            {'username': 'testuser', 'password': 'TestPass123!'},
            format='json'
        )
        refresh_token = login_response.data['refresh']
        response = self.client.post(
            '/api/auth/refresh/',
            {'refresh': refresh_token},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)

    def test_refresh_invalid_token(self):
        response = self.client.post(
            '/api/auth/refresh/',
            {'refresh': 'invalidtoken'},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
