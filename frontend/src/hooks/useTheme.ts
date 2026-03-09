'use client';

import { useEffect } from 'react';
import { useThemeStore } from '@/store/themeStore';

export function useTheme() {
    const { theme, setTheme } = useThemeStore();

    useEffect(() => {
        const root = document.documentElement;

        const applyTheme = (isDark: boolean) => {
            if (isDark) {
                root.classList.add('dark');
            } else {
                root.classList.remove('dark');
            }
        };

        if (theme === 'system') {
            const mql = window.matchMedia('(prefers-color-scheme: dark)');
            applyTheme(mql.matches);

            const handler = (e: MediaQueryListEvent) => applyTheme(e.matches);
            mql.addEventListener('change', handler);
            return () => mql.removeEventListener('change', handler);
        } else {
            applyTheme(theme === 'dark');
        }
    }, [theme]);

    const isDark =
        theme === 'dark' ||
        (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    return { theme, setTheme, isDark };
}
