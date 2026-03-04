'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { candidateService } from '@/lib/candidateService';
import { AnalyticsData } from '@/types';
import Card from '@/components/ui/Card';
import ProgressBar from '@/components/ui/ProgressBar';
import Spinner from '@/components/ui/Spinner';
import Badge, { getStatusVariant } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    Cell,
} from 'recharts';

const COLORS = ['#ef4444', '#f59e0b', '#eab308', '#22c55e', '#10b981'];

export default function AnalyticsPage() {
    const params = useParams();
    const router = useRouter();
    const jobId = Number(params.id);
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        candidateService.getAnalytics(jobId).then((d) => {
            setData(d);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [jobId]);

    if (loading) {
        return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
    }

    if (!data) {
        return <div className="text-center py-20 text-slate-500">No analytics available</div>;
    }

    return (
        <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <button onClick={() => router.push(`/jobs/${jobId}`)} className="text-sm text-indigo-600 hover:text-indigo-700 mb-2">
                        ← Back to job
                    </button>
                    <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
                    <p className="text-slate-500 mt-1">{data.total_candidates} total candidates · {data.total_scored} scored</p>
                </div>
            </div>

            {/* Average Scores */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                    { label: 'Overall', value: data.average_scores.average_overall, color: 'text-indigo-600' },
                    { label: 'Skills', value: data.average_scores.average_skill_match, color: 'text-blue-600' },
                    { label: 'Experience', value: data.average_scores.average_experience, color: 'text-purple-600' },
                    { label: 'Education', value: data.average_scores.average_education, color: 'text-emerald-600' },
                ].map((s) => (
                    <Card key={s.label}>
                        <div className="text-center">
                            <div className={`text-3xl font-extrabold ${s.color}`}>{s.value}</div>
                            <p className="text-xs text-slate-500 mt-1">Avg {s.label}</p>
                        </div>
                    </Card>
                ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Score Distribution */}
                <Card header={<h3 className="font-semibold text-slate-700">Score Distribution</h3>}>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.score_distribution}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="range" tick={{ fontSize: 12 }} />
                                <YAxis tick={{ fontSize: 12 }} />
                                <Tooltip />
                                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                                    {data.score_distribution.map((_, i) => (
                                        <Cell key={i} fill={COLORS[i]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Skill Gap */}
                <Card header={<h3 className="font-semibold text-slate-700">Skill Gap Analysis</h3>}>
                    <div className="space-y-3">
                        {data.skill_gap.map((sg) => (
                            <div key={sg.skill}>
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm font-medium text-slate-700">{sg.skill}</span>
                                    <span className="text-sm text-slate-500">{sg.percentage}%</span>
                                </div>
                                <ProgressBar value={sg.percentage} showLabel={false} />
                            </div>
                        ))}
                        {data.skill_gap.length === 0 && <p className="text-sm text-slate-400">No skills to analyze</p>}
                    </div>
                </Card>

                {/* Pipeline */}
                <Card header={<h3 className="font-semibold text-slate-700">Pipeline Overview</h3>}>
                    <div className="grid grid-cols-5 gap-2">
                        {Object.entries(data.pipeline).map(([status, count]) => (
                            <div key={status} className="text-center">
                                <div className="text-2xl font-bold text-slate-900">{count}</div>
                                <Badge variant={getStatusVariant(status)} className="mt-1">{status}</Badge>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Top Candidates */}
                <Card header={<h3 className="font-semibold text-slate-700">Top 5 Candidates</h3>} noPadding>
                    <div className="divide-y divide-slate-100">
                        {data.top_candidates.map((c: any, i: number) => (
                            <div
                                key={c.id}
                                className="flex items-center justify-between px-6 py-3 hover:bg-slate-50 cursor-pointer transition-colors"
                                onClick={() => router.push(`/candidates/${c.id}`)}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-bold text-slate-400 w-6">{i + 1}.</span>
                                    <span className="text-sm font-medium text-slate-900">{c.name}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-bold text-indigo-600">{c.overall_score}</span>
                                    <Badge variant={getStatusVariant(c.status)}>{c.status}</Badge>
                                </div>
                            </div>
                        ))}
                        {data.top_candidates.length === 0 && (
                            <div className="px-6 py-4 text-sm text-slate-400">No scored candidates yet</div>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
}
