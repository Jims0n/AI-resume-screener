import api from './api';
import { Candidate, CandidateListItem, PaginatedResponse, AnalyticsData } from '@/types';

export const candidateService = {
    async uploadResumes(jobId: number, files: File[]): Promise<{ candidates: { id: number; name: string; status: string }[] }> {
        const formData = new FormData();
        files.forEach((file) => formData.append('files', file));

        const { data } = await api.post(`/jobs/${jobId}/upload`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return data;
    },

    async getCandidates(
        jobId: number,
        params?: Record<string, string>
    ): Promise<PaginatedResponse<CandidateListItem>> {
        const { data } = await api.get<PaginatedResponse<CandidateListItem>>(
            `/jobs/${jobId}/candidates`,
            { params }
        );
        return data;
    },

    async getCandidate(id: number): Promise<Candidate> {
        const { data } = await api.get<Candidate>(`/candidates/${id}`);
        return data;
    },

    async updateCandidateStatus(id: number, status: string): Promise<Candidate> {
        const { data } = await api.patch<Candidate>(`/candidates/${id}/status`, { status });
        return data;
    },

    async reprocessCandidate(id: number): Promise<{ detail: string; status: string }> {
        const { data } = await api.post(`/candidates/${id}/reprocess`);
        return data;
    },

    async exportCandidates(jobId: number): Promise<{ blob: Blob; filename: string }> {
        const response = await api.get(`/jobs/${jobId}/export`, {
            responseType: 'blob',
        });
        const contentDisposition = response.headers['content-disposition'] || '';
        const filenameMatch = contentDisposition.match(/filename="?([^";\n]+)"?/);
        const filename = filenameMatch?.[1] || `candidates_job_${jobId}.csv`;
        return { blob: response.data, filename };
    },

    async getAnalytics(jobId: number): Promise<AnalyticsData> {
        const { data } = await api.get<AnalyticsData>(`/jobs/${jobId}/analytics`);
        return data;
    },
};
