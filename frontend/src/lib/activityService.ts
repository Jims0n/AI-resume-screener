import api from './api';
import type { ActivityLog, PaginatedResponse } from '@/types';

const activityService = {
    getActivityLog: async (params?: {
        action?: string;
        target_type?: string;
        date_from?: string;
        date_to?: string;
        page?: number;
    }): Promise<PaginatedResponse<ActivityLog>> => {
        const { data } = await api.get('/activity', { params });
        return data;
    },
};

export default activityService;
