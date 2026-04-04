'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/lib/authService';
import { extractApiError } from '@/lib/apiErrors';
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
        } catch (err: unknown) {
            setError(extractApiError(err, 'Login failed'));
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
        } catch (err: unknown) {
            setError(extractApiError(err, 'Registration failed'));
            throw err;
        } finally {
            setLoading(false);
        }
    }, [setAuth, router]);

    const logout = useCallback(async () => {
        const refreshToken = useAuthStore.getState().refreshToken;
        try {
            if (refreshToken) {
                await authService.logout(refreshToken);
            }
        } catch {
            // Proceed with local logout even if server call fails
        }
        clearAuth();
        window.location.href = '/login';
    }, [clearAuth]);

    return { login, register, logout, loading, error };
}
