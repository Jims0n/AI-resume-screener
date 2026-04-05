'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/ui/Button';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login, loading, error } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await login({ email, password });
        } catch {
            // Error is handled in the hook
        }
    };

    const inputClasses = "w-full px-4 py-3 rounded-xl border border-shortlyst-border bg-shortlyst-bg text-shortlyst-text focus:border-shortlyst-accent focus:ring-1 focus:ring-shortlyst-accent/20 outline-none transition-all text-sm placeholder:text-shortlyst-text/30";

    return (
        <div className="w-full max-w-md animate-fade-in text-shortlyst-text">
            <div className="text-center mb-8">
                <p className="font-serif text-2xl tracking-tight text-shortlyst-text/40 mb-6">shortlyst.</p>
                <h1 className="font-serif text-4xl tracking-tight">Welcome back</h1>
                <p className="text-shortlyst-text/50 mt-2 font-light">Sign in to shortlyst.</p>
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

                    <div>
                        <label className="block text-sm font-medium text-shortlyst-text/80 mb-1.5">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={inputClasses}
                            placeholder="Enter your password"
                            required
                        />
                    </div>

                    <Button type="submit" loading={loading} className="w-full" size="lg">
                        Sign In
                    </Button>

                    <div className="text-center">
                        <Link href="/forgot-password" className="text-sm text-shortlyst-text/50 hover:text-shortlyst-accent transition-colors">
                            Forgot your password?
                        </Link>
                    </div>
                </form>
            </div>

            <p className="text-center mt-6 text-sm text-shortlyst-text/60">
                Don&apos;t have an account?{' '}
                <Link href="/register" className="text-shortlyst-accent underline decoration-shortlyst-accent/30 hover:decoration-shortlyst-accent transition-colors">
                    Create one
                </Link>
            </p>

        </div>
    );
}
