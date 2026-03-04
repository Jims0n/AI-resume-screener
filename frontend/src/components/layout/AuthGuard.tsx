'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Spinner from '@/components/ui/Spinner';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const { accessToken, hydrated } = useAuthStore();

    useEffect(() => {
        if (hydrated && !accessToken) {
            router.push('/login');
        }
    }, [hydrated, accessToken, router]);

    if (!hydrated) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <Spinner size="lg" />
            </div>
        );
    }

    if (!accessToken) return null;

    return <>{children}</>;
}
