import api from './api';
import { User, LoginPayload, RegisterPayload } from '@/types';

interface AuthResponse {
    user: User;
    access: string;
    refresh: string;
}

export const authService = {
    async login(payload: LoginPayload): Promise<AuthResponse> {
        const { data } = await api.post<AuthResponse>('/auth/login', payload);
        return data;
    },

    async register(payload: RegisterPayload): Promise<AuthResponse> {
        const { data } = await api.post<AuthResponse>('/auth/register', payload);
        return data;
    },

    async refreshToken(refresh: string): Promise<{ access: string }> {
        const { data } = await api.post('/auth/refresh', { refresh });
        return data;
    },

    async logout(refreshToken: string): Promise<void> {
        await api.post('/auth/logout', { refresh: refreshToken });
    },

    async getProfile(): Promise<User> {
        const { data } = await api.get<User>('/auth/me');
        return data;
    },

    async updateProfile(payload: Partial<Pick<User, 'username' | 'email' | 'company'>> & { avatar?: File }): Promise<User> {
        if (payload.avatar) {
            const formData = new FormData();
            if (payload.username) formData.append('username', payload.username);
            if (payload.email) formData.append('email', payload.email);
            if (payload.company) formData.append('company', payload.company);
            formData.append('avatar', payload.avatar);
            const { data } = await api.patch<User>('/auth/me', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return data;
        }
        const { data } = await api.patch<User>('/auth/me', payload);
        return data;
    },
};
