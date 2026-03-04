'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

export default function Sidebar() {
    const [collapsed, setCollapsed] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const { user, logout } = useAuthStore();

    const links = [
        { href: '/dashboard', label: 'Dashboard', icon: '📊' },
        { href: '/jobs/new', label: 'Create Job', icon: '➕' },
    ];

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    return (
        <>
            {/* Mobile bottom tab bar */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 flex justify-around py-2 px-4">
                {links.map((link) => (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-xs transition-colors ${pathname.startsWith(link.href) ? 'text-indigo-600 bg-indigo-50' : 'text-slate-500'
                            }`}
                    >
                        <span className="text-lg">{link.icon}</span>
                        <span>{link.label}</span>
                    </Link>
                ))}
                <button onClick={handleLogout} className="flex flex-col items-center gap-0.5 px-3 py-1.5 text-slate-500 text-xs">
                    <span className="text-lg">🚪</span>
                    <span>Logout</span>
                </button>
            </nav>

            {/* Desktop sidebar */}
            <aside
                className={`hidden md:flex flex-col fixed left-0 top-0 h-full bg-slate-900 text-white transition-all duration-300 z-30 ${collapsed ? 'w-16' : 'w-64'
                    }`}
            >
                {/* Logo */}
                <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-700/50">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0">
                        AI
                    </div>
                    {!collapsed && (
                        <span className="font-bold text-base tracking-tight">ResumeScreener</span>
                    )}
                </div>

                {/* Nav links */}
                <nav className="flex-1 py-4 px-2 space-y-1">
                    {links.map((link) => {
                        const isActive = pathname.startsWith(link.href);
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${isActive
                                        ? 'bg-indigo-600 text-white shadow-md'
                                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                    }`}
                            >
                                <span className="text-lg flex-shrink-0">{link.icon}</span>
                                {!collapsed && <span className="text-sm font-medium">{link.label}</span>}
                            </Link>
                        );
                    })}
                </nav>

                {/* User section */}
                <div className="border-t border-slate-700/50 px-3 py-4">
                    {!collapsed && user && (
                        <div className="mb-3 px-2">
                            <p className="text-sm font-semibold truncate">{user.username}</p>
                            <p className="text-xs text-slate-400 truncate">{user.company || user.email}</p>
                        </div>
                    )}
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors text-sm"
                    >
                        <span>🚪</span>
                        {!collapsed && <span>Logout</span>}
                    </button>
                </div>

                {/* Collapse toggle */}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="border-t border-slate-700/50 py-3 text-slate-400 hover:text-white transition-colors text-sm"
                >
                    {collapsed ? '→' : '← Collapse'}
                </button>
            </aside>
        </>
    );
}
