'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Spinner from '@/components/ui/Spinner';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [ready, setReady] = useState(false);
    const accessToken = useAuthStore((s) => s.accessToken);

    useEffect(() => {
        // Wait one tick for Zustand to rehydrate from localStorage
        const timer = setTimeout(() => {
            const token = useAuthStore.getState().accessToken;
            if (!token) {
                router.push('/login');
            } else {
                setReady(true);
            }
        }, 50);
        return () => clearTimeout(timer);
    }, [router]);

    // Also react if token changes after mount (e.g. logout)
    useEffect(() => {
        if (ready && !accessToken) {
            router.push('/login');
        }
    }, [ready, accessToken, router]);

    if (!ready) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <Spinner size="lg" />
            </div>
        );
    }

    return <>{children}</>;
}
