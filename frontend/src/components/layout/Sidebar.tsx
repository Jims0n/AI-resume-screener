'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { LayoutDashboard, PlusCircle, Settings, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';

export default function Sidebar() {
    const [collapsed, setCollapsed] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const { user, logout } = useAuthStore();

    const links = [
        { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
        { href: '/jobs/new', label: 'Create Job', icon: <PlusCircle className="w-5 h-5" /> },
        { href: '/settings/profile', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
    ];

    const mobileLinks = [
        { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
        { href: '/jobs/new', label: 'Create', icon: <PlusCircle className="w-5 h-5" /> },
        { href: '/settings/profile', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
    ];

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    const isLinkActive = (href: string) => {
        if (href === '/settings/profile') return pathname.startsWith('/settings');
        return pathname.startsWith(href);
    };

    return (
        <>
            {/* Mobile bottom tab bar */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex justify-around py-2 px-4">
                {mobileLinks.map((link) => (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-xs transition-colors ${isLinkActive(link.href) ? 'text-shortlyst-text bg-shortlyst-text/10' : 'text-shortlyst-text/50 hover:text-shortlyst-text'
                            }`}

                    >
                        <span className="mb-0.5">{link.icon}</span>
                        <span>{link.label}</span>
                    </Link>
                ))}
                <button onClick={handleLogout} className="flex flex-col items-center gap-0.5 px-3 py-1.5 text-[#c45c5c] text-xs transition-colors hover:opacity-80">
                    <span className="mb-0.5"><LogOut className="w-5 h-5" /></span>
                    <span>Logout</span>
                </button>
            </nav>

            {/* Desktop sidebar */}
            <aside
                className={`hidden md:flex flex-col fixed left-0 top-0 h-full bg-sh-sidebar border-r border-sh-border text-sh-text transition-all duration-300 z-30 ${collapsed ? 'w-16' : 'w-64'
                    }`}
            >
                {/* Logo */}
                <div className="flex items-center gap-3 px-6 py-8 border-b border-sh-border">
                    <span className={`font-serif text-xl tracking-tight text-sh-text transition-opacity duration-300 ${collapsed ? 'opacity-0 hidden' : 'opacity-100'}`}>
                        shortlyst.
                    </span>
                    {collapsed && (
                        <span className="font-serif text-xl tracking-tight text-sh-text mx-auto">
                            s.
                        </span>
                    )}
                </div>

                {/* Nav links */}
                <nav className="flex-1 py-4 px-2 space-y-1">
                    {links.map((link) => {
                        const active = isLinkActive(link.href);
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${active
                                    ? 'bg-sh-text/10 text-sh-text font-medium'
                                    : 'text-sh-text2 hover:bg-sh-text/5 hover:text-sh-text font-light'
                                    }`}
                            >
                                <span className={`flex-shrink-0 ${collapsed ? 'mx-auto' : ''}`}>{link.icon}</span>
                                {!collapsed && <span className="text-sm font-medium">{link.label}</span>}
                            </Link>
                        );
                    })}
                </nav>

                {/* User section */}
                <div className="border-t border-sh-border px-3 py-4">
                    {!collapsed && user && (
                        <div className="mb-3 px-2">
                            <p className="text-sm font-semibold truncate text-sh-text">{user.username}</p>
                            <p className="text-xs text-sh-text2 truncate">{user.company || user.email}</p>
                        </div>
                    )}
                    <button
                        onClick={handleLogout}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[#c45c5c] hover:bg-[#c45c5c]/10 transition-colors text-sm font-light ${collapsed ? 'justify-center' : ''}`}
                    >
                        <span><LogOut className="w-5 h-5" /></span>
                        {!collapsed && <span>Logout</span>}
                    </button>
                </div>

                {/* Collapse toggle */}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="flex justify-center border-t border-sh-border/50 py-3 text-sh-text2 hover:text-sh-text transition-colors text-sm"
                >
                    {collapsed ? <ChevronRight className="w-5 h-5" /> : <span className="flex items-center gap-1"><ChevronLeft className="w-4 h-4" /> Collapse</span>}
                </button>
            </aside>
        </>
    );
}
