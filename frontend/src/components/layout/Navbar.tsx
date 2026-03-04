'use client';

import { useAuthStore } from '@/store/authStore';

export default function Navbar() {
    const { user } = useAuthStore();

    return (
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200">
            <div className="flex items-center justify-between h-16 px-6">
                <div>
                    <h2 className="text-lg font-semibold text-slate-900">AI Resume Screener</h2>
                </div>
                <div className="flex items-center gap-4">
                    {user && (
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm font-bold">
                                {user.username.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm font-medium text-slate-700 hidden sm:block">
                                {user.username}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
