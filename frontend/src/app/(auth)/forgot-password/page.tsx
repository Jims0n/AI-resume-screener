'use client';

import { useState } from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import api from '@/lib/api';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const inputClasses = "w-full px-4 py-3 rounded-xl border border-shortlyst-border bg-shortlyst-bg text-shortlyst-text focus:border-shortlyst-accent focus:ring-1 focus:ring-shortlyst-accent/20 outline-none transition-all text-sm placeholder:text-shortlyst-text/30";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await api.post('/auth/password-reset', { email });
            setSubmitted(true);
        } catch {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="w-full max-w-md animate-fade-in text-shortlyst-text">
                <div className="text-center mb-8">
                    <h1 className="font-serif text-4xl tracking-tight">Check your email</h1>
                    <p className="text-shortlyst-text/50 mt-2 font-light">
                        If an account exists for {email}, we&apos;ve sent a password reset link.
                    </p>
                </div>

                <div className="bg-shortlyst-bg rounded-3xl border border-shortlyst-border p-10 shadow-2xl text-center">
                    <p className="text-shortlyst-text/60 text-sm mb-6">
                        Didn&apos;t receive an email? Check your spam folder or try again.
                    </p>
                    <Button onClick={() => setSubmitted(false)} variant="secondary" className="w-full">
                        Try again
                    </Button>
                </div>

                <p className="text-center mt-6 text-sm text-shortlyst-text/60">
                    <Link href="/login" className="text-shortlyst-accent underline decoration-shortlyst-accent/30 hover:decoration-shortlyst-accent transition-colors">
                        Back to sign in
                    </Link>
                </p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-md animate-fade-in text-shortlyst-text">
            <div className="text-center mb-8">
                <h1 className="font-serif text-4xl tracking-tight">Reset password</h1>
                <p className="text-shortlyst-text/50 mt-2 font-light">
                    Enter your email and we&apos;ll send you a reset link.
                </p>
            </div>

            <div className="bg-shortlyst-bg rounded-3xl border border-shortlyst-border p-10 shadow-2xl">
                <form onSubmit={handleSubmit} className="space-y-5">
                    {error && (
                        <div className="bg-[#3a2020] text-[#c45c5c] text-sm p-3 rounded-lg border border-[#c45c5c]/20">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-shortlyst-text/80 mb-1.5">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className={inputClasses}
                            placeholder="you@company.com"
                            required
                        />
                    </div>

                    <Button type="submit" loading={loading} className="w-full" size="lg">
                        Send Reset Link
                    </Button>
                </form>
            </div>

            <p className="text-center mt-6 text-sm text-shortlyst-text/60">
                Remember your password?{' '}
                <Link href="/login" className="text-shortlyst-accent underline decoration-shortlyst-accent/30 hover:decoration-shortlyst-accent transition-colors">
                    Sign in
                </Link>
            </p>
        </div>
    );
}
