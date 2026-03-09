import api from './api';
import type {
    EmailTemplate,
    EmailTemplateCreate,
    SentEmail,
    SendEmailPayload,
    BulkEmailPayload,
    PaginatedResponse,
} from '@/types';

const emailTemplateService = {
    getTemplates: async (params?: { type?: string }): Promise<EmailTemplate[]> => {
        const { data } = await api.get('/email-templates', { params });
        // Handle both paginated ({ results: [...] }) and flat array responses
        return Array.isArray(data) ? data : data.results ?? [];
    },

    createTemplate: async (payload: EmailTemplateCreate): Promise<EmailTemplate> => {
        const { data } = await api.post('/email-templates', payload);
        return data;
    },

    updateTemplate: async (id: number, payload: Partial<EmailTemplateCreate>): Promise<EmailTemplate> => {
        const { data } = await api.patch(`/email-templates/${id}`, payload);
        return data;
    },

    deleteTemplate: async (id: number): Promise<void> => {
        await api.delete(`/email-templates/${id}`);
    },

    sendCandidateEmail: async (candidateId: number, payload: SendEmailPayload): Promise<SentEmail> => {
        const { data } = await api.post(`/candidates/${candidateId}/send-email`, payload);
        return data;
    },

    sendBulkEmail: async (jobId: number, payload: BulkEmailPayload): Promise<{ detail: string; results: SentEmail[] }> => {
        const { data } = await api.post(`/jobs/${jobId}/bulk-email`, payload);
        return data;
    },

    getSentEmails: async (params?: { candidate_id?: number; status?: string }): Promise<PaginatedResponse<SentEmail>> => {
        const { data } = await api.get('/sent-emails', { params });
        return data;
    },
};

export default emailTemplateService;
