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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await register(form);
        } catch {
            // Error handled in hook
        }
    };

    return (
        <div className="w-full max-w-md animate-fade-in">
            <div className="text-center mb-8">
                <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg mx-auto mb-4 shadow-lg shadow-indigo-200">
                    AI
                </div>
                <h1 className="text-2xl font-bold text-slate-900">Create an account</h1>
                <p className="text-slate-500 mt-1">Start screening resumes with AI</p>
            </div>

            <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 p-8">
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg border border-red-100">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Username</label>
                        <input
                            type="text"
                            value={form.username}
                            onChange={(e) => update('username', e.target.value)}
                            className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-sm"
                            placeholder="Choose a username"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                        <input
                            type="email"
                            value={form.email}
                            onChange={(e) => update('email', e.target.value)}
                            className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-sm"
                            placeholder="you@company.com"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Company</label>
                        <input
                            type="text"
                            value={form.company}
                            onChange={(e) => update('company', e.target.value)}
                            className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-sm"
                            placeholder="Your company name"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                        <input
                            type="password"
                            value={form.password}
                            onChange={(e) => update('password', e.target.value)}
                            className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-sm"
                            placeholder="Min. 8 characters"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm Password</label>
                        <input
                            type="password"
                            value={form.password_confirm}
                            onChange={(e) => update('password_confirm', e.target.value)}
                            className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-sm"
                            placeholder="Re-enter your password"
                            required
                        />
                    </div>

                    <Button type="submit" loading={loading} className="w-full" size="lg">
                        Create Account
                    </Button>
                </form>
            </div>

            <p className="text-center mt-6 text-sm text-slate-500">
                Already have an account?{' '}
                <Link href="/login" className="text-indigo-600 font-semibold hover:text-indigo-700">
                    Sign in
                </Link>
            </p>
        </div>
    );
}
