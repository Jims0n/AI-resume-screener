import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
    headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: attach auth token
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('auth-storage');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                const token = parsed?.state?.accessToken;
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
            } catch { /* ignore */ }
        }
    }
    return config;
});

// Mutex for token refresh — prevents race conditions when multiple
// requests get 401 simultaneously
let refreshPromise: Promise<string | null> | null = null;

async function doRefresh(): Promise<string | null> {
    const stored = localStorage.getItem('auth-storage');
    if (!stored) return null;

    try {
        const parsed = JSON.parse(stored);
        const refreshToken = parsed?.state?.refreshToken;
        if (!refreshToken) return null;

        const res = await axios.post(
            `${process.env.NEXT_PUBLIC_API_URL || '/api'}/auth/refresh/`,
            { refresh: refreshToken }
        );
        const newAccess = res.data.access;
        const newRefresh = res.data.refresh;

        // Update stored tokens
        parsed.state.accessToken = newAccess;
        if (newRefresh) {
            parsed.state.refreshToken = newRefresh;
        }
        localStorage.setItem('auth-storage', JSON.stringify(parsed));

        return newAccess;
    } catch {
        // Refresh failed — clear auth and redirect
        localStorage.removeItem('auth-storage');
        window.location.href = '/login';
        return null;
    }
}

// Response interceptor: handle 401 → refresh token
api.interceptors.response.use(
    (res) => res,
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            if (typeof window !== 'undefined') {
                // Use mutex to ensure only one refresh at a time
                if (!refreshPromise) {
                    refreshPromise = doRefresh().finally(() => {
                        refreshPromise = null;
                    });
                }

                const newAccess = await refreshPromise;
                if (newAccess) {
                    originalRequest.headers.Authorization = `Bearer ${newAccess}`;
                    return api(originalRequest);
                }
            }
        }

        return Promise.reject(error);
    }
);

export default api;
