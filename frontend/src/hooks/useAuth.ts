'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/lib/authService';
import { LoginPayload, RegisterPayload } from '@/types';

export function useAuth() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const { setAuth, logout: clearAuth } = useAuthStore();

    const login = useCallback(async (payload: LoginPayload) => {
        setLoading(true);
        setError(null);
        try {
            const data = await authService.login(payload);
            setAuth(data.user, data.access, data.refresh);
            router.push('/dashboard');
        } catch (err: any) {
            const msg = err.response?.data?.detail || 'Login failed';
            setError(msg);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [setAuth, router]);

    const register = useCallback(async (payload: RegisterPayload) => {
        setLoading(true);
        setError(null);
        try {
            const data = await authService.register(payload);
            setAuth(data.user, data.access, data.refresh);
            router.push('/dashboard');
        } catch (err: any) {
            const msg = err.response?.data?.detail
                || err.response?.data?.username?.[0]
                || err.response?.data?.password?.[0]
                || 'Registration failed';
            setError(msg);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [setAuth, router]);

    const logout = useCallback(() => {
        clearAuth();
        window.location.href = '/login';
    }, [clearAuth]);

    return { login, register, logout, loading, error };
}
