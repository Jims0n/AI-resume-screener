import api from './api';
import type { Notification, PaginatedResponse } from '@/types';

const notificationService = {
    getNotifications: async (params?: { page?: number }): Promise<PaginatedResponse<Notification>> => {
        const { data } = await api.get('/notifications', { params });
        return data;
    },

    markRead: async (notificationId: number): Promise<void> => {
        await api.patch(`/notifications/${notificationId}/read`);
    },

    markAllRead: async (): Promise<void> => {
        await api.post('/notifications/read-all');
    },

    getUnreadCount: async (): Promise<{ unread_count: number }> => {
        const { data } = await api.get('/notifications/unread-count');
        return data;
    },
};

export default notificationService;
