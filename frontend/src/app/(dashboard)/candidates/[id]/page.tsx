'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCandidates } from '@/hooks/useCandidates';
import { useToast } from '@/components/ui/Toast';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge, { getStatusVariant } from '@/components/ui/Badge';
import ProgressBar from '@/components/ui/ProgressBar';
import Spinner from '@/components/ui/Spinner';
import {
    RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
    ResponsiveContainer,
} from 'recharts';

export default function CandidateDetailPage() {
    const params = useParams();
    const router = useRouter();
    const candidateId = Number(params.id);
    const { currentCandidate: candidate, fetchCandidate, updateStatus, reprocess, loading } = useCandidates();
    const { addToast } = useToast();

    useEffect(() => {
        fetchCandidate(candidateId);
    }, [candidateId, fetchCandidate]);

    const handleStatusChange = async (status: string) => {
        await updateStatus(candidateId, status);
        fetchCandidate(candidateId);
        addToast(`Candidate ${status}`, 'success');
    };

    const handleReprocess = async () => {
        await reprocess(candidateId);
        addToast('Reprocessing started', 'info');
        fetchCandidate(candidateId);
    };

    if (loading && !candidate) {
        return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
    }

    if (!candidate) {
        return <div className="text-center py-20 text-slate-500">Candidate not found</div>;
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
        expert: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
        advanced: 'bg-blue-50 text-blue-700 ring-blue-600/20',
        intermediate: 'bg-amber-50 text-amber-700 ring-amber-600/20',
        beginner: 'bg-orange-50 text-orange-700 ring-orange-600/20',
        none: 'bg-red-50 text-red-700 ring-red-600/20',
    };

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <button onClick={() => router.back()} className="text-sm text-indigo-600 hover:text-indigo-700 mb-2">
                        ← Back to rankings
                    </button>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-slate-900">{candidate.name}</h1>
                        <Badge variant={getStatusVariant(candidate.status)}>{candidate.status}</Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                        {candidate.email && <span>📧 {candidate.email}</span>}
                        {candidate.phone && <span>📞 {candidate.phone}</span>}
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => handleStatusChange('shortlisted')}>Shortlist</Button>
                    <Button variant="danger" onClick={() => handleStatusChange('rejected')}>Reject</Button>
                    <Button variant="secondary" onClick={handleReprocess}>Reprocess</Button>
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Left Column — Scores */}
                <div className="space-y-6">
                    {/* Overall Score */}
                    <Card>
                        <div className="text-center">
                            <div className="text-5xl font-extrabold text-slate-900 mb-1">{candidate.overall_score ?? '—'}</div>
                            <p className="text-sm text-slate-500">Overall Score</p>
                        </div>
                    </Card>

                    {/* Radar Chart */}
                    <Card header={<h3 className="font-semibold text-slate-700">Score Breakdown</h3>}>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart data={radarData}>
                                    <PolarGrid stroke="#e2e8f0" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fill: '#64748b' }} />
                                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
                                    <Radar name="Score" dataKey="score" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.3} />
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
                                    <p className="text-xs text-slate-500 mb-1">{label}</p>
                                    <ProgressBar value={value ?? 0} size="md" />
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Strengths & Red Flags */}
                    <div className="grid grid-cols-2 gap-4">
                        <Card header={<h3 className="font-semibold text-emerald-700">✓ Strengths</h3>}>
                            <ul className="space-y-2">
                                {candidate.strengths?.map((s, i) => (
                                    <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                                        <span className="text-emerald-500 mt-0.5">•</span>
                                        {s}
                                    </li>
                                ))}
                                {(candidate.strengths?.length || 0) === 0 && <p className="text-sm text-slate-400">None identified</p>}
                            </ul>
                        </Card>
                        <Card header={<h3 className="font-semibold text-red-700">⚠ Red Flags</h3>}>
                            <ul className="space-y-2">
                                {candidate.red_flags?.map((f, i) => (
                                    <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                                        <span className="text-red-500 mt-0.5">•</span>
                                        {f}
                                    </li>
                                ))}
                                {(candidate.red_flags?.length || 0) === 0 && <p className="text-sm text-slate-400">None identified</p>}
                            </ul>
                        </Card>
                    </div>

                    {/* AI Reasoning */}
                    {candidate.scoring_reasoning && (
                        <Card header={<h3 className="font-semibold text-slate-700">🤖 AI Reasoning</h3>}>
                            <p className="text-sm text-slate-600 leading-relaxed">{candidate.scoring_reasoning}</p>
                        </Card>
                    )}
                </div>

                {/* Right Column — Resume Details */}
                <div className="space-y-6">
                    {/* Parsed Data */}
                    {parsed.summary && (
                        <Card header={<h3 className="font-semibold text-slate-700">Summary</h3>}>
                            <p className="text-sm text-slate-600">{parsed.summary}</p>
                        </Card>
                    )}

                    {/* Skills Tags */}
                    {parsed.skills && parsed.skills.length > 0 && (
                        <Card header={<h3 className="font-semibold text-slate-700">Skills</h3>}>
                            <div className="flex flex-wrap gap-2">
                                {parsed.skills.map((s: string) => (
                                    <span key={s} className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full text-xs font-medium">
                                        {s}
                                    </span>
                                ))}
                            </div>
                        </Card>
                    )}

                    {/* Experience */}
                    {parsed.experience && parsed.experience.length > 0 && (
                        <Card header={<h3 className="font-semibold text-slate-700">Experience</h3>}>
                            <div className="space-y-4">
                                {parsed.experience.map((exp: any, i: number) => (
                                    <div key={i} className="border-l-2 border-indigo-200 pl-4">
                                        <p className="text-sm font-semibold text-slate-900">{exp.title}</p>
                                        <p className="text-sm text-slate-600">{exp.company}</p>
                                        <p className="text-xs text-slate-400">{exp.duration}</p>
                                        {exp.highlights?.length > 0 && (
                                            <ul className="mt-1 space-y-0.5">
                                                {exp.highlights.map((h: string, j: number) => (
                                                    <li key={j} className="text-xs text-slate-500">• {h}</li>
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
                        <Card header={<h3 className="font-semibold text-slate-700">Education</h3>}>
                            <div className="space-y-3">
                                {parsed.education.map((edu: any, i: number) => (
                                    <div key={i}>
                                        <p className="text-sm font-semibold text-slate-900">{edu.degree}</p>
                                        <p className="text-sm text-slate-600">{edu.institution}</p>
                                        {edu.year && <p className="text-xs text-slate-400">{edu.year}</p>}
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}

                    {/* Resume Text */}
                    {candidate.resume_text && (
                        <Card header={<h3 className="font-semibold text-slate-700">Resume Text</h3>}>
                            <pre className="text-xs text-slate-600 whitespace-pre-wrap font-mono max-h-96 overflow-y-auto bg-slate-50 p-4 rounded-lg">
                                {candidate.resume_text}
                            </pre>
                        </Card>
                    )}
                </div>
            </div>

            {/* Skill Match Grid */}
            <div className="mt-8">
                <Card header={<h3 className="font-semibold text-slate-700">Skill Match Analysis</h3>} noPadding>
                    {[
                        { title: 'Required Skills', skills: requiredSkills },
                        { title: 'Nice-to-Have Skills', skills: niceSkills },
                    ].map(({ title, skills }) => (
                        skills.length > 0 && (
                            <div key={title}>
                                <div className="px-6 py-3 bg-slate-50 border-b border-slate-100">
                                    <h4 className="text-xs font-semibold text-slate-500 uppercase">{title}</h4>
                                </div>
                                <div className="divide-y divide-slate-100">
                                    {skills.map((sm) => (
                                        <div key={sm.id} className="flex items-center gap-4 px-6 py-3">
                                            <span className={`text-lg ${sm.found ? 'text-emerald-500' : 'text-red-400'}`}>
                                                {sm.found ? '✓' : '✗'}
                                            </span>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-slate-900">{sm.skill_name}</p>
                                                {sm.evidence && <p className="text-xs text-slate-500 mt-0.5">{sm.evidence}</p>}
                                            </div>
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${proficiencyColors[sm.proficiency]}`}>
                                                {sm.proficiency}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    ))}
                </Card>
            </div>
        </div>
    );
}
