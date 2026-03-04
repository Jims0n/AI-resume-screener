import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const api = axios.create({
    baseURL: '/api',
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

// Response interceptor: handle 401 → refresh token
api.interceptors.response.use(
    (res) => res,
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            if (typeof window !== 'undefined') {
                const stored = localStorage.getItem('auth-storage');
                if (stored) {
                    try {
                        const parsed = JSON.parse(stored);
                        const refreshToken = parsed?.state?.refreshToken;

                        if (refreshToken) {
                            const res = await axios.post('/api/auth/refresh/', { refresh: refreshToken });
                            const newAccess = res.data.access;

                            // Update stored token
                            parsed.state.accessToken = newAccess;
                            localStorage.setItem('auth-storage', JSON.stringify(parsed));

                            originalRequest.headers.Authorization = `Bearer ${newAccess}`;
                            return api(originalRequest);
                        }
                    } catch {
                        // Refresh failed — logout
                        localStorage.removeItem('auth-storage');
                        window.location.href = '/login';
                    }
                }
            }
        }

        return Promise.reject(error);
    }
);

export default api;
