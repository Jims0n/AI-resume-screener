'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/lib/authService';
import { useToast } from '@/components/ui/Toast';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

export default function ProfileSettingsPage() {
    const { user, setAuth } = useAuthStore();
    const { addToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        username: '',
        email: '',
        company: '',
    });

    useEffect(() => {
        if (user) {
            setForm({
                username: user.username || '',
                email: user.email || '',
                company: user.company || '',
            });
        }
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const updated = await authService.updateProfile(form);
            // Re-fetch to get full user data with org
            const fullUser = await authService.getProfile();
            const authState = useAuthStore.getState();
            setAuth(fullUser, authState.accessToken!, authState.refreshToken!);
            addToast('Profile updated successfully', 'success');
            void updated;
        } catch {
            addToast('Failed to update profile', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl">
            <Card>
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div>
                        <h2 className="font-serif tracking-tight text-xl text-sh-text mb-1">Profile Information</h2>
                        <p className="text-sm text-sh-text2 font-light">Update your personal details.</p>
                    </div>

                    {/* Avatar */}
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-sh-bg3 text-sh-text border border-sh-border rounded-full flex items-center justify-center font-serif text-2xl">
                            {user?.username?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div>
                            <p className="text-sm font-medium text-sh-text">{user?.username || 'User'}</p>
                            <p className="text-xs text-sh-text2 capitalize font-light">{user?.role?.replace('_', ' ') || 'Owner'}</p>
                        </div>
                    </div>

                    {/* Fields */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-sh-text2 mb-1">Username</label>
                            <input
                                type="text"
                                value={form.username}
                                onChange={(e) => setForm({ ...form, username: e.target.value })}
                                className="w-full px-3 py-2 rounded-lg border border-sh-border bg-[#1c1c1c] text-sh-text focus:outline-none focus:ring-1 focus:ring-sh-accent font-light placeholder-sh-muted"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-sh-text2 mb-1">Email</label>
                            <input
                                type="email"
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                className="w-full px-3 py-2 rounded-lg border border-sh-border bg-[#1c1c1c] text-sh-text focus:outline-none focus:ring-1 focus:ring-sh-accent font-light placeholder-sh-muted"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-sh-text2 mb-1">Company</label>
                            <input
                                type="text"
                                value={form.company}
                                onChange={(e) => setForm({ ...form, company: e.target.value })}
                                className="w-full px-3 py-2 rounded-lg border border-sh-border bg-[#1c1c1c] text-sh-text focus:outline-none focus:ring-1 focus:ring-sh-accent font-light placeholder-sh-muted"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <Button type="submit" loading={loading}>Save Changes</Button>
                    </div>
                </form>
            </Card>
        </div>
    );
}
