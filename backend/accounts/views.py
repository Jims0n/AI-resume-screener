import logging

from django.contrib.auth import authenticate, get_user_model
from django.db import transaction
from rest_framework import status, generics
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

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

logger = logging.getLogger(__name__)
User = get_user_model()


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = [AllowAny]
    throttle_scope = 'login'

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = authenticate(
            username=serializer.validated_data['username'],
            password=serializer.validated_data['password'],
        )

        if user is None:
            return Response(
                {'detail': 'Invalid credentials.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        })


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

        member.role = serializer.validated_data['role']
        member.save(update_fields=['role'])

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

        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }, status=status.HTTP_201_CREATED)
