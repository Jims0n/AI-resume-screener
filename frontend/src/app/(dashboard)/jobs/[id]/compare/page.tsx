'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import comparisonService from '@/lib/comparisonService';
import { useToast } from '@/components/ui/Toast';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import type { ComparisonResult } from '@/types';

export default function CompareCandidatesPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const { addToast } = useToast();
    const [result, setResult] = useState<ComparisonResult | null>(null);
    const [loading, setLoading] = useState(true);

    const jobId = parseInt(params.id as string);
    const candidateIds = searchParams.get('candidates')?.split(',').map(Number).filter(Boolean) || [];

    useEffect(() => {
        if (candidateIds.length < 2) {
            addToast('Select at least 2 candidates to compare', 'error');
            router.back();
            return;
        }

        const load = async () => {
            try {
                const data = await comparisonService.compareCandidates(jobId, candidateIds);
                setResult(data);
            } catch {
                addToast('Failed to compare candidates', 'error');
            } finally {
                setLoading(false);
            }
        };
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [jobId]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Spinner size="lg" />
                <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">AI is comparing candidates...</p>
            </div>
        );
    }

    if (!result) return null;

    const skills = Object.keys(result.comparison_matrix);

    return (
        <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Candidate Comparison</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Comparing {result.candidates.length} candidates side by side</p>
                </div>
                <Button variant="secondary" onClick={() => router.back()}>← Back to Rankings</Button>
            </div>

            {/* Score Overview */}
            <div className="grid gap-4 mb-8" style={{ gridTemplateColumns: `repeat(${result.candidates.length}, 1fr)` }}>
                {result.candidates.map((c) => (
                    <Card key={c.id}>
                        <div className="text-center p-4">
                            <div className="w-14 h-14 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3">
                                {c.name?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm truncate">{c.name}</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 truncate">{c.email}</p>
                            <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                                {c.overall_score ?? '—'}
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Overall Score</p>

                            <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                                <div>
                                    <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{c.skill_match_score ?? '—'}</p>
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Skills</p>
                                </div>
                                <div>
                                    <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{c.experience_score ?? '—'}</p>
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Exp</p>
                                </div>
                                <div>
                                    <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{c.education_score ?? '—'}</p>
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Edu</p>
                                </div>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Skills Comparison Matrix */}
            {skills.length > 0 && (
                <Card header={<div className="px-6 py-4"><h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Skill-by-Skill Comparison</h2></div>}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-700">
                                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Skill</th>
                                    {result.candidates.map((c) => (
                                        <th key={c.id} className="text-center px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">{c.name?.split(' ')[0]}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                {skills.map((skill) => (
                                    <tr key={skill}>
                                        <td className="px-6 py-3 text-slate-700 dark:text-slate-300 font-medium">{skill}</td>
                                        {result.candidates.map((c) => {
                                            const match = result.comparison_matrix[skill]?.[String(c.id)];
                                            return (
                                                <td key={c.id} className="text-center px-4 py-3">
                                                    {match?.found ? (
                                                        <div className="flex flex-col items-center gap-0.5">
                                                            <span className="text-[#7c9a72] text-lg">✓</span>
                                                            <Badge variant="success">{match.proficiency}</Badge>
                                                        </div>
                                                    ) : (
                                                        <span className="text-[#c45c5c] text-lg">✗</span>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {/* AI Summary */}
            {result.comparison_summary && (
                <Card className="mt-6">
                    <div className="p-6">
                        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-3">AI Comparison Summary</h2>
                        <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{result.comparison_summary}</p>
                        {result.recommendation && (
                            <div className="mt-4 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                                <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-200 mb-1">⭐ Recommendation</p>
                                <p className="text-sm text-indigo-700 dark:text-indigo-300">{result.recommendation}</p>
                            </div>
                        )}
                    </div>
                </Card>
            )}
        </div>
    );
}
