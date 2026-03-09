'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useJobs } from '@/hooks/useJobs';
import { useCandidates } from '@/hooks/useCandidates';
import { useToast } from '@/components/ui/Toast';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge, { getStatusVariant } from '@/components/ui/Badge';
import ProgressBar from '@/components/ui/ProgressBar';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';

export default function JobDetailPage() {
    const params = useParams();
    const router = useRouter();
    const jobId = Number(params.id);
    const { currentJob, fetchJob, loading: jobLoading } = useJobs();
    const { candidates, fetchCandidates, updateStatus, exportCSV, loading: candLoading } = useCandidates();
    const { addToast } = useToast();
    const [sortKey, setSortKey] = useState<string>('-overall_score');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [selected, setSelected] = useState<Set<number>>(new Set());

    useEffect(() => {
        fetchJob(jobId);
        fetchCandidates(jobId, { ordering: sortKey, ...(statusFilter ? { status: statusFilter } : {}) });
    }, [jobId, sortKey, statusFilter, fetchJob, fetchCandidates]);

    const toggleSort = (key: string) => {
        setSortKey((prev) => (prev === key ? `-${key}` : prev === `-${key}` ? key : `-${key}`));
    };

    const toggleSelect = (id: number) => {
        setSelected((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const selectAll = () => {
        if (selected.size === candidates.length) {
            setSelected(new Set());
        } else {
            setSelected(new Set(candidates.map((c) => c.id)));
        }
    };

    const bulkAction = async (status: string) => {
        const ids = Array.from(selected);
        const results = await Promise.allSettled(ids.map((id) => updateStatus(id, status)));
        const failed = results.filter((r) => r.status === 'rejected').length;
        setSelected(new Set());
        if (failed === 0) {
            addToast(`${ids.length} candidate(s) ${status}`, 'success');
        } else {
            addToast(`${ids.length - failed} updated, ${failed} failed`, 'error');
        }
        fetchCandidates(jobId, { ordering: sortKey });
    };

    const handleExport = async () => {
        try {
            await exportCSV(jobId);
            addToast('CSV exported!', 'success');
        } catch {
            addToast('Failed to export CSV', 'error');
        }
    };

    const handleCompare = () => {
        if (selected.size < 2) {
            addToast('Select at least 2 candidates to compare', 'error');
            return;
        }
        if (selected.size > 5) {
            addToast('Maximum 5 candidates for comparison', 'error');
            return;
        }
        const ids = Array.from(selected).join(',');
        router.push(`/jobs/${jobId}/compare?candidates=${ids}`);
    };

    const SortHeader = ({ field, children }: { field: string; children: React.ReactNode }) => (
        <th
            className="px-4 py-3 text-left text-xs font-medium text-sh-text2 uppercase tracking-wider cursor-pointer hover:text-sh-text transition-colors select-none"
            onClick={() => toggleSort(field)}
        >
            <span className="inline-flex items-center gap-1">
                {children}
                {sortKey === field && '↑'}
                {sortKey === `-${field}` && '↓'}
            </span>
        </th>
    );

    if (jobLoading && !currentJob) {
        return (
            <div className="space-y-4">
                <Skeleton height={80} className="rounded-xl" />
                <Skeleton height={400} className="rounded-xl" />
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            {/* Job Header */}
            {currentJob && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="font-serif text-3xl tracking-tight text-sh-text">{currentJob.title}</h1>
                            <Badge variant={getStatusVariant(currentJob.status)}>{currentJob.status}</Badge>
                        </div>
                        <p className="text-sh-text2 font-light text-sm">
                            {currentJob.candidate_count} candidates · Created {new Date(currentJob.created_at).toLocaleDateString()}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button variant="secondary" onClick={() => router.push(`/jobs/${jobId}/upload`)}>Upload Resumes</Button>
                        <Button variant="secondary" onClick={() => router.push(`/jobs/${jobId}/analytics`)}>Analytics</Button>
                        <Button variant="secondary" onClick={handleExport}>Export CSV</Button>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="flex gap-2 mb-4 overflow-x-auto">
                {['', 'pending', 'processing', 'scored', 'shortlisted', 'rejected'].map((s) => (
                    <button
                        key={s}
                        onClick={() => setStatusFilter(s)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${statusFilter === s
                            ? 'bg-sh-accent text-sh-bg'
                            : 'bg-transparent text-sh-text2 border border-sh-border hover:bg-sh-bg3 hover:text-sh-text'
                            }`}
                    >
                        {s || 'All'}
                    </button>
                ))}
            </div>

            {/* Bulk actions */}
            {selected.size > 0 && (
                <div className="bg-sh-bg2 border border-sh-border rounded-xl px-4 py-3 mb-4 flex flex-wrap items-center gap-3">
                    <span className="text-sm font-medium text-sh-text">{selected.size} selected</span>
                    <Button size="sm" onClick={() => bulkAction('shortlisted')}>Shortlist</Button>
                    <Button size="sm" variant="danger" onClick={() => bulkAction('rejected')}>Reject</Button>
                    <Button size="sm" variant="secondary" onClick={handleCompare}>Compare</Button>
                    <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Clear</Button>
                </div>
            )}

            {/* Candidates Table */}
            {candLoading && candidates.length === 0 ? (
                <Skeleton height={300} className="rounded-xl" />
            ) : candidates.length === 0 ? (
                <EmptyState
                    icon="📄"
                    title="No candidates yet"
                    description="Upload resumes to start screening candidates."
                    actionLabel="Upload Resumes"
                    onAction={() => router.push(`/jobs/${jobId}/upload`)}
                />
            ) : (
                <Card noPadding>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-sh-bg3 border-b border-sh-border">
                                <tr>
                                    <th className="px-4 py-3 w-10">
                                        <input
                                            type="checkbox"
                                            checked={selected.size === candidates.length && candidates.length > 0}
                                            onChange={selectAll}
                                            className="rounded border-sh-border bg-sh-bg2"
                                        />
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-sh-text2 uppercase">#</th>
                                    <SortHeader field="name">Name</SortHeader>
                                    <SortHeader field="overall_score">Overall</SortHeader>
                                    <SortHeader field="skill_match_score">Skills</SortHeader>
                                    <SortHeader field="experience_score">Experience</SortHeader>
                                    <SortHeader field="education_score">Education</SortHeader>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-sh-text2 uppercase">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-sh-border">
                                {candidates.map((c, idx) => (
                                    <tr
                                        key={c.id}
                                        className="hover:bg-sh-bg3 cursor-pointer transition-colors"
                                        onClick={() => router.push(`/candidates/${c.id}`)}
                                    >
                                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                            <input
                                                type="checkbox"
                                                checked={selected.has(c.id)}
                                                onChange={() => toggleSelect(c.id)}
                                                className="rounded border-sh-border bg-sh-bg2"
                                            />
                                        </td>
                                        <td className="px-4 py-3 text-sm text-sh-text2 font-mono">{idx + 1}</td>
                                        <td className="px-4 py-3">
                                            <div>
                                                <p className="text-sm font-medium text-sh-text">{c.name}</p>
                                                {c.email && <p className="text-xs text-sh-text2 font-light mt-0.5">{c.email}</p>}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 w-40">
                                            {c.overall_score !== null ? (
                                                <ProgressBar value={c.overall_score} />
                                            ) : (
                                                <span className="text-xs text-sh-muted">—</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 w-32">
                                            {c.skill_match_score !== null ? <ProgressBar value={c.skill_match_score} size="sm" /> : <span className="text-xs text-sh-muted">—</span>}
                                        </td>
                                        <td className="px-4 py-3 w-32">
                                            {c.experience_score !== null ? <ProgressBar value={c.experience_score} size="sm" /> : <span className="text-xs text-sh-muted">—</span>}
                                        </td>
                                        <td className="px-4 py-3 w-32">
                                            {c.education_score !== null ? <ProgressBar value={c.education_score} size="sm" /> : <span className="text-xs text-sh-muted">—</span>}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge variant={getStatusVariant(c.status)}>{c.status}</Badge>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}
        </div>
    );
}
