'use client';

import { useState, useEffect, useCallback } from 'react';
import emailTemplateService from '@/lib/emailTemplateService';
import { useToast } from '@/components/ui/Toast';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import type { EmailTemplate, EmailTemplateCreate, EmailTemplateType } from '@/types';

const TYPE_OPTIONS: { value: EmailTemplateType; label: string }[] = [
    { value: 'shortlist', label: 'Shortlist' },
    { value: 'rejection', label: 'Rejection' },
    { value: 'interview_invite', label: 'Interview Invite' },
    { value: 'custom', label: 'Custom' },
];

const PLACEHOLDERS = [
    { name: '{{candidate_name}}', desc: "Candidate's full name" },
    { name: '{{job_title}}', desc: 'Job position title' },
    { name: '{{company_name}}', desc: 'Your organization name' },
];

export default function EmailTemplatesSettingsPage() {
    const { addToast } = useToast();
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState<EmailTemplateCreate>({
        name: '',
        type: 'custom',
        subject: '',
        body: '',
    });

    const loadTemplates = useCallback(async () => {
        try {
            const data = await emailTemplateService.getTemplates();
            setTemplates(data);
        } catch {
            addToast('Failed to load templates', 'error');
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => { loadTemplates(); }, [loadTemplates]);

    const openNewModal = () => {
        setEditingTemplate(null);
        setForm({ name: '', type: 'custom', subject: '', body: '' });
        setModalOpen(true);
    };

    const openEditModal = (template: EmailTemplate) => {
        setEditingTemplate(template);
        setForm({ name: template.name, type: template.type, subject: template.subject, body: template.body });
        setModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (editingTemplate) {
                await emailTemplateService.updateTemplate(editingTemplate.id, form);
                addToast('Template updated', 'success');
            } else {
                await emailTemplateService.createTemplate(form);
                addToast('Template created', 'success');
            }
            setModalOpen(false);
            loadTemplates();
        } catch {
            addToast('Failed to save template', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Delete this template?')) return;
        try {
            await emailTemplateService.deleteTemplate(id);
            setTemplates((prev) => prev.filter((t) => t.id !== id));
            addToast('Template deleted', 'success');
        } catch {
            addToast('Failed to delete template', 'error');
        }
    };

    if (loading) return <div className="space-y-4"><Skeleton height={60} /><Skeleton height={200} /></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Email Templates</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Create reusable email templates for candidate communication.</p>
                </div>
                <Button onClick={openNewModal}>New Template</Button>
            </div>

            {/* Placeholder reference */}
            <Card noPadding>
                <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Available Placeholders</p>
                </div>
                <div className="px-6 py-3 flex flex-wrap gap-4">
                    {PLACEHOLDERS.map((p) => (
                        <div key={p.name} className="text-sm">
                            <code className="text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-1.5 py-0.5 rounded text-xs">{p.name}</code>
                            <span className="text-slate-500 dark:text-slate-400 ml-1.5">{p.desc}</span>
                        </div>
                    ))}
                </div>
            </Card>

            {/* Templates list */}
            {templates.length === 0 ? (
                <EmptyState
                    icon="📧"
                    title="No email templates"
                    description="Create templates to quickly send emails to candidates."
                    actionLabel="Create Template"
                    onAction={openNewModal}
                />
            ) : (
                <div className="grid gap-4">
                    {templates.map((template) => (
                        <Card key={template.id} noPadding>
                            <div className="flex items-center justify-between px-6 py-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{template.name}</h3>
                                        <Badge variant="info">{template.type.replace('_', ' ')}</Badge>
                                        {template.is_default && <Badge variant="neutral">Default</Badge>}
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">Subject: {template.subject}</p>
                                </div>
                                <div className="flex items-center gap-2 ml-4">
                                    <Button variant="secondary" size="sm" onClick={() => openEditModal(template)}>Edit</Button>
                                    <Button variant="danger" size="sm" onClick={() => handleDelete(template.id)}>Delete</Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Create/Edit Modal */}
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingTemplate ? 'Edit Template' : 'New Template'} size="lg">
                <form onSubmit={handleSave} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Template Name</label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            required
                            placeholder="e.g. Interview Invitation"
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Type</label>
                        <select
                            value={form.type}
                            onChange={(e) => setForm({ ...form, type: e.target.value as EmailTemplateType })}
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            {TYPE_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Subject</label>
                        <input
                            type="text"
                            value={form.subject}
                            onChange={(e) => setForm({ ...form, subject: e.target.value })}
                            required
                            placeholder="Email subject line"
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Body</label>
                        <textarea
                            rows={8}
                            value={form.body}
                            onChange={(e) => setForm({ ...form, body: e.target.value })}
                            required
                            placeholder="Use placeholders like {{candidate_name}}, {{job_title}}, {{company_name}}"
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
                        <Button type="submit" loading={saving}>{editingTemplate ? 'Update' : 'Create'}</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
