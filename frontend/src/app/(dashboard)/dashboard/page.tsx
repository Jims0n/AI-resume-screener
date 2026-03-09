'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useJobs } from '@/hooks/useJobs';
import Card from '@/components/ui/Card';
import Badge, { getStatusVariant } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import ProgressBar from '@/components/ui/ProgressBar';
import activityService from '@/lib/activityService';
import type { ActivityLog } from '@/types';
import { Briefcase, FileText, Target, Star, X, Mail, UserPlus, Edit, ClipboardList, PlusCircle } from 'lucide-react';

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

function actionIcon(action: string): React.ReactNode {
    const icons: Record<string, React.ReactNode> = {
        created_job: <Briefcase className="w-4 h-4" />,
        uploaded_resumes: <FileText className="w-4 h-4" />,
        scored_candidate: <Target className="w-4 h-4" />,
        shortlisted: <Star className="w-4 h-4" />,
        rejected: <X className="w-4 h-4" />,
        sent_email: <Mail className="w-4 h-4" />,
        invited_member: <UserPlus className="w-4 h-4" />,
        updated_job: <Edit className="w-4 h-4" />,
    };
    return icons[action] || <ClipboardList className="w-4 h-4" />;
}

function actionText(log: ActivityLog): string {
    const name = log.user_name || log.user_email || 'Someone';
    const target = (log.details as Record<string, string>)?.title || (log.details as Record<string, string>)?.name || '';
    const actionMap: Record<string, string> = {
        created_job: `${name} created job "${target}"`,
        uploaded_resumes: `${name} uploaded resumes to "${target}"`,
        scored_candidate: `${name} scored in "${target}"`,
        shortlisted: `${name} shortlisted a candidate in "${target}"`,
        rejected: `${name} rejected a candidate in "${target}"`,
        sent_email: `${name} sent an email`,
        invited_member: `${name} invited a team member`,
        updated_job: `${name} updated job "${target}"`,
    };
    return actionMap[log.action] || `${name} performed ${log.action.replace('_', ' ')}`;
}

export default function DashboardPage() {
    const router = useRouter();
    const { jobs, loading, fetchJobs } = useJobs();
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [activity, setActivity] = useState<ActivityLog[]>([]);
    const [activityLoading, setActivityLoading] = useState(true);

    useEffect(() => {
        fetchJobs();
    }, [fetchJobs]);

    useEffect(() => {
        const loadActivity = async () => {
            try {
                const result = await activityService.getActivityLog();
                setActivity(result.results.slice(0, 8));
            } catch { /* silent */ }
            finally { setActivityLoading(false); }
        };
        loadActivity();
    }, []);

    const filteredJobs = statusFilter === 'all' ? jobs : jobs.filter((j) => j.status === statusFilter);

    // Dashboard stats
    const stats = useMemo(() => {
        const activeJobs = jobs.filter((j) => j.status === 'active').length;
        const totalCandidates = jobs.reduce((sum, j) => sum + j.candidate_count, 0);
        const jobsWithScores = jobs.filter((j) => j.average_score !== null);
        const avgScore = jobsWithScores.length > 0
            ? Math.round(jobsWithScores.reduce((sum, j) => sum + (j.average_score || 0), 0) / jobsWithScores.length)
            : 0;
        return { activeJobs, totalCandidates, avgScore };
    }, [jobs]);

    const mostRecentJob = jobs.length > 0 ? jobs[0] : null;

    return (
        <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="font-serif text-3xl tracking-tight text-sh-text">Dashboard</h1>
                    <p className="text-sh-text2 mt-1 font-light">Manage your job postings and candidates.</p>
                </div>
                <Button onClick={() => router.push('/jobs/new')} size="lg" className="flex gap-2">
                    <PlusCircle className="w-5 h-5" /> Create New Job
                </Button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} height={88} className="rounded-xl" />
                    ))
                ) : (
                    <>
                        <div className="bg-sh-bg rounded-2xl border border-sh-border p-5 hover:border-sh-accent transition-colors">
                            <p className="text-xs font-medium text-sh-text2 uppercase tracking-wider">Active Jobs</p>
                            <p className="text-3xl font-serif text-sh-text mt-2">{stats.activeJobs}</p>
                        </div>
                        <div className="bg-sh-bg rounded-2xl border border-sh-border p-5 hover:border-sh-accent transition-colors">
                            <p className="text-xs font-medium text-sh-text2 uppercase tracking-wider">Total Candidates</p>
                            <p className="text-3xl font-serif text-sh-text mt-2">{stats.totalCandidates}</p>
                        </div>
                        <div className="bg-sh-bg rounded-2xl border border-sh-border p-5 hover:border-sh-accent transition-colors">
                            <p className="text-xs font-medium text-sh-text2 uppercase tracking-wider">Avg Score</p>
                            <p className="text-3xl font-serif text-sh-accent mt-2">{stats.avgScore || '—'}</p>
                        </div>
                        <div className="bg-sh-bg rounded-2xl border border-sh-border p-5 hover:border-sh-accent transition-colors">
                            <p className="text-xs font-medium text-sh-text2 uppercase tracking-wider">Total Jobs</p>
                            <p className="text-3xl font-serif text-sh-text mt-2">{jobs.length}</p>
                        </div>
                    </>
                )}
            </div>

            {/* Quick Actions */}
            {mostRecentJob && (
                <div className="flex flex-wrap gap-3 mb-8">
                    <Button variant="secondary" onClick={() => router.push('/jobs/new')} className="bg-transparent text-sh-text">
                        <PlusCircle className="w-4 h-4 mr-2" /> Create Job
                    </Button>
                    <Button variant="secondary" onClick={() => router.push(`/jobs/${mostRecentJob.id}/upload`)} className="bg-transparent text-sh-text">
                        <FileText className="w-4 h-4 mr-2" /> Upload Resumes to &quot;{mostRecentJob.title.slice(0, 30)}&quot;
                    </Button>
                </div>
            )}

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Jobs Section */}
                <div className="lg:col-span-2">
                    {/* Filters */}
                    <div className="flex gap-2 mb-6">
                        {['all', 'active', 'draft', 'closed'].map((s) => (
                            <button
                                key={s}
                                onClick={() => setStatusFilter(s)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${statusFilter === s
                                    ? 'bg-sh-accent text-sh-bg'
                                    : 'bg-transparent text-sh-text2 border border-sh-border hover:bg-sh-bg3 hover:text-sh-text'
                                    }`}
                            >
                                {s.charAt(0).toUpperCase() + s.slice(1)}
                            </button>
                        ))}
                    </div>

                    {/* Job grid */}
                    {loading && jobs.length === 0 ? (
                        <div className="grid gap-4 sm:grid-cols-2">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <Skeleton key={i} height={160} className="rounded-xl" />
                            ))}
                        </div>
                    ) : filteredJobs.length === 0 ? (
                        <EmptyState
                            icon={<Briefcase className="w-12 h-12 stroke-sh-text2" />}
                            title="No jobs yet"
                            description="Create your first job posting to start screening resumes with AI."
                            actionLabel="Create New Job"
                            onAction={() => router.push('/jobs/new')}
                        />
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2">
                            {filteredJobs.map((job) => (
                                <div
                                    key={job.id}
                                    onClick={() => router.push(`/jobs/${job.id}`)}
                                    className="bg-sh-bg2 rounded-2xl border border-sh-border p-6 cursor-pointer hover:border-sh-borderHover hover:-translate-y-0.5 transition-all duration-300"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <h3 className="font-serif font-medium text-xl text-sh-text truncate pr-2">{job.title}</h3>
                                        <Badge variant={getStatusVariant(job.status)}>{job.status}</Badge>
                                    </div>
                                    <p className="text-sm text-sh-text2 font-light line-clamp-2 mb-5">{job.description}</p>

                                    {/* Mini progress bar */}
                                    {job.candidate_count > 0 && (
                                        <div className="mb-3">
                                            <ProgressBar value={job.average_score || 0} size="sm" showLabel={false} />
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-4">
                                            <span className="text-sh-text2">
                                                <strong className="text-sh-text font-medium">{job.candidate_count}</strong> candidates
                                            </span>
                                            {job.average_score !== null && (
                                                <span className="text-sh-text2">
                                                    Avg: <strong className="text-sh-accent font-medium">{job.average_score}</strong>
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-sh-muted text-xs">
                                            {new Date(job.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Activity Feed */}
                <div>
                    <h2 className="font-serif text-xl text-sh-text mb-4">Recent Activity</h2>
                    <div className="bg-sh-bg2 rounded-2xl border border-sh-border overflow-hidden">
                        {activityLoading ? (
                            <div className="p-4 space-y-3">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <div key={i} className="flex gap-3">
                                        <Skeleton variant="circle" width={32} height={32} />
                                        <div className="flex-1">
                                            <Skeleton height={14} width="80%" />
                                            <Skeleton height={10} width="40%" className="mt-1" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : activity.length === 0 ? (
                            <div className="p-8 text-center">
                                <span className="block mb-4 flex justify-center"><ClipboardList className="w-8 h-8 stroke-sh-text2" /></span>
                                <p className="text-sm text-sh-text2">No recent activity</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-sh-border">
                                {activity.map((log) => (
                                    <div key={log.id} className="flex items-start gap-3 px-5 py-4 hover:bg-sh-bg3 transition-colors">
                                        <span className="mt-0.5 text-sh-text2">{actionIcon(log.action)}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-sh-text line-clamp-2 font-light">{actionText(log)}</p>
                                            <p className="text-xs text-sh-text2 mt-1">{timeAgo(log.created_at)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
