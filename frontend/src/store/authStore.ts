'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';

interface AuthState {
    user: User | null;
    accessToken: string | null;
    refreshToken: string | null;
    hydrated: boolean;
    isAuthenticated: boolean;
    setAuth: (user: User, access: string, refresh: string) => void;
    logout: () => void;
    setHydrated: (v: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            accessToken: null,
            refreshToken: null,
            hydrated: false,
            get isAuthenticated() {
                return !!get().accessToken;
            },
            setAuth: (user, access, refresh) =>
                set({ user, accessToken: access, refreshToken: refresh }),
            logout: () =>
                set({ user: null, accessToken: null, refreshToken: null }),
            setHydrated: (v) => set({ hydrated: v }),
        }),
        {
            name: 'auth-storage',
            onRehydrateStorage: () => (state) => {
                state?.setHydrated(true);
            },
        }
    )
);
