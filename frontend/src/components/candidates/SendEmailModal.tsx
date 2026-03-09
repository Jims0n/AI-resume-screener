'use client';

import { useState, useEffect } from 'react';
import { useEmails } from '@/hooks/useEmails';
import { useToast } from '@/components/ui/Toast';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import type { Candidate } from '@/types';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    candidate: Candidate;
}

export default function SendEmailModal({ isOpen, onClose, candidate }: Props) {
    const { templates, fetchTemplates, sendEmail } = useEmails();
    const { addToast } = useToast();
    const [selectedTemplateId, setSelectedTemplateId] = useState<number | ''>('');
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [sending, setSending] = useState(false);

    useEffect(() => {
        if (isOpen) fetchTemplates();
    }, [isOpen, fetchTemplates]);

    // When template is selected, fill in subject/body
    const handleTemplateChange = (templateId: string) => {
        setSelectedTemplateId(templateId ? parseInt(templateId) : '');
        if (templateId) {
            const template = templates.find((t) => t.id === parseInt(templateId));
            if (template) {
                setSubject(template.subject.replace(/\{\{candidate_name\}\}/g, candidate.name).replace(/\{\{job_title\}\}/g, candidate.job_title || ''));
                setBody(template.body.replace(/\{\{candidate_name\}\}/g, candidate.name).replace(/\{\{job_title\}\}/g, candidate.job_title || ''));
            }
        }
    };

    const handleSend = async () => {
        if (!subject.trim() || !body.trim()) {
            addToast('Subject and body are required', 'error');
            return;
        }
        setSending(true);
        try {
            await sendEmail(candidate.id, {
                template_id: selectedTemplateId || undefined,
                subject,
                body,
            });
            addToast(`Email sent to ${candidate.email}`, 'success');
            onClose();
            setSubject('');
            setBody('');
            setSelectedTemplateId('');
        } catch {
            addToast('Failed to send email', 'error');
        } finally {
            setSending(false);
        }
    };

    const inputClasses = "w-full px-3 py-2 rounded-xl border border-shortlyst-border bg-shortlyst-text/5 text-shortlyst-text focus:outline-none focus:ring-1 focus:ring-shortlyst-accent text-sm font-light placeholder:text-shortlyst-text/40";

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Send Email to ${candidate.name}`} size="lg">
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-shortlyst-text/80 mb-1">To</label>
                    <p className="text-sm text-shortlyst-text/60 bg-shortlyst-text/5 px-3 py-2 rounded-xl border border-shortlyst-border font-light">
                        {candidate.email || 'No email available'}
                    </p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-shortlyst-text/80 mb-1">Template (optional)</label>
                    <select value={selectedTemplateId} onChange={(e) => handleTemplateChange(e.target.value)} className={inputClasses}>
                        <option value="">Write custom email</option>
                        {templates.map((t) => (
                            <option key={t.id} value={t.id}>{t.name} ({t.type})</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-shortlyst-text/80 mb-1">Subject</label>
                    <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} className={inputClasses} placeholder="Email subject" />
                </div>

                <div>
                    <label className="block text-sm font-medium text-shortlyst-text/80 mb-1">Body</label>
                    <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={8} className={`${inputClasses} resize-none`} placeholder="Email body..." />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSend} loading={sending} disabled={!candidate.email}>Send Email</Button>
                </div>
            </div>
        </Modal>
    );
}
