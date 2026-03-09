'use client';

import { useState, useEffect } from 'react';
import organizationService from '@/lib/organizationService';
import { useToast } from '@/components/ui/Toast';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Skeleton from '@/components/ui/Skeleton';
import type { Organization } from '@/types';

export default function OrganizationSettingsPage() {
    const { addToast } = useToast();
    const [org, setOrg] = useState<Organization | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [name, setName] = useState('');

    useEffect(() => {
        const load = async () => {
            try {
                const data = await organizationService.getOrganization();
                setOrg(data);
                setName(data.name);
            } catch {
                addToast('Failed to load organization', 'error');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [addToast]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const updated = await organizationService.updateOrganization({ name });
            setOrg(updated);
            addToast('Organization updated successfully', 'success');
        } catch {
            addToast('Failed to update organization', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="max-w-2xl space-y-4">
                <Skeleton height={200} />
                <Skeleton height={150} />
            </div>
        );
    }

    return (
        <div className="max-w-2xl space-y-6">
            <Card>
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">Organization Details</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Manage your organization settings.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Organization Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    {org && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Slug</label>
                            <p className="text-sm text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 px-3 py-2 rounded-lg">{org.slug}</p>
                        </div>
                    )}

                    <div className="flex justify-end pt-2">
                        <Button type="submit" loading={saving}>Save Changes</Button>
                    </div>
                </form>
            </Card>

            {/* Plan Limits */}
            {org && (
                <Card header={<div className="px-6 py-4"><h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Current Plan Limits</h3></div>}>
                    <div className="px-6 pb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 text-center">
                            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{org.active_job_count}/{org.max_jobs}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Active Jobs</p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 text-center">
                            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{org.max_resumes_per_job}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Resumes/Job</p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 text-center">
                            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{org.member_count}/{org.max_users}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Team Members</p>
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );
}
