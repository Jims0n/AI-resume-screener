import api from './api';
import { Job, JobCreate, PaginatedResponse } from '@/types';

export const jobService = {
    async getJobs(params?: Record<string, string>): Promise<PaginatedResponse<Job>> {
        const { data } = await api.get<PaginatedResponse<Job>>('/jobs', { params });
        return data;
    },

    async getJob(id: number): Promise<Job> {
        const { data } = await api.get<Job>(`/jobs/${id}`);
        return data;
    },

    async createJob(payload: JobCreate): Promise<Job> {
        const { data } = await api.post<Job>('/jobs', payload);
        return data;
    },

    async updateJob(id: number, payload: Partial<JobCreate>): Promise<Job> {
        const { data } = await api.patch<Job>(`/jobs/${id}`, payload);
        return data;
    },

    async deleteJob(id: number): Promise<void> {
        await api.delete(`/jobs/${id}`);
    },
};
