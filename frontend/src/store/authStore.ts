'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';

interface AuthState {
    user: User | null;
    accessToken: string | null;
    refreshToken: string | null;
    setAuth: (user: User, access: string, refresh: string) => void;
    logout: () => void;
}

// Sync a lightweight auth cookie so Next.js middleware can check auth state
function syncAuthCookie(state: { accessToken: string | null }) {
    if (typeof document === 'undefined') return;
    if (state.accessToken) {
        document.cookie = `auth-storage=${encodeURIComponent(JSON.stringify({ state: { accessToken: state.accessToken } }))};path=/;max-age=${60 * 60 * 24 * 7};SameSite=Lax`;
    } else {
        document.cookie = 'auth-storage=;path=/;max-age=0';
    }
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            accessToken: null,
            refreshToken: null,
            setAuth: (user, access, refresh) => {
                syncAuthCookie({ accessToken: access });
                set({ user, accessToken: access, refreshToken: refresh });
            },
            logout: () => {
                syncAuthCookie({ accessToken: null });
                set({ user: null, accessToken: null, refreshToken: null });
            },
        }),
        {
            name: 'auth-storage',
        }
    )
);
