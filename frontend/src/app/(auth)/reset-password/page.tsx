'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import api from '@/lib/api';

function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const inputClasses = "w-full px-4 py-3 rounded-xl border border-shortlyst-border bg-shortlyst-bg text-shortlyst-text focus:border-shortlyst-accent focus:ring-1 focus:ring-shortlyst-accent/20 outline-none transition-all text-sm placeholder:text-shortlyst-text/30";

    if (!token) {
        return (
            <div className="w-full max-w-md animate-fade-in text-shortlyst-text text-center">
                <h1 className="font-serif text-4xl tracking-tight mb-4">Invalid link</h1>
                <p className="text-shortlyst-text/50 mb-6">This reset link is invalid or has expired.</p>
                <Link href="/forgot-password" className="text-shortlyst-accent underline decoration-shortlyst-accent/30 hover:decoration-shortlyst-accent transition-colors">
                    Request a new reset link
                </Link>
            </div>
        );
    }

    if (success) {
        return (
            <div className="w-full max-w-md animate-fade-in text-shortlyst-text text-center">
                <h1 className="font-serif text-4xl tracking-tight mb-4">Password reset</h1>
                <p className="text-shortlyst-text/50 mb-6">Your password has been updated successfully.</p>
                <Link href="/login">
                    <Button className="w-full" size="lg">Sign in</Button>
                </Link>
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (password.length < 8) {
            setError('Password must be at least 8 characters.');
            return;
        }
        if (password !== passwordConfirm) {
            setError('Passwords do not match.');
            return;
        }

        setLoading(true);
        try {
            await api.post('/auth/password-reset/confirm', { token, password });
            setSuccess(true);
        } catch (err: any) {
            const msg = err.response?.data?.detail || 'Failed to reset password. The link may have expired.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md animate-fade-in text-shortlyst-text">
            <div className="text-center mb-8">
                <h1 className="font-serif text-4xl tracking-tight">Set new password</h1>
                <p className="text-shortlyst-text/50 mt-2 font-light">Choose a strong password for your account.</p>
            </div>

            <div className="bg-shortlyst-bg rounded-3xl border border-shortlyst-border p-10 shadow-2xl">
                <form onSubmit={handleSubmit} className="space-y-5">
                    {error && (
                        <div className="bg-[#3a2020] text-[#c45c5c] text-sm p-3 rounded-lg border border-[#c45c5c]/20">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-shortlyst-text/80 mb-1.5">New Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={inputClasses}
                            placeholder="Min. 8 characters"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-shortlyst-text/80 mb-1.5">Confirm Password</label>
                        <input
                            type="password"
                            value={passwordConfirm}
                            onChange={(e) => setPasswordConfirm(e.target.value)}
                            className={inputClasses}
                            placeholder="Re-enter your password"
                            required
                        />
                    </div>

                    <Button type="submit" loading={loading} className="w-full" size="lg">
                        Reset Password
                    </Button>
                </form>
            </div>

            <p className="text-center mt-6 text-sm text-shortlyst-text/60">
                <Link href="/login" className="text-shortlyst-accent underline decoration-shortlyst-accent/30 hover:decoration-shortlyst-accent transition-colors">
                    Back to sign in
                </Link>
            </p>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense>
            <ResetPasswordForm />
        </Suspense>
    );
}
