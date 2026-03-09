'use client';

import { useState, useEffect, useCallback } from 'react';
import organizationService from '@/lib/organizationService';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/components/ui/Toast';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Skeleton from '@/components/ui/Skeleton';
import type { OrganizationMember, OrganizationInvite, UserRole } from '@/types';

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
    { value: 'admin', label: 'Admin' },
    { value: 'recruiter', label: 'Recruiter' },
    { value: 'hiring_manager', label: 'Hiring Manager' },
    { value: 'viewer', label: 'Viewer' },
];

const roleBadgeVariant = (role: string) => {
    const map: Record<string, 'success' | 'info' | 'warning' | 'neutral'> = {
        owner: 'success',
        admin: 'info',
        recruiter: 'warning',
        hiring_manager: 'neutral',
        viewer: 'neutral',
    };
    return map[role] || 'neutral';
};

export default function TeamSettingsPage() {
    const { user } = useAuthStore();
    const { addToast } = useToast();
    const [members, setMembers] = useState<OrganizationMember[]>([]);
    const [invites, setInvites] = useState<OrganizationInvite[]>([]);
    const [loading, setLoading] = useState(true);

    // Invite form
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState<string>('recruiter');
    const [inviting, setInviting] = useState(false);

    const isAdmin = user?.role === 'owner' || user?.role === 'admin';

    const loadData = useCallback(async () => {
        try {
            const [membersData, invitesData] = await Promise.all([
                organizationService.getMembers(),
                isAdmin ? organizationService.getInvites() : Promise.resolve([]),
            ]);
            setMembers(membersData);
            setInvites(invitesData);
        } catch {
            addToast('Failed to load team data', 'error');
        } finally {
            setLoading(false);
        }
    }, [isAdmin, addToast]);

    useEffect(() => { loadData(); }, [loadData]);

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteEmail.trim()) return;
        setInviting(true);
        try {
            await organizationService.createInvite(inviteEmail, inviteRole);
            setInviteEmail('');
            addToast('Invitation sent successfully', 'success');
            loadData();
        } catch {
            addToast('Failed to send invitation', 'error');
        } finally {
            setInviting(false);
        }
    };

    const handleRoleChange = async (memberId: number, newRole: string) => {
        try {
            await organizationService.updateMember(memberId, newRole);
            setMembers((prev) =>
                prev.map((m) => (m.id === memberId ? { ...m, role: newRole as UserRole } : m))
            );
            addToast('Role updated', 'success');
        } catch {
            addToast('Failed to update role', 'error');
        }
    };

    const handleRemoveMember = async (memberId: number) => {
        if (!confirm('Are you sure you want to remove this member?')) return;
        try {
            await organizationService.removeMember(memberId);
            setMembers((prev) => prev.filter((m) => m.id !== memberId));
            addToast('Member removed', 'success');
        } catch {
            addToast('Failed to remove member', 'error');
        }
    };

    const handleCancelInvite = async (inviteId: number) => {
        try {
            await organizationService.cancelInvite(inviteId);
            setInvites((prev) => prev.filter((i) => i.id !== inviteId));
            addToast('Invitation cancelled', 'success');
        } catch {
            addToast('Failed to cancel invitation', 'error');
        }
    };

    if (loading) {
        return (
            <div className="space-y-4">
                <Skeleton height={100} />
                <Skeleton height={200} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Invite Form */}
            {isAdmin && (
                <Card>
                    <form onSubmit={handleInvite} className="p-6">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Invite Team Member</h2>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <input
                                type="email"
                                placeholder="Email address"
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                                required
                                className="flex-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <select
                                value={inviteRole}
                                onChange={(e) => setInviteRole(e.target.value)}
                                className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                {ROLE_OPTIONS.map((r) => (
                                    <option key={r.value} value={r.value}>{r.label}</option>
                                ))}
                            </select>
                            <Button type="submit" loading={inviting}>Send Invite</Button>
                        </div>
                    </form>
                </Card>
            )}

            {/* Pending Invites */}
            {invites.length > 0 && (
                <Card header={<div className="px-6 py-4"><h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Pending Invitations</h3></div>}>
                    <div className="divide-y divide-slate-200 dark:divide-slate-700">
                        {invites.filter(i => i.status === 'pending').map((invite) => (
                            <div key={invite.id} className="flex items-center justify-between px-6 py-3">
                                <div>
                                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{invite.email}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Role: {invite.role.replace('_', ' ')}</p>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => handleCancelInvite(invite.id)}>Cancel</Button>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {/* Members List */}
            <Card header={<div className="px-6 py-4"><h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Team Members ({members.length})</h3></div>}>
                <div className="divide-y divide-slate-200 dark:divide-slate-700">
                    {members.map((member) => (
                        <div key={member.id} className="flex items-center justify-between px-6 py-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center text-sm font-bold">
                                    {member.username.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                        {member.username}
                                        {member.id === user?.id && <span className="text-slate-400 ml-1">(you)</span>}
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{member.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {isAdmin && member.role !== 'owner' && member.id !== user?.id ? (
                                    <>
                                        <select
                                            value={member.role}
                                            onChange={(e) => handleRoleChange(member.id, e.target.value)}
                                            className="text-sm px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                                        >
                                            {ROLE_OPTIONS.map((r) => (
                                                <option key={r.value} value={r.value}>{r.label}</option>
                                            ))}
                                        </select>
                                        <Button variant="danger" size="sm" onClick={() => handleRemoveMember(member.id)}>Remove</Button>
                                    </>
                                ) : (
                                    <Badge variant={roleBadgeVariant(member.role)}>
                                        {member.role.replace('_', ' ')}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
}
