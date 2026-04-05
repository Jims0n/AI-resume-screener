'use client';
export const runtime = 'edge';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import comparisonService from '@/lib/comparisonService';
import { useToast } from '@/components/ui/Toast';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
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
            <div className="animate-fade-in">
                <div className="mb-8">
                    <Skeleton height={32} width={280} className="mb-2" />
                    <Skeleton height={16} width={200} />
                </div>
                <div className="grid grid-cols-2 gap-4 mb-8">
                    <Skeleton height={220} />
                    <Skeleton height={220} />
                </div>
                <Skeleton height={300} />
            </div>
        );
    }

    if (!result) return null;

    const skills = Object.keys(result.comparison_matrix);

    return (
        <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="font-serif text-3xl tracking-tight text-[#e8e4d9]">Candidate Comparison</h1>
                    <p className="text-[#8a8578] mt-1 font-light text-sm">Comparing {result.candidates.length} candidates side by side</p>
                </div>
                <Button variant="secondary" onClick={() => router.back()}>← Back to Rankings</Button>
            </div>

            {/* Score Overview */}
            <div className="grid gap-4 mb-8" style={{ gridTemplateColumns: `repeat(${result.candidates.length}, 1fr)` }}>
                {result.candidates.map((c) => (
                    <Card key={c.id}>
                        <div className="text-center p-4">
                            <div className="w-14 h-14 bg-[#e8e4d9]/10 text-[#e8e4d9] rounded-full flex items-center justify-center text-xl font-serif mx-auto mb-3">
                                {c.name?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <h3 className="font-semibold text-[#e8e4d9] text-sm truncate">{c.name}</h3>
                            <p className="text-xs text-[#8a8578] mb-3 truncate">{c.email}</p>
                            <div className="text-3xl font-serif text-[#e8e4d9]">
                                {c.overall_score ?? '—'}
                            </div>
                            <p className="text-xs text-[#8a8578] mt-1 uppercase tracking-wider">Overall Score</p>

                            <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                                <div>
                                    <p className="text-lg font-serif text-[#e8e4d9]">{c.skill_match_score ?? '—'}</p>
                                    <p className="text-[10px] text-[#6b6560]">Skills</p>
                                </div>
                                <div>
                                    <p className="text-lg font-serif text-[#e8e4d9]">{c.experience_score ?? '—'}</p>
                                    <p className="text-[10px] text-[#6b6560]">Exp</p>
                                </div>
                                <div>
                                    <p className="text-lg font-serif text-[#e8e4d9]">{c.education_score ?? '—'}</p>
                                    <p className="text-[10px] text-[#6b6560]">Edu</p>
                                </div>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Skills Comparison Matrix */}
            {skills.length > 0 && (
                <Card header={<h2 className="font-serif text-lg text-[#e8e4d9]">Skill-by-Skill Comparison</h2>}>
                    <div className="overflow-x-auto -mx-6">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-[#2a2a2a]">
                                    <th className="text-left px-6 py-3 text-xs font-medium text-[#6b6560] uppercase tracking-wider">Skill</th>
                                    {result.candidates.map((c) => (
                                        <th key={c.id} className="text-center px-4 py-3 text-xs font-medium text-[#6b6560] uppercase tracking-wider">{c.name?.split(' ')[0]}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#2a2a2a]/50">
                                {skills.map((skill) => (
                                    <tr key={skill} className="hover:bg-[#2a2a28] transition-colors">
                                        <td className="px-6 py-3 text-[#e8e4d9] font-medium">{skill}</td>
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
                    <div className="p-2">
                        <h2 className="font-serif text-lg text-[#e8e4d9] mb-3">AI Comparison Summary</h2>
                        <p className="text-sm text-[#e8e4d9]/80 whitespace-pre-wrap leading-relaxed font-light">{result.comparison_summary}</p>
                        {result.recommendation && (
                            <div className="mt-4 p-4 bg-[#2a2820] rounded-lg border border-[#d4c8a0]/20">
                                <p className="text-sm font-semibold text-[#d4c8a0] mb-1">⭐ Recommendation</p>
                                <p className="text-sm text-[#e8e4d9]/80 font-light">{result.recommendation}</p>
                            </div>
                        )}
                    </div>
                </Card>
            )}
        </div>
    );
}
