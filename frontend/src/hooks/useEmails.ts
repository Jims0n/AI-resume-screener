'use client';

import { useState, useCallback } from 'react';
import emailTemplateService from '@/lib/emailTemplateService';
import type { EmailTemplate, SentEmail, SendEmailPayload, BulkEmailPayload } from '@/types';

export function useEmails() {
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [sentEmails, setSentEmails] = useState<SentEmail[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchTemplates = useCallback(async (type?: string) => {
        setLoading(true);
        setError(null);
        try {
            const data = await emailTemplateService.getTemplates(type ? { type } : undefined);
            setTemplates(data);
        } catch {
            setError('Failed to load email templates');
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchSentEmails = useCallback(async (candidateId?: number) => {
        setLoading(true);
        try {
            const data = await emailTemplateService.getSentEmails(
                candidateId ? { candidate_id: candidateId } : undefined
            );
            setSentEmails(data.results);
        } catch {
            setError('Failed to load sent emails');
        } finally {
            setLoading(false);
        }
    }, []);

    const sendEmail = useCallback(async (candidateId: number, payload: SendEmailPayload) => {
        const result = await emailTemplateService.sendCandidateEmail(candidateId, payload);
        return result;
    }, []);

    const sendBulkEmail = useCallback(async (jobId: number, payload: BulkEmailPayload) => {
        const result = await emailTemplateService.sendBulkEmail(jobId, payload);
        return result;
    }, []);

    return {
        templates,
        sentEmails,
        loading,
        error,
        fetchTemplates,
        fetchSentEmails,
        sendEmail,
        sendBulkEmail,
    };
}
