'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/Toast';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Slider from '@/components/ui/Slider';

const STORAGE_KEY = 'default-scoring-weights';

interface ScoringDefaults {
    skill_weight: number;
    experience_weight: number;
    education_weight: number;
}

export default function ScoringDefaultsPage() {
    const { addToast } = useToast();
    const [weights, setWeights] = useState<ScoringDefaults>({
        skill_weight: 0.5,
        experience_weight: 0.3,
        education_weight: 0.2,
    });

    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) setWeights(JSON.parse(saved));
        } catch { /* ignore */ }
    }, []);

    const total = weights.skill_weight + weights.experience_weight + weights.education_weight;
    const isValid = total <= 1.001; // Allow floating point tolerance

    const handleSave = () => {
        if (!isValid) {
            addToast('Weights must sum to 100% or less', 'error');
            return;
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(weights));
        addToast('Scoring defaults saved', 'success');
    };

    return (
        <div className="max-w-2xl">
            <Card>
                <div className="p-6 space-y-6">
                    <div>
                        <h2 className="font-serif tracking-tight text-xl text-[#e8e4d9] mb-1">Default Scoring Weights</h2>
                        <p className="text-sm text-[#8a8578] font-light">
                            Set default weights for new jobs. These can be customized per job during creation.
                        </p>
                    </div>

                    <div className="space-y-6">
                        <Slider
                            label="Skill Match Weight"
                            value={weights.skill_weight}
                            onChange={(v) => setWeights({ ...weights, skill_weight: v })}
                        />
                        <Slider
                            label="Experience Weight"
                            value={weights.experience_weight}
                            onChange={(v) => setWeights({ ...weights, experience_weight: v })}
                        />
                        <Slider
                            label="Education Weight"
                            value={weights.education_weight}
                            onChange={(v) => setWeights({ ...weights, education_weight: v })}
                        />
                    </div>

                    {/* Total indicator */}
                    <div className={`flex items-center justify-between p-3 rounded-lg ${isValid ? 'bg-[#2d3a2d] border border-[#7c9a72]/20' : 'bg-[#3a2020] border border-[#c45c5c]/20'
                        }`}>
                        <span className="text-sm font-medium text-[#e8e4d9]">Total</span>
                        <span className={`text-sm font-bold font-serif ${isValid ? 'text-[#7c9a72]' : 'text-[#c45c5c]'}`}>
                            {Math.round(total * 100)}%
                        </span>
                    </div>
                    {!isValid && (
                        <p className="text-sm text-[#c45c5c]">Weights must sum to 100% or less.</p>
                    )}

                    {/* Preview */}
                    <div className="border-t border-[#2a2a2a] pt-4">
                        <p className="text-xs text-[#6b6560] mb-3 font-medium uppercase tracking-wider">Scoring Preview</p>
                        <div className="space-y-2">
                            {[
                                { label: 'Skills', value: weights.skill_weight, color: 'bg-[#e8e4d9]' },
                                { label: 'Experience', value: weights.experience_weight, color: 'bg-[#b8a855]' },
                                { label: 'Education', value: weights.education_weight, color: 'bg-[#7c9a72]' },
                            ].map((item) => (
                                <div key={item.label} className="flex items-center gap-3">
                                    <span className="text-xs text-[#8a8578] w-20">{item.label}</span>
                                    <div className="flex-1 h-3 bg-[#1a1a1a] rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${item.color} rounded-full transition-all duration-300`}
                                            style={{ width: `${item.value * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <Button onClick={handleSave} disabled={!isValid}>Save Defaults</Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}
