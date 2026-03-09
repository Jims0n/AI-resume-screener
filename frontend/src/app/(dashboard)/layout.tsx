'use client';

import Sidebar from '@/components/layout/Sidebar';
import Navbar from '@/components/layout/Navbar';
import AuthGuard from '@/components/layout/AuthGuard';
import { useTheme } from '@/hooks/useTheme';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    // Initialize theme on mount (applies dark class to <html>)
    useTheme();

    return (
        <AuthGuard>
            <div className="min-h-screen bg-shortlyst-bg text-shortlyst-text transition-colors duration-200">
                <Sidebar />
                <div className="md:ml-64 transition-all duration-300">
                    <Navbar />
                    <main className="p-4 md:p-8 pb-24 md:pb-8">
                        {children}
                    </main>
                </div>
            </div>
        </AuthGuard>
    );
}
