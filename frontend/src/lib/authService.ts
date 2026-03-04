import api from './api';
import { User, LoginPayload, RegisterPayload } from '@/types';

interface AuthResponse {
    user: User;
    access: string;
    refresh: string;
}

export const authService = {
    async login(payload: LoginPayload): Promise<AuthResponse> {
        const { data } = await api.post<AuthResponse>('/auth/login/', payload);
        return data;
    },

    async register(payload: RegisterPayload): Promise<AuthResponse> {
        const { data } = await api.post<AuthResponse>('/auth/register/', payload);
        return data;
    },

    async refreshToken(refresh: string): Promise<{ access: string }> {
        const { data } = await api.post('/auth/refresh/', { refresh });
        return data;
    },

    async getProfile(): Promise<User> {
        const { data } = await api.get<User>('/auth/me/');
        return data;
    },
};
