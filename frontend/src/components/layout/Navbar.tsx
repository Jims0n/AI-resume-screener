'use client';

import { useAuthStore } from '@/store/authStore';
import NotificationBell from './NotificationBell';
import ThemeToggle from '@/components/ui/ThemeToggle';

export default function Navbar() {
    const { user } = useAuthStore();

    return (
        <header className="sticky top-0 z-20 bg-shortlyst-bg/80 backdrop-blur-md border-b border-shortlyst-border">
            <div className="flex items-center justify-between h-16 px-6">
                <div>
                    <h2 className="font-serif text-xl tracking-tight text-shortlyst-text">
                        shortlyst.
                    </h2>
                </div>
                <div className="flex items-center gap-2">
                    <ThemeToggle />
                    <NotificationBell />
                    {user && (
                        <div className="flex items-center gap-2 ml-2">
                            <div className="w-8 h-8 bg-shortlyst-text/10 text-shortlyst-text rounded-full flex items-center justify-center text-sm font-bold font-serif">
                                {user.username.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm font-medium text-shortlyst-text/80 hidden sm:block">
                                {user.username}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
