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

    const inputClasses = "w-full px-3 py-2 rounded-lg border border-[#2a2a2a] bg-[#1c1c1c] text-[#e8e4d9] focus:outline-none focus:ring-1 focus:ring-[#e8e4d9]/30 font-light placeholder-[#6b6560]";

    return (
        <div className="max-w-2xl space-y-6">
            <Card>
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div>
                        <h2 className="font-serif tracking-tight text-xl text-[#e8e4d9] mb-1">Organization Details</h2>
                        <p className="text-sm text-[#8a8578] font-light">Manage your organization settings.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[#8a8578] mb-1">Organization Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className={inputClasses}
                        />
                    </div>

                    {org && (
                        <div>
                            <label className="block text-sm font-medium text-[#8a8578] mb-1">Slug</label>
                            <p className="text-sm text-[#8a8578] bg-[#1a1a1a] px-3 py-2 rounded-lg border border-[#2a2a2a]">{org.slug}</p>
                        </div>
                    )}

                    <div className="flex justify-end pt-2">
                        <Button type="submit" loading={saving}>Save Changes</Button>
                    </div>
                </form>
            </Card>

            {/* Plan Limits */}
            {org && (
                <Card header={<h3 className="font-serif text-lg text-[#e8e4d9]">Current Plan Limits</h3>}>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-[#1a1a1a] rounded-lg p-4 text-center border border-[#2a2a2a]">
                            <p className="text-2xl font-serif text-[#e8e4d9]">{org.active_job_count}/{org.max_jobs}</p>
                            <p className="text-xs text-[#8a8578] mt-1">Active Jobs</p>
                        </div>
                        <div className="bg-[#1a1a1a] rounded-lg p-4 text-center border border-[#2a2a2a]">
                            <p className="text-2xl font-serif text-[#e8e4d9]">{org.max_resumes_per_job}</p>
                            <p className="text-xs text-[#8a8578] mt-1">Resumes/Job</p>
                        </div>
                        <div className="bg-[#1a1a1a] rounded-lg p-4 text-center border border-[#2a2a2a]">
                            <p className="text-2xl font-serif text-[#e8e4d9]">{org.member_count}/{org.max_users}</p>
                            <p className="text-xs text-[#8a8578] mt-1">Team Members</p>
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );
}
