'use client';

export const runtime = 'edge';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { useAuthStore } from '@/store/authStore';
import Button from '@/components/ui/Button';

interface InviteDetails {
    organization_name: string;
    email: string;
    role: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

export default function JoinPage() {
    const { token } = useParams<{ token: string }>();
    const router = useRouter();
    const { setAuth, user } = useAuthStore();

    const [invite, setInvite] = useState<InviteDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pageError, setPageError] = useState<string | null>(null);

    const [form, setForm] = useState({
        username: '',
        password: '',
        password_confirm: '',
    });

    const update = (field: string, value: string) =>
        setForm((prev) => ({ ...prev, [field]: value }));

    // Fetch invite details
    useEffect(() => {
        async function fetchInvite() {
            try {
                const res = await axios.get(`${API_URL}/auth/org/join/${token}`);
                setInvite(res.data);
            } catch (err: any) {
                const msg =
                    err.response?.data?.detail ||
                    'This invite link is invalid or has expired.';
                setPageError(msg);
            } finally {
                setLoading(false);
            }
        }
        if (token) fetchInvite();
    }, [token]);

    // Check if the logged-in user's email matches the invite
    const isExistingUser = user && invite && user.email?.toLowerCase() === invite.email.toLowerCase();

    const handleJoinExisting = async () => {
        setSubmitting(true);
        setError(null);
        try {
            const stored = localStorage.getItem('auth-storage');
            const parsed = stored ? JSON.parse(stored) : null;
            const accessToken = parsed?.state?.accessToken;

            const res = await axios.post(
                `${API_URL}/auth/org/join/${token}`,
                {},
                { headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {} }
            );
            setAuth(res.data.user, res.data.access, res.data.refresh);
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to join organization.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleJoinNew = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (form.password.length < 8) {
            setError('Password must be at least 8 characters.');
            return;
        }
        if (form.password !== form.password_confirm) {
            setError('Passwords do not match.');
            return;
        }

        setSubmitting(true);
        try {
            const res = await axios.post(`${API_URL}/auth/org/join/${token}`, {
                username: form.username,
                password: form.password,
            });
            setAuth(res.data.user, res.data.access, res.data.refresh);
            router.push('/dashboard');
        } catch (err: any) {
            const d = err.response?.data;
            const msg =
                d?.detail ||
                d?.username?.[0] ||
                d?.password?.[0] ||
                'Failed to create account.';
            setError(msg);
        } finally {
            setSubmitting(false);
        }
    };

    const inputClasses =
        'w-full px-4 py-3 rounded-xl border border-shortlyst-border bg-shortlyst-bg text-shortlyst-text focus:border-shortlyst-accent focus:ring-1 focus:ring-shortlyst-accent/20 outline-none transition-all text-sm placeholder:text-shortlyst-text/30';

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-shortlyst-bg flex items-center justify-center p-4">
                <div className="w-full max-w-md text-center">
                    <div className="w-8 h-8 border-2 border-shortlyst-accent/30 border-t-shortlyst-accent rounded-full animate-spin mx-auto" />
                    <p className="text-shortlyst-text/50 mt-4 text-sm">Loading invite...</p>
                </div>
            </div>
        );
    }

    // Invalid/expired invite
    if (pageError) {
        return (
            <div className="min-h-screen bg-shortlyst-bg flex items-center justify-center p-4">
                <div className="w-full max-w-md animate-fade-in text-shortlyst-text text-center">
                    <div className="text-5xl mb-4">😕</div>
                    <h1 className="font-serif text-3xl tracking-tight mb-2">
                        Invite not found
                    </h1>
                    <p className="text-shortlyst-text/50 mb-8 font-light">{pageError}</p>
                    <Link
                        href="/login"
                        className="text-shortlyst-accent underline decoration-shortlyst-accent/30 hover:decoration-shortlyst-accent transition-colors"
                    >
                        Go to login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-shortlyst-bg flex items-center justify-center p-4">
            <div className="w-full max-w-md animate-fade-in text-shortlyst-text">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="font-serif text-4xl tracking-tight">
                        Join {invite?.organization_name}
                    </h1>
                    <p className="text-shortlyst-text/50 mt-2 font-light">
                        You&apos;ve been invited as{' '}
                        <span className="text-shortlyst-accent font-medium">
                            {invite?.role}
                        </span>
                    </p>
                </div>

                <div className="bg-shortlyst-bg rounded-3xl border border-shortlyst-border p-10 shadow-2xl">
                    {/* Invite info */}
                    <div className="mb-6 p-4 rounded-xl bg-[#242424] border border-shortlyst-border">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-shortlyst-accent/10 flex items-center justify-center text-shortlyst-accent font-semibold text-lg">
                                {invite?.organization_name?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <p className="font-medium text-sm">{invite?.organization_name}</p>
                                <p className="text-shortlyst-text/40 text-xs">{invite?.email}</p>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-[#3a2020] text-[#c45c5c] text-sm p-3 rounded-lg border border-[#c45c5c]/20 mb-4">
                            {error}
                        </div>
                    )}

                    {isExistingUser ? (
                        /* Existing user — just join */
                        <div className="space-y-4">
                            <p className="text-sm text-shortlyst-text/60">
                                You&apos;re signed in as{' '}
                                <span className="text-shortlyst-text font-medium">
                                    {user?.username}
                                </span>
                                . Click below to join.
                            </p>
                            <Button
                                onClick={handleJoinExisting}
                                loading={submitting}
                                className="w-full"
                                size="lg"
                            >
                                Join {invite?.organization_name}
                            </Button>
                        </div>
                    ) : (
                        /* New user — registration form */
                        <form onSubmit={handleJoinNew} className="space-y-4">
                            <p className="text-sm text-shortlyst-text/60 mb-2">
                                Create an account to join the team.
                            </p>

                            <div>
                                <label className="block text-sm font-medium text-shortlyst-text/80 mb-1.5">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={invite?.email || ''}
                                    disabled
                                    className={`${inputClasses} opacity-50 cursor-not-allowed`}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-shortlyst-text/80 mb-1.5">
                                    Username
                                </label>
                                <input
                                    type="text"
                                    value={form.username}
                                    onChange={(e) => update('username', e.target.value)}
                                    className={inputClasses}
                                    placeholder="Choose a username"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-shortlyst-text/80 mb-1.5">
                                    Password
                                </label>
                                <input
                                    type="password"
                                    value={form.password}
                                    onChange={(e) => update('password', e.target.value)}
                                    className={inputClasses}
                                    placeholder="Min. 8 characters"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-shortlyst-text/80 mb-1.5">
                                    Confirm Password
                                </label>
                                <input
                                    type="password"
                                    value={form.password_confirm}
                                    onChange={(e) => update('password_confirm', e.target.value)}
                                    className={inputClasses}
                                    placeholder="Re-enter your password"
                                    required
                                />
                            </div>

                            <Button
                                type="submit"
                                loading={submitting}
                                className="w-full"
                                size="lg"
                            >
                                Create Account & Join
                            </Button>
                        </form>
                    )}
                </div>

                <p className="text-center mt-6 text-sm text-shortlyst-text/60">
                    Already have an account?{' '}
                    <Link
                        href="/login"
                        className="text-shortlyst-accent underline decoration-shortlyst-accent/30 hover:decoration-shortlyst-accent transition-colors"
                    >
                        Sign in first
                    </Link>
                    , then revisit this link.
                </p>
            </div>
        </div>
    );
}
