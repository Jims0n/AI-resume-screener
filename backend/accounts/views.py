import logging
import secrets
from datetime import timedelta

from django.contrib.auth import authenticate, get_user_model
from django.core.cache import cache
from django.db import transaction
from django.utils import timezone
from rest_framework import status, generics
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

RESET_TOKEN_EXPIRY = timedelta(hours=1)
RESET_TOKEN_PREFIX = 'pwd_reset:'

from .models import OrganizationInvite
from .permissions import (
    IsOrganizationAdmin,
    IsOrganizationMember,
    check_user_limit,
)
from .serializers import (
    RegisterSerializer,
    LoginSerializer,
    UserSerializer,
    UserListSerializer,
    OrganizationSerializer,
    OrganizationUpdateSerializer,
    InviteSerializer,
    InviteListSerializer,
    JoinOrganizationSerializer,
    MemberUpdateSerializer,
)

info_logger = logging.getLogger('app_info')
error_logger = logging.getLogger('app_error')
User = get_user_model()


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    authentication_classes = []
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        info_logger.info(f"New user registered: {user.username} (org={user.organization})")

        # Send welcome email
        try:
            from emails.tasks import send_welcome_email_task
            send_welcome_email_task.delay(user.email, user.username)
        except Exception as e:
            error_logger.error(f"Failed to queue welcome email for {user.email}: {e}")

        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_scope = 'login'

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email'].lower()
        try:
            user_obj = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            info_logger.info(f"Failed login attempt for email={email}")
            return Response(
                {'detail': 'Invalid credentials.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        user = authenticate(
            username=user_obj.username,
            password=serializer.validated_data['password'],
        )

        if user is None:
            info_logger.info(f"Failed login attempt for email={email}")
            return Response(
                {'detail': 'Invalid credentials.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        info_logger.info(f"User logged in: {user.username}")

        # Send login notification email
        try:
            from emails.tasks import send_login_notification_task
            ip_address = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR', '')).split(',')[0].strip()
            user_agent = request.META.get('HTTP_USER_AGENT', 'Unknown')
            login_time = timezone.now().strftime('%a %b %d, %Y at %I:%M %p UTC')
            send_login_notification_task.delay(user.email, user.username, ip_address, user_agent, login_time)
        except Exception as e:
            error_logger.error(f"Failed to queue login notification for {user.email}: {e}")

        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        })


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response(
                {'detail': 'Refresh token is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
            info_logger.info(f"User logged out: {request.user.username}")
            return Response({'detail': 'Successfully logged out.'})
        except Exception:
            return Response(
                {'detail': 'Invalid token.'},
                status=status.HTTP_400_BAD_REQUEST,
            )


class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


# --- Organization views ---

class OrganizationDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated, IsOrganizationMember]

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return OrganizationUpdateSerializer
        return OrganizationSerializer

    def get_object(self):
        return self.request.user.organization

    def check_permissions(self, request):
        super().check_permissions(request)
        if request.method in ('PUT', 'PATCH') and not request.user.is_org_admin:
            self.permission_denied(request, message='Only admins can update organization details.')


class OrganizationMembersView(generics.ListAPIView):
    serializer_class = UserListSerializer
    permission_classes = [IsAuthenticated, IsOrganizationMember]

    def get_queryset(self):
        return User.objects.filter(
            organization=self.request.user.organization,
        ).order_by('-date_joined')


class MemberUpdateView(APIView):
    permission_classes = [IsAuthenticated, IsOrganizationAdmin]

    def patch(self, request, user_id):
        org = request.user.organization
        try:
            member = User.objects.get(id=user_id, organization=org)
        except User.DoesNotExist:
            return Response({'detail': 'Member not found.'}, status=status.HTTP_404_NOT_FOUND)

        if member.role == 'owner':
            return Response(
                {'detail': 'Cannot change the owner\'s role.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if member == request.user:
            return Response(
                {'detail': 'Cannot change your own role.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = MemberUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        old_role = member.role
        member.role = serializer.validated_data['role']
        member.save(update_fields=['role'])
        info_logger.info(f"Member role changed: {member.username} {old_role}→{member.role} by {request.user.username}")

        return Response(UserListSerializer(member).data)

    def delete(self, request, user_id):
        org = request.user.organization
        try:
            member = User.objects.get(id=user_id, organization=org)
        except User.DoesNotExist:
            return Response({'detail': 'Member not found.'}, status=status.HTTP_404_NOT_FOUND)

        if member.role == 'owner':
            return Response(
                {'detail': 'Cannot remove the owner.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if member == request.user:
            return Response(
                {'detail': 'Cannot remove yourself. Transfer ownership first.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        member.organization = None
        member.save(update_fields=['organization'])
        info_logger.info(f"Member removed: {member.username} from org={org.name} by {request.user.username}")

        return Response(status=status.HTTP_204_NO_CONTENT)


# --- Invite views ---

class InviteCreateView(APIView):
    permission_classes = [IsAuthenticated, IsOrganizationAdmin]

    def post(self, request):
        org = request.user.organization
        check_user_limit(org)

        serializer = InviteSerializer(
            data=request.data,
            context={'organization': org},
        )
        serializer.is_valid(raise_exception=True)

        invite = OrganizationInvite.objects.create(
            organization=org,
            email=serializer.validated_data['email'],
            role=serializer.validated_data['role'],
            invited_by=request.user,
        )
        info_logger.info(f"Invite created: email={invite.email} role={invite.role} org={org.name} by {request.user.username}")

        # Send team invite email
        try:
            from emails.tasks import send_team_invite_email_task
            send_team_invite_email_task.delay(
                invite.email,
                org.name,
                str(invite.token),
                request.user.username,
                invite.role,
            )
        except Exception as e:
            error_logger.error(f"Failed to queue invite email for {invite.email}: {e}")

        return Response({
            'detail': 'Invitation created.',
            'invite': InviteListSerializer(invite).data,
            'join_token': str(invite.token),
        }, status=status.HTTP_201_CREATED)


class InviteListView(generics.ListAPIView):
    serializer_class = InviteListSerializer
    permission_classes = [IsAuthenticated, IsOrganizationAdmin]

    def get_queryset(self):
        return OrganizationInvite.objects.filter(
            organization=self.request.user.organization,
        )


class InviteCancelView(APIView):
    permission_classes = [IsAuthenticated, IsOrganizationAdmin]

    def post(self, request, invite_id):
        try:
            invite = OrganizationInvite.objects.get(
                id=invite_id,
                organization=request.user.organization,
                status='pending',
            )
        except OrganizationInvite.DoesNotExist:
            return Response({'detail': 'Invite not found.'}, status=status.HTTP_404_NOT_FOUND)

        invite.status = 'cancelled'
        invite.save(update_fields=['status'])
        return Response({'detail': 'Invite cancelled.'})


class JoinOrganizationView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, token):
        """Get invite details for the join page."""
        try:
            invite = OrganizationInvite.objects.select_related('organization').get(token=token)
        except OrganizationInvite.DoesNotExist:
            return Response({'detail': 'Invalid invite token.'}, status=status.HTTP_404_NOT_FOUND)

        if not invite.is_valid:
            return Response(
                {'detail': 'This invite has expired or been used.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response({
            'organization_name': invite.organization.name,
            'email': invite.email,
            'role': invite.role,
        })

    @transaction.atomic
    def post(self, request, token):
        """Accept invite and create account or join existing user."""
        try:
            invite = OrganizationInvite.objects.select_related('organization').get(token=token)
        except OrganizationInvite.DoesNotExist:
            return Response({'detail': 'Invalid invite token.'}, status=status.HTTP_404_NOT_FOUND)

        if not invite.is_valid:
            return Response(
                {'detail': 'This invite has expired or been used.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check if user with this email already exists
        existing_user = User.objects.filter(email__iexact=invite.email).first()
        if existing_user:
            # Require the authenticated user to match the invite email
            if request.user.is_authenticated and request.user.email.lower() != invite.email.lower():
                return Response(
                    {'detail': 'This invite was sent to a different email address.'},
                    status=status.HTTP_403_FORBIDDEN,
                )
            if existing_user.organization and existing_user.organization != invite.organization:
                return Response(
                    {'detail': 'This user already belongs to another organization.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            existing_user.organization = invite.organization
            existing_user.role = invite.role
            existing_user.save(update_fields=['organization', 'role'])

            invite.status = 'accepted'
            invite.save(update_fields=['status'])
            info_logger.info(f"Existing user joined org via invite: {existing_user.username} → org={invite.organization.name}")

            refresh = RefreshToken.for_user(existing_user)
            return Response({
                'user': UserSerializer(existing_user).data,
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            })

        # Create new user
        serializer = JoinOrganizationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = User.objects.create_user(
            username=serializer.validated_data['username'],
            email=invite.email,
            password=serializer.validated_data['password'],
            organization=invite.organization,
            role=invite.role,
        )

        invite.status = 'accepted'
        invite.save(update_fields=['status'])
        info_logger.info(f"New user joined via invite: {user.username} → org={invite.organization.name} role={invite.role}")

        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }, status=status.HTTP_201_CREATED)


# --- Password reset views ---

class PasswordResetRequestView(APIView):
    """Request a password reset email."""
    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_scope = 'login'

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        if not email:
            return Response(
                {'detail': 'Email is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Always return success to prevent email enumeration
        try:
            user = User.objects.get(email__iexact=email)

            token = secrets.token_urlsafe(48)
            cache_key = f'{RESET_TOKEN_PREFIX}{token}'
            cache.set(cache_key, user.id, timeout=int(RESET_TOKEN_EXPIRY.total_seconds()))

            from emails.tasks import send_password_reset_email_task
            send_password_reset_email_task.delay(user.email, user.username, token)

            info_logger.info(f"Password reset requested: email={email}")

        except User.DoesNotExist:
            info_logger.info(f"Password reset requested for unknown email: {email}")
        except Exception as e:
            error_logger.error(f"Password reset error: {e}")

        return Response({'detail': 'If that email exists, a reset link has been sent.'})


class PasswordResetConfirmView(APIView):
    """Confirm password reset with token and new password."""
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        token = request.data.get('token', '')
        new_password = request.data.get('password', '')

        if not token or not new_password:
            return Response(
                {'detail': 'Token and password are required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if len(new_password) < 8:
            return Response(
                {'detail': 'Password must be at least 8 characters.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        cache_key = f'{RESET_TOKEN_PREFIX}{token}'
        user_id = cache.get(cache_key)

        if not user_id:
            return Response(
                {'detail': 'Invalid or expired reset token.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user = User.objects.get(id=user_id)
            user.set_password(new_password)
            user.save(update_fields=['password'])

            cache.delete(cache_key)

            info_logger.info(f"Password reset successful: user={user.username}")
            return Response({'detail': 'Password has been reset successfully.'})

        except User.DoesNotExist:
            return Response(
                {'detail': 'User not found.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
