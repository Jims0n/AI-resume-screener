'use client';
export const runtime = 'edge';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCandidates } from '@/hooks/useCandidates';
import { useEmails } from '@/hooks/useEmails';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useToast } from '@/components/ui/Toast';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge, { getStatusVariant } from '@/components/ui/Badge';
import ProgressBar from '@/components/ui/ProgressBar';
import Skeleton from '@/components/ui/Skeleton';
import NotesSection from '@/components/candidates/NotesSection';
import SendEmailModal from '@/components/candidates/SendEmailModal';
import {
    RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
    ResponsiveContainer,
} from 'recharts';
import { Check, X, Mail, RefreshCw, Phone, ChevronLeft } from 'lucide-react';

export default function CandidateDetailPage() {
    const params = useParams();
    const router = useRouter();
    const candidateId = Number(params.id);
    const { currentCandidate: candidate, fetchCandidate, updateStatus, reprocess, loading } = useCandidates();
    const { sentEmails, fetchSentEmails } = useEmails();
    const { addToast } = useToast();
    const [emailModalOpen, setEmailModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'details' | 'notes' | 'emails'>('details');

    useEffect(() => {
        fetchCandidate(candidateId);
        fetchSentEmails(candidateId);
    }, [candidateId, fetchCandidate, fetchSentEmails]);

    const handleStatusChange = useCallback(async (status: string) => {
        await updateStatus(candidateId, status);
        fetchCandidate(candidateId);
        addToast(`Candidate ${status}`, 'success');
    }, [candidateId, updateStatus, fetchCandidate, addToast]);

    const handleReprocess = async () => {
        await reprocess(candidateId);
        addToast('Reprocessing started', 'info');
        fetchCandidate(candidateId);
    };

    // Keyboard shortcuts
    const shortcuts = useMemo(() => ({
        s: () => { if (candidate) handleStatusChange('shortlisted'); },
        r: () => { if (candidate) handleStatusChange('rejected'); },
        e: () => { if (candidate) setEmailModalOpen(true); },
        n: () => setActiveTab('notes'),
    }), [candidate, handleStatusChange]);

    useKeyboardShortcuts(shortcuts, !!candidate);

    if (loading && !candidate) {
        return (
            <div className="animate-fade-in">
                <div className="mb-8">
                    <Skeleton height={16} width={120} className="mb-2" />
                    <Skeleton height={32} width={250} className="mb-2" />
                    <Skeleton height={14} width={300} />
                </div>
                <div className="grid lg:grid-cols-2 gap-6">
                    <div className="space-y-6">
                        <Skeleton height={140} />
                        <Skeleton height={320} />
                        <div className="grid grid-cols-2 gap-4">
                            <Skeleton height={160} />
                            <Skeleton height={160} />
                        </div>
                    </div>
                    <div className="space-y-6">
                        <Skeleton height={100} />
                        <Skeleton height={180} />
                        <Skeleton height={200} />
                    </div>
                </div>
            </div>
        );
    }

    if (!candidate) {
        return (
            <div className="text-center py-20 text-slate-500 dark:text-slate-400">
                Candidate not found
            </div>
        );
    }

    const radarData = [
        { subject: 'Skills', score: candidate.skill_match_score || 0, fullMark: 100 },
        { subject: 'Experience', score: candidate.experience_score || 0, fullMark: 100 },
        { subject: 'Education', score: candidate.education_score || 0, fullMark: 100 },
    ];

    const parsed = candidate.parsed_data || {};
    const requiredSkills = candidate.skill_matches?.filter((s) => s.is_required) || [];
    const niceSkills = candidate.skill_matches?.filter((s) => !s.is_required) || [];

    const proficiencyColors: Record<string, string> = {
        expert: 'bg-[#2d3a2d] text-[#7c9a72]',
        advanced: 'bg-[#1e2a3a] text-[#6b8ab5]',
        intermediate: 'bg-[#3a3520] text-[#b8a855]',
        beginner: 'bg-[#3a3520] text-[#b8a855]',
        none: 'bg-[#3a2020] text-[#c45c5c]',
    };

    function timeAgo(dateStr: string): string {
        const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
        if (seconds < 60) return 'just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    }

    const tabs = [
        { key: 'details' as const, label: 'Resume Details' },
        { key: 'notes' as const, label: `Notes` },
        { key: 'emails' as const, label: `Emails (${sentEmails.length})` },
    ];

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <button
                        onClick={() => router.back()}
                        className="text-sm text-sh-text2 hover:text-sh-text mb-2 flex items-center gap-1 transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" /> Back to rankings
                    </button>
                    <div className="flex items-center gap-3">
                        <h1 className="font-serif text-3xl tracking-tight text-sh-text">{candidate.name}</h1>
                        <Badge variant={getStatusVariant(candidate.status)}>{candidate.status}</Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-sh-text2 font-light">
                        {candidate.email && <span className="flex items-center gap-1.5"><Mail className="w-4 h-4" /> {candidate.email}</span>}
                        {candidate.phone && <span className="flex items-center gap-1.5"><Phone className="w-4 h-4" /> {candidate.phone}</span>}
                        {candidate.job_title && (
                            <span className="text-xs bg-sh-bg3 text-sh-text px-2 py-0.5 rounded border border-sh-border">
                                {candidate.job_title}
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <Button onClick={() => handleStatusChange('shortlisted')} title="Shortcut: S" className="flex gap-2">
                        <Check className="w-4 h-4" /> Shortlist
                    </Button>
                    <Button variant="danger" onClick={() => handleStatusChange('rejected')} title="Shortcut: R" className="flex gap-2">
                        <X className="w-4 h-4" /> Reject
                    </Button>
                    <Button variant="secondary" onClick={() => setEmailModalOpen(true)} title="Shortcut: E" className="flex gap-2">
                        <Mail className="w-4 h-4" /> Email
                    </Button>
                    <Button variant="secondary" onClick={handleReprocess} className="flex gap-2">
                        <RefreshCw className="w-4 h-4" /> Reprocess
                    </Button>
                </div>
            </div>

            {/* Keyboard shortcuts hint */}
            <div className="hidden lg:flex items-center gap-3 mb-6 text-xs text-sh-muted font-light">
                <span>Keyboard shortcuts:</span>
                <kbd className="px-1.5 py-0.5 bg-sh-bg2 rounded text-sh-text2 font-mono border border-sh-border">S</kbd>
                <span>Shortlist</span>
                <kbd className="px-1.5 py-0.5 bg-sh-bg2 rounded text-sh-text2 font-mono border border-sh-border">R</kbd>
                <span>Reject</span>
                <kbd className="px-1.5 py-0.5 bg-sh-bg2 rounded text-sh-text2 font-mono border border-sh-border">E</kbd>
                <span>Email</span>
                <kbd className="px-1.5 py-0.5 bg-sh-bg2 rounded text-sh-text2 font-mono border border-sh-border">N</kbd>
                <span>Notes</span>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Left Column — Scores (1/3) */}
                <div className="space-y-6">
                    {/* Overall Score */}
                    <Card>
                        <div className="text-center">
                            <div className="text-5xl font-serif text-sh-text mb-1 drop-shadow-sm">
                                {candidate.overall_score ?? '—'}
                            </div>
                            <p className="text-sm text-sh-text2 font-light uppercase tracking-wider mt-2">Overall Score</p>
                        </div>
                    </Card>

                    {/* Radar Chart */}
                    <Card header={<h3 className="font-serif text-lg text-sh-text">Score Breakdown</h3>}>
                        <div className="h-56">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart data={radarData}>
                                    <PolarGrid stroke="#2a2a2a" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#6b6560' }} />
                                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10, fill: '#6b6560' }} />
                                    <Radar name="Score" dataKey="score" stroke="#e8e4d9" fill="#e8e4d9" fillOpacity={0.2} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="grid grid-cols-3 gap-3 mt-4">
                            {[
                                { label: 'Skills', value: candidate.skill_match_score },
                                { label: 'Experience', value: candidate.experience_score },
                                { label: 'Education', value: candidate.education_score },
                            ].map(({ label, value }) => (
                                <div key={label}>
                                    <p className="text-xs text-[#8a8578] mb-1">{label}</p>
                                    <ProgressBar value={value ?? 0} size="md" />
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Strengths & Red Flags */}
                    <Card header={<h3 className="font-serif text-lg text-sh-text">💪 Strengths</h3>}>
                        {candidate.strengths && candidate.strengths.length > 0 ? (
                            <ul className="space-y-3">
                                {candidate.strengths.map((s, i) => (
                                    <li key={i} className="text-sm text-sh-text font-light flex items-start gap-2">
                                        <span className="text-[#7c9a72] mt-0.5">•</span>
                                        <span>{s}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-sh-muted font-light">None identified</p>
                        )}
                    </Card>

                    <Card header={<h3 className="font-serif text-lg text-sh-text">⚠️ Red Flags</h3>}>
                        {candidate.red_flags && candidate.red_flags.length > 0 ? (
                            <ul className="space-y-3">
                                {candidate.red_flags.map((f, i) => (
                                    <li key={i} className="text-sm text-sh-text font-light flex items-start gap-2">
                                        <span className="text-[#c45c5c] mt-0.5">•</span>
                                        <span>{f}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-sh-muted font-light">None identified</p>
                        )}
                    </Card>

                    {candidate.scoring_reasoning && (
                        <div className="lg:col-span-3">
                            <Card header={<h3 className="font-serif text-lg text-sh-text">🤖 AI Reasoning</h3>}>
                                <p className="text-sm text-sh-text2 font-light leading-relaxed">
                                    {candidate.scoring_reasoning}
                                </p>
                            </Card>
                        </div>
                    )}
                </div>

                {/* Center + Right Column (2/3) — Tabbed content */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="mt-8 mb-6">
                        <nav className="flex gap-6">
                            <div className="flex border-b border-sh-border">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.key}
                                        onClick={() => setActiveTab(tab.key)}
                                        className={`pb-3 px-2 text-sm font-medium transition-colors ${activeTab === tab.key
                                            ? 'border-b-2 border-sh-accent text-sh-accent'
                                            : 'border-b-2 border-transparent text-sh-text2 hover:text-sh-text hover:border-sh-borderHover'
                                            }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </nav>
                    </div>

                    {/* Tab Content: Details */}
                    {activeTab === 'details' && (
                        <div className="space-y-6">
                            {/* Summary */}
                            {parsed.summary && (
                                <Card header={<h3 className="font-serif text-lg text-sh-text">Summary</h3>}>
                                    <p className="text-sm text-sh-text font-light">{parsed.summary}</p>
                                </Card>
                            )}

                            {/* Skills */}
                            {parsed.skills && parsed.skills.length > 0 && (
                                <Card header={<h3 className="font-serif text-lg text-sh-text">Skills</h3>}>
                                    <div className="flex flex-wrap gap-2">
                                        {parsed.skills.map((skill: string, i: number) => (
                                            <span
                                                key={i}
                                                className="bg-sh-bg3 border border-sh-border text-sh-text px-2.5 py-1 rounded-full text-xs font-medium"
                                            >
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </Card>
                            )}

                            {/* Experience */}
                            {parsed.experience && parsed.experience.length > 0 && (
                                <Card header={<h3 className="font-serif text-lg text-sh-text">Experience</h3>}>
                                    <div className="space-y-6">
                                        {parsed.experience.map((exp: any, i: number) => (
                                            <div key={i} className="border-l border-sh-border pl-4">
                                                <p className="text-sm font-medium text-sh-text">{exp.title}</p>
                                                <p className="text-sm text-sh-text2">{exp.company}</p>
                                                <p className="text-xs text-sh-muted">{exp.duration}</p>
                                                {exp.highlights && exp.highlights.length > 0 && (
                                                    <ul className="mt-3 space-y-1.5">
                                                        {exp.highlights.map((h: string, j: number) => (
                                                            <li key={j} className="text-xs text-sh-text2 font-light">• {h}</li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            )}

                            {/* Education */}
                            {parsed.education && parsed.education.length > 0 && (
                                <Card header={<h3 className="font-serif text-lg text-sh-text">Education</h3>}>
                                    <div className="space-y-4">
                                        {parsed.education.map((edu: any, i: number) => (
                                            <div key={i} className="flex gap-4">
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-sh-text">{edu.degree}</p>
                                                    <p className="text-sm text-sh-text2">{edu.institution}</p>
                                                    {edu.year && <p className="text-xs text-sh-muted">{edu.year}</p>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            )}

                            {/* Raw Content Viewer (Optional / Hidden by default) */}
                            {candidate.resume_text && (
                                <Card header={<h3 className="font-serif text-lg text-sh-text">Resume Text</h3>}>
                                    <pre className="text-xs text-sh-text2 font-light whitespace-pre-wrap font-mono max-h-96 overflow-y-auto bg-sh-bg3 border border-sh-border p-4 rounded-xl">
                                        {candidate.resume_text}
                                    </pre>
                                </Card>
                            )}
                        </div>
                    )}

                    {/* Tab Content: Notes */}
                    {activeTab === 'notes' && (
                        <Card>
                            <NotesSection candidateId={candidateId} />
                        </Card>
                    )}

                    {/* Tab Content: Emails */}
                    {activeTab === 'emails' && (
                        <div className="lg:col-span-2 space-y-4">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-serif text-xl tracking-tight text-sh-text">
                                    Communication History
                                </h3>
                                <Button size="sm" onClick={() => setEmailModalOpen(true)}>
                                    ✉ Send Email
                                </Button>
                                <Button variant="secondary" size="sm" onClick={() => fetchSentEmails(candidateId)} className="flex gap-1.5">
                                    <RefreshCw className="w-3.5 h-3.5" /> Refresh
                                </Button>
                            </div>

                            {loading ? (
                                <div className="space-y-4 mb-4">
                                    <Skeleton height={120} className="rounded-xl" />
                                    <Skeleton height={120} className="rounded-xl" />
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {sentEmails.length === 0 ? (
                                        <Card>
                                            <div className="text-center py-8 text-sh-muted">
                                                <div className="text-3xl mb-2">
                                                    <Mail className="h-8 w-8 mx-auto" />
                                                </div>
                                                <p className="text-sm font-light">No emails sent to this candidate yet.</p>
                                            </div>
                                        </Card>
                                    ) : (
                                        sentEmails.map((email) => (
                                            <Card key={email.id} noPadding>
                                                <div className="p-4 sm:p-5">
                                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-3">
                                                        <div>
                                                            <p className="text-sm font-medium text-sh-text">
                                                                {email.subject}
                                                            </p>
                                                            <p className="text-xs text-sh-text2 font-light mt-1 line-clamp-2">
                                                                {email.body}
                                                            </p>
                                                        </div>
                                                        <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:gap-2 w-full sm:w-auto flex-shrink-0">
                                                            <span className="text-xs text-sh-muted">
                                                                {timeAgo(email.created_at)}
                                                            </span>
                                                            <Badge
                                                                variant={email.status === 'sent' ? 'success' : email.status === 'failed' ? 'danger' : 'neutral'}
                                                            >
                                                                {email.status}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                    {email.template_name && (
                                                        <div className="mt-3 pt-3 border-t border-sh-border">
                                                            <span className="text-xs text-sh-muted">
                                                                Sent via {email.template_name}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </Card>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Skill Match Grid */}
            {activeTab === 'details' && (
                <div className="mt-8">
                    <Card
                        header={<h3 className="font-serif text-xl tracking-tight text-sh-text">Skill Match Analysis</h3>}
                        noPadding
                    >
                        {[
                            { title: 'Required Skills', skills: requiredSkills },
                            { title: 'Nice-to-Have Skills', skills: niceSkills },
                        ].map(({ title, skills }) => (
                            skills.length > 0 && (
                                <div key={title}>
                                    <div className="px-6 py-4 bg-sh-bg3 border-b border-sh-border">
                                        <h4 className="text-xs font-serif font-medium text-sh-text2 uppercase tracking-wide">
                                            {title}
                                        </h4>
                                    </div>
                                    <div className="divide-y divide-sh-border">
                                        {skills.map((sm, idx) => (
                                            <div key={idx} className="flex items-center gap-4 px-6 py-4">
                                                <span className={`text-lg ${sm.found ? 'text-[#7c9a72]' : 'text-[#c45c5c]'}`}>
                                                    {sm.found ? '✓' : '✗'}
                                                </span>
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-sh-text">
                                                        {sm.skill_name}
                                                    </p>
                                                    {sm.evidence && (
                                                        <p className="text-xs text-sh-muted mt-0.5">
                                                            {sm.evidence}
                                                        </p>
                                                    )}
                                                </div>
                                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${proficiencyColors[sm.proficiency?.toLowerCase()] || proficiencyColors['none']}`}>
                                                    {sm.proficiency || 'None'}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )
                        ))}
                    </Card>
                </div>
            )}

            {/* Email Modal */}
            <SendEmailModal
                isOpen={emailModalOpen}
                onClose={() => {
                    setEmailModalOpen(false);
                    fetchSentEmails(candidateId);
                }}
                candidate={candidate}
            />
        </div>
    );
}
