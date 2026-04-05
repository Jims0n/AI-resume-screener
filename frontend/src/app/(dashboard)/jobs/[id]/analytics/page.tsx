'use client';
export const runtime = 'edge';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { candidateService } from '@/lib/candidateService';
import { extractApiError } from '@/lib/apiErrors';
import { AnalyticsData } from '@/types';
import Card from '@/components/ui/Card';
import ProgressBar from '@/components/ui/ProgressBar';
import Skeleton from '@/components/ui/Skeleton';
import Badge, { getStatusVariant } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    Cell, PieChart, Pie, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from 'recharts';

const COLORS = ['#c45c5c', '#b8a855', '#d4c8a0', '#7c9a72', '#6b8ab5'];
const PIE_COLORS = ['#e8e4d9', '#7c9a72', '#b8a855', '#c45c5c', '#6b8ab5'];

export default function AnalyticsPage() {
    const params = useParams();
    const router = useRouter();
    const jobId = Number(params.id);
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        candidateService.getAnalytics(jobId).then((d) => {
            setData(d);
            setLoading(false);
        }).catch((err: unknown) => {
            setError(extractApiError(err, 'Failed to load analytics'));
            setLoading(false);
        });
    }, [jobId]);

    if (loading) {
        return (
            <div className="animate-fade-in">
                <div className="mb-8">
                    <Skeleton height={16} width={120} className="mb-2" />
                    <Skeleton height={32} width={200} className="mb-2" />
                    <Skeleton height={14} width={250} />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} height={100} />
                    ))}
                </div>
                <div className="grid lg:grid-cols-2 gap-6">
                    <Skeleton height={320} />
                    <Skeleton height={320} />
                    <Skeleton height={250} />
                    <Skeleton height={250} />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-20">
                <p className="text-[#c45c5c] mb-4">{error}</p>
                <Button variant="secondary" onClick={() => router.push(`/jobs/${jobId}`)}>
                    ← Back to job
                </Button>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="text-center py-20 text-[#8a8578]">
                No analytics available
            </div>
        );
    }

    // Pipeline data for pie chart
    const pipelineData = Object.entries(data.pipeline)
        .filter(([, count]) => count > 0)
        .map(([status, count], i) => ({
            name: status.charAt(0).toUpperCase() + status.slice(1),
            value: count,
            fill: PIE_COLORS[i % PIE_COLORS.length],
        }));

    // Radar data for average scores
    const radarData = [
        { subject: 'Overall', score: data.average_scores.average_overall },
        { subject: 'Skills', score: data.average_scores.average_skill_match },
        { subject: 'Experience', score: data.average_scores.average_experience },
        { subject: 'Education', score: data.average_scores.average_education },
    ];

    // Calculate completion rate
    const completionRate = data.total_candidates > 0
        ? Math.round((data.total_scored / data.total_candidates) * 100)
        : 0;

    return (
        <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <button
                        onClick={() => router.push(`/jobs/${jobId}`)}
                        className="text-sm text-[#8a8578] hover:text-[#e8e4d9] mb-2 transition-colors cursor-pointer"
                    >
                        ← Back to job
                    </button>
                    <h1 className="font-serif text-3xl tracking-tight text-shortlyst-text">Analytics</h1>
                    <p className="text-shortlyst-text/50 font-light text-sm mt-1">
                        {data.total_candidates} total candidates · {data.total_scored} scored · {completionRate}% complete
                    </p>
                </div>
                <Button
                    variant="secondary"
                    onClick={() => router.push(`/jobs/${jobId}`)}
                >
                    View Candidates
                </Button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                    { label: 'Overall', value: data.average_scores.average_overall, color: 'text-shortlyst-text', bg: 'bg-shortlyst-text/5' },
                    { label: 'Skills', value: data.average_scores.average_skill_match, color: 'text-shortlyst-text', bg: 'bg-shortlyst-text/5' },
                    { label: 'Experience', value: data.average_scores.average_experience, color: 'text-shortlyst-text', bg: 'bg-shortlyst-text/5' },
                    { label: 'Education', value: data.average_scores.average_education, color: 'text-shortlyst-text', bg: 'bg-shortlyst-text/5' },
                ].map((s) => (
                    <div
                        key={s.label}
                        className={`${s.bg} rounded-xl p-4 border border-shortlyst-border transition-transform hover:scale-105`}
                    >
                        <div className="text-center">
                            <div className={`text-3xl font-serif ${s.color}`}>{s.value}</div>
                            <p className="text-xs text-shortlyst-text/60 font-light mt-1 uppercase tracking-wider">Avg {s.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Score Distribution */}
                <Card header={<h3 className="font-serif text-lg tracking-tight text-shortlyst-text">Score Distribution</h3>}>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.score_distribution}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                                <XAxis dataKey="range" tick={{ fontSize: 12, fill: '#6b6560' }} />
                                <YAxis tick={{ fontSize: 12, fill: '#6b6560' }} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#242424',
                                        border: '1px solid #2a2a2a',
                                        borderRadius: '8px',
                                        fontSize: '12px',
                                        color: '#e8e4d9',
                                    }}
                                />
                                <Bar dataKey="count" radius={[6, 6, 0, 0]} animationDuration={800}>
                                    {data.score_distribution.map((_, i) => (
                                        <Cell key={i} fill={COLORS[i]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Score Radar */}
                <Card header={<h3 className="font-serif text-lg tracking-tight text-shortlyst-text">Average Score Profile</h3>}>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart data={radarData}>
                                <PolarGrid stroke="#2a2a2a" />
                                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fill: '#6b6560' }} />
                                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10, fill: '#6b6560' }} />
                                <Radar
                                    name="Average"
                                    dataKey="score"
                                    stroke="#e8e4d9"
                                    fill="#e8e4d9"
                                    fillOpacity={0.3}
                                    animationDuration={800}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Skill Gap */}
                <Card header={<h3 className="font-serif text-lg tracking-tight text-shortlyst-text">Skill Gap Analysis</h3>}>
                    <div className="space-y-3">
                        {data.skill_gap.map((sg) => (
                            <div key={sg.skill}>
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm font-medium text-shortlyst-text">{sg.skill}</span>
                                    <span className="text-sm text-shortlyst-text/60">{sg.percentage}%</span>
                                </div>
                                <ProgressBar value={sg.percentage} showLabel={false} />
                            </div>
                        ))}
                        {data.skill_gap.length === 0 && (
                            <p className="text-sm text-[#8a8578]">No skills to analyze</p>
                        )}
                    </div>
                </Card>

                {/* Pipeline Pie Chart */}
                <Card header={<h3 className="font-serif text-lg tracking-tight text-shortlyst-text">Pipeline Overview</h3>}>
                    {pipelineData.length > 0 ? (
                        <div className="flex items-center gap-6">
                            <div className="h-48 w-48 flex-shrink-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pipelineData}
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={70}
                                            innerRadius={40}
                                            dataKey="value"
                                            animationDuration={800}
                                        >
                                            {pipelineData.map((entry, i) => (
                                                <Cell key={i} fill={entry.fill} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#242424',
                                                border: '1px solid #2a2a2a',
                                                borderRadius: '8px',
                                                fontSize: '12px',
                                                color: '#e8e4d9',
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="flex-1 space-y-2">
                                {Object.entries(data.pipeline).map(([status, count]) => (
                                    <div key={status} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Badge variant={getStatusVariant(status)}>{status}</Badge>
                                        </div>
                                        <span className="text-sm font-medium text-shortlyst-text">
                                            {count}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-[#8a8578] text-center py-8">
                            No pipeline data yet
                        </p>
                    )}
                </Card>

                {/* Top Candidates — full width */}
                <div className="lg:col-span-2">
                    <Card
                        header={
                            <div className="flex items-center justify-between">
                                <h3 className="font-serif text-lg tracking-tight text-shortlyst-text">Top Candidates</h3>
                                <span className="text-xs text-shortlyst-text/40 font-light">
                                    Click to view details
                                </span>
                            </div>
                        }
                        noPadding
                    >
                        <div className="divide-y divide-shortlyst-border">
                            {data.top_candidates.map((c, i) => (
                                <div
                                    key={c.id}
                                    className="flex items-center justify-between px-6 py-4 hover:bg-shortlyst-text/5 cursor-pointer transition-colors"
                                    onClick={() => router.push(`/candidates/${c.id}`)}
                                >
                                    <div className="flex items-center gap-4">
                                        <span className={`text-sm font-bold w-6 ${i === 0 ? 'text-[#d4c8a0]' : i === 1 ? 'text-[#8a8578]' : i === 2 ? 'text-[#b8a855]' : 'text-[#6b6560]'
                                            }`}>
                                            {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
                                        </span>
                                        <div>
                                            <span className="text-sm font-medium text-shortlyst-text">{c.name}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-24">
                                            <ProgressBar value={c.overall_score ?? 0} size="sm" showLabel={false} />
                                        </div>
                                        <span className="text-sm font-bold text-shortlyst-text w-8 text-right">
                                            {c.overall_score}
                                        </span>
                                        <Badge variant={getStatusVariant(c.status)}>{c.status}</Badge>
                                    </div>
                                </div>
                            ))}
                            {data.top_candidates.length === 0 && (
                                <div className="px-6 py-8 text-sm text-shortlyst-text/40 font-light text-center">
                                    No scored candidates yet
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
