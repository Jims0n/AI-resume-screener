'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/ui/Button';

export default function RegisterPage() {
    const [form, setForm] = useState({
        username: '',
        email: '',
        password: '',
        password_confirm: '',
        company: '',
    });
    const { register, loading, error } = useAuth();

    const update = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

    const [validationError, setValidationError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setValidationError(null);

        if (form.password.length < 8) {
            setValidationError('Password must be at least 8 characters.');
            return;
        }
        if (form.password !== form.password_confirm) {
            setValidationError('Passwords do not match.');
            return;
        }

        try {
            await register(form);
        } catch {
            // Error handled in hook
        }
    };

    const inputClasses = "w-full px-4 py-3 rounded-xl border border-shortlyst-border bg-shortlyst-bg text-shortlyst-text focus:border-shortlyst-accent focus:ring-1 focus:ring-shortlyst-accent/20 outline-none transition-all text-sm placeholder:text-shortlyst-text/30";

    return (
        <div className="w-full max-w-md animate-fade-in text-shortlyst-text">
            <div className="text-center mb-8">
                <p className="font-serif text-2xl tracking-tight text-shortlyst-text/40 mb-6">shortlyst.</p>
                <h1 className="font-serif text-4xl tracking-tight">Create an account</h1>
                <p className="text-shortlyst-text/50 mt-2 font-light">Join the future of talent discovery.</p>
            </div>

            <div className="bg-shortlyst-bg rounded-3xl border border-shortlyst-border p-10 shadow-2xl">
                <form onSubmit={handleSubmit} className="space-y-4">
                    {(error || validationError) && (
                        <div className="bg-[#3a2020] text-[#c45c5c] text-sm p-3 rounded-lg border border-[#c45c5c]/20">
                            {validationError || error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-shortlyst-text/80 mb-1.5">Username</label>
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
                        <label className="block text-sm font-medium text-shortlyst-text/80 mb-1.5">Email</label>
                        <input
                            type="email"
                            value={form.email}
                            onChange={(e) => update('email', e.target.value)}
                            className={inputClasses}
                            placeholder="you@company.com"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-shortlyst-text/80 mb-1.5">Company</label>
                        <input
                            type="text"
                            value={form.company}
                            onChange={(e) => update('company', e.target.value)}
                            className={inputClasses}
                            placeholder="Your company name"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-shortlyst-text/80 mb-1.5">Password</label>
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
                        <label className="block text-sm font-medium text-shortlyst-text/80 mb-1.5">Confirm Password</label>
                        <input
                            type="password"
                            value={form.password_confirm}
                            onChange={(e) => update('password_confirm', e.target.value)}
                            className={inputClasses}
                            placeholder="Re-enter your password"
                            required
                        />
                    </div>

                    <Button type="submit" loading={loading} className="w-full" size="lg">
                        Create Account
                    </Button>
                </form>
            </div>

            <p className="text-center mt-6 text-sm text-shortlyst-text/60">
                Already have an account?{' '}
                <Link href="/login" className="text-shortlyst-accent underline decoration-shortlyst-accent/30 hover:decoration-shortlyst-accent transition-colors">
                    Sign in
                </Link>
            </p>

        </div>
    );
}
