from rest_framework import permissions
from rest_framework.exceptions import PermissionDenied


class IsOrganizationMember(permissions.BasePermission):
    """Ensures user belongs to an organization."""

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.organization is not None
        )


class IsOrganizationAdmin(permissions.BasePermission):
    """Ensures user is an owner or admin of their organization."""

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.organization is not None
            and request.user.is_org_admin
        )


class IsOrganizationOwner(permissions.BasePermission):
    """Ensures user is the owner of their organization."""

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.organization is not None
            and request.user.role == 'owner'
        )


class CanManageCandidates(permissions.BasePermission):
    """Owner, admin, recruiter, or hiring_manager can manage candidates."""

    def has_permission(self, request, view):
        if not request.user.is_authenticated or not request.user.organization:
            return False
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.role in ('owner', 'admin', 'recruiter', 'hiring_manager')


def check_job_limit(organization):
    """Check if organization has reached its active job limit."""
    active_count = organization.jobs.filter(status='active').count()
    if active_count >= organization.max_jobs:
        raise PermissionDenied({
            'detail': f'Active job limit reached ({organization.max_jobs}). Please close existing jobs or upgrade your plan.',
            'upgrade_required': True,
            'limit': organization.max_jobs,
            'current_count': active_count,
        })


def check_resume_limit(job):
    """Check if job has reached its resume upload limit."""
    candidate_count = job.candidates.count()
    limit = job.organization.max_resumes_per_job
    if candidate_count >= limit:
        raise PermissionDenied({
            'detail': f'Resume upload limit reached ({limit}) for this job.',
            'upgrade_required': True,
            'limit': limit,
            'current_count': candidate_count,
        })


def check_user_limit(organization):
    """Check if organization has reached its user limit."""
    member_count = organization.members.count()
    if member_count >= organization.max_users:
        raise PermissionDenied({
            'detail': f'User limit reached ({organization.max_users}). Please upgrade your plan.',
            'upgrade_required': True,
            'limit': organization.max_users,
            'current_count': member_count,
        })
