'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useJobs } from '@/hooks/useJobs';
import Card from '@/components/ui/Card';
import Badge, { getStatusVariant } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';

export default function DashboardPage() {
    const router = useRouter();
    const { jobs, loading, fetchJobs } = useJobs();
    const [statusFilter, setStatusFilter] = useState<string>('all');

    useEffect(() => {
        fetchJobs();
    }, [fetchJobs]);

    const filteredJobs = statusFilter === 'all' ? jobs : jobs.filter((j) => j.status === statusFilter);

    if (loading && jobs.length === 0) {
        return (
            <div className="flex items-center justify-center py-20">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
                    <p className="text-slate-500 mt-1">Manage your job postings and candidates</p>
                </div>
                <Button onClick={() => router.push('/jobs/new')} size="lg">
                    + Create New Job
                </Button>
            </div>

            {/* Filters */}
            <div className="flex gap-2 mb-6">
                {['all', 'active', 'draft', 'closed'].map((s) => (
                    <button
                        key={s}
                        onClick={() => setStatusFilter(s)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${statusFilter === s
                                ? 'bg-indigo-600 text-white'
                                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                            }`}
                    >
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                ))}
            </div>

            {/* Job grid */}
            {filteredJobs.length === 0 ? (
                <EmptyState
                    icon="💼"
                    title="No jobs yet"
                    description="Create your first job posting to start screening resumes with AI."
                    actionLabel="Create New Job"
                    onAction={() => router.push('/jobs/new')}
                />
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredJobs.map((job) => (
                        <Card
                            key={job.id}
                            className="cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                        >
                            <div onClick={() => router.push(`/jobs/${job.id}`)}>
                                <div className="flex items-start justify-between mb-3">
                                    <h3 className="font-semibold text-slate-900 text-base truncate pr-2">{job.title}</h3>
                                    <Badge variant={getStatusVariant(job.status)}>{job.status}</Badge>
                                </div>
                                <p className="text-sm text-slate-500 line-clamp-2 mb-4">{job.description}</p>
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-4">
                                        <span className="text-slate-600">
                                            <strong className="text-slate-900">{job.candidate_count}</strong> candidates
                                        </span>
                                        {job.average_score !== null && (
                                            <span className="text-slate-600">
                                                Avg: <strong className="text-slate-900">{job.average_score}</strong>
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-slate-400 text-xs">
                                        {new Date(job.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
