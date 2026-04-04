from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    RegisterView,
    LoginView,
    LogoutView,
    ProfileView,
    OrganizationDetailView,
    OrganizationMembersView,
    MemberUpdateView,
    InviteCreateView,
    InviteListView,
    InviteCancelView,
    JoinOrganizationView,
    PasswordResetRequestView,
    PasswordResetConfirmView,
)

from .activity_views import ActivityLogListView

urlpatterns = [
    # Auth
    path('register', RegisterView.as_view(), name='register'),
    path('login', LoginView.as_view(), name='login'),
    path('logout', LogoutView.as_view(), name='logout'),
    path('refresh', TokenRefreshView.as_view(), name='token_refresh'),
    path('me', ProfileView.as_view(), name='profile'),
    path('password-reset', PasswordResetRequestView.as_view(), name='password-reset'),
    path('password-reset/confirm', PasswordResetConfirmView.as_view(), name='password-reset-confirm'),


    # Organization
    path('org', OrganizationDetailView.as_view(), name='org-detail'),
    path('org/members', OrganizationMembersView.as_view(), name='org-members'),
    path('org/members/<int:user_id>', MemberUpdateView.as_view(), name='org-member-update'),

    # Invites
    path('org/invite', InviteCreateView.as_view(), name='org-invite'),
    path('org/invites', InviteListView.as_view(), name='org-invites'),
    path('org/invites/<int:invite_id>/cancel', InviteCancelView.as_view(), name='org-invite-cancel'),
    path('org/join/<uuid:token>', JoinOrganizationView.as_view(), name='org-join'),

    # Activity Log
    path('activity', ActivityLogListView.as_view(), name='activity-log'),
]
