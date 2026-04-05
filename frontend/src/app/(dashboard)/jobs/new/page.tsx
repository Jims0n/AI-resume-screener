'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useJobs } from '@/hooks/useJobs';
import { useToast } from '@/components/ui/Toast';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Stepper from '@/components/ui/Stepper';
import Slider from '@/components/ui/Slider';
import { jobService } from '@/lib/jobService';

const STEPS = [
    { label: 'Job Details' },
    { label: 'Description' },
    { label: 'Skills & Weights' },
    { label: 'Custom Criteria' },
    { label: 'Confirm' },
];

const DRAFT_KEY = 'job-creation-draft';

interface FormData {
    title: string;
    description: string;
    department: string;
    location: string;
    job_type: string;
    min_experience_years: number;
    requiredSkills: string[];
    niceToHaveSkills: string[];
    skill_weight: number;
    experience_weight: number;
    education_weight: number;
    custom_criteria: { name: string; description: string }[];
}

const defaultFormData: FormData = {
    title: '',
    description: '',
    department: '',
    location: '',
    job_type: 'full-time',
    min_experience_years: 0,
    requiredSkills: [],
    niceToHaveSkills: [],
    skill_weight: 0.5,
    experience_weight: 0.3,
    education_weight: 0.2,
    custom_criteria: [],
};

export default function CreateJobPage() {
    const router = useRouter();
    const { createJob, loading } = useJobs();
    const { addToast } = useToast();

    const [step, setStep] = useState(0);
    const [form, setForm] = useState<FormData>(() => {
        if (typeof window !== 'undefined') {
            try {
                const saved = localStorage.getItem(DRAFT_KEY);
                if (saved) return { ...defaultFormData, ...JSON.parse(saved) };
            } catch { /* ignore */ }
        }

        // Load scoring defaults if available
        try {
            const defaults = localStorage.getItem('default-scoring-weights');
            if (defaults) {
                const parsed = JSON.parse(defaults);
                return { ...defaultFormData, ...parsed };
            }
        } catch { /* ignore */ }

        return defaultFormData;
    });
    const [newSkill, setNewSkill] = useState('');
    const [skillType, setSkillType] = useState<'required' | 'nice'>('required');
    const [newCriterionName, setNewCriterionName] = useState('');
    const [newCriterionDesc, setNewCriterionDesc] = useState('');
    const [jobId, setJobId] = useState<number | null>(null);

    // Auto-save draft
    useEffect(() => {
        try { localStorage.setItem(DRAFT_KEY, JSON.stringify(form)); } catch { /* ignore */ }
    }, [form]);

    const updateForm = (updates: Partial<FormData>) => setForm((prev) => ({ ...prev, ...updates }));

    const weightTotal = form.skill_weight + form.experience_weight + form.education_weight;
    const weightValid = weightTotal <= 1.001;

    // Step 2: Create job with AI skill extraction
    const handleCreateAndExtract = async () => {
        try {
            const job = await createJob({
                title: form.title,
                description: form.description,
                min_experience_years: form.min_experience_years,
            });
            setJobId(job.id);
            updateForm({
                requiredSkills: job.required_skills || [],
                niceToHaveSkills: job.nice_to_have_skills || [],
            });
            setStep(2);
            addToast('Job created! AI extracted skills.', 'success');
        } catch {
            addToast('Failed to create job', 'error');
        }
    };

    const addSkill = () => {
        if (!newSkill.trim()) return;
        if (skillType === 'required') {
            updateForm({ requiredSkills: [...form.requiredSkills, newSkill.trim()] });
        } else {
            updateForm({ niceToHaveSkills: [...form.niceToHaveSkills, newSkill.trim()] });
        }
        setNewSkill('');
    };

    const removeSkill = (skill: string, type: 'required' | 'nice') => {
        if (type === 'required') {
            updateForm({ requiredSkills: form.requiredSkills.filter((s) => s !== skill) });
        } else {
            updateForm({ niceToHaveSkills: form.niceToHaveSkills.filter((s) => s !== skill) });
        }
    };

    const addCriterion = () => {
        if (!newCriterionName.trim()) return;
        updateForm({
            custom_criteria: [...form.custom_criteria, { name: newCriterionName.trim(), description: newCriterionDesc.trim() }],
        });
        setNewCriterionName('');
        setNewCriterionDesc('');
    };

    const removeCriterion = (index: number) => {
        updateForm({ custom_criteria: form.custom_criteria.filter((_, i) => i !== index) });
    };

    const handleFinalize = async () => {
        if (!jobId) return;
        try {
            await jobService.updateJob(jobId, {
                required_skills: form.requiredSkills,
                nice_to_have_skills: form.niceToHaveSkills,
                skill_weight: form.skill_weight,
                experience_weight: form.experience_weight,
                education_weight: form.education_weight,
                custom_criteria: form.custom_criteria,
            });
            localStorage.removeItem(DRAFT_KEY);
            addToast('Job finalized!', 'success');
            router.push(`/jobs/${jobId}/upload`);
        } catch {
            addToast('Failed to save job', 'error');
        }
    };

    const inputClasses = "w-full px-4 py-3 rounded-xl border border-shortlyst-border bg-shortlyst-bg text-shortlyst-text focus:border-shortlyst-accent focus:ring-1 focus:ring-shortlyst-accent/20 outline-none transition-all text-sm placeholder:text-shortlyst-text/30";

    return (
        <div className="max-w-3xl mx-auto animate-fade-in text-shortlyst-text">
            <h1 className="font-serif text-3xl tracking-tight text-shortlyst-text mb-8">Create New Job</h1>

            <Stepper steps={STEPS} currentStep={step} onStepClick={(s) => { if (s <= step) setStep(s); }} />

            {/* Step 1: Job Details */}
            {step === 0 && (
                <Card>
                    <div className="p-6 space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-shortlyst-text/80 mb-1.5">Job Title *</label>
                            <input type="text" value={form.title} onChange={(e) => updateForm({ title: e.target.value })} className={inputClasses} placeholder="e.g. Senior Full-Stack Developer" required />
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-shortlyst-text/80 mb-1.5">Department</label>
                                <input type="text" value={form.department} onChange={(e) => updateForm({ department: e.target.value })} className={inputClasses} placeholder="e.g. Engineering" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-shortlyst-text/80 mb-1.5">Location</label>
                                <input type="text" value={form.location} onChange={(e) => updateForm({ location: e.target.value })} className={inputClasses} placeholder="e.g. Remote, New York" />
                            </div>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-shortlyst-text/80 mb-1.5">Job Type</label>
                                <select value={form.job_type} onChange={(e) => updateForm({ job_type: e.target.value })} className={inputClasses}>
                                    <option value="full-time">Full-time</option>
                                    <option value="part-time">Part-time</option>
                                    <option value="contract">Contract</option>
                                    <option value="internship">Internship</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-shortlyst-text/80 mb-1.5">Min Experience (years)</label>
                                <input type="number" min={0} value={form.min_experience_years} onChange={(e) => updateForm({ min_experience_years: parseInt(e.target.value) || 0 })} className={inputClasses} />
                            </div>
                        </div>
                        <div className="flex justify-end pt-2">
                            <Button onClick={() => { if (form.title.trim()) setStep(1); else addToast('Job title is required', 'error'); }} size="lg">Next: Description →</Button>
                        </div>
                    </div>
                </Card>
            )}

            {/* Step 2: Description */}
            {step === 1 && (
                <Card>
                    <div className="p-6 space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-shortlyst-text/80 mb-1.5">Job Description *</label>
                            <textarea value={form.description} onChange={(e) => updateForm({ description: e.target.value })} rows={14} className={`${inputClasses} resize-none`} placeholder="Paste the full job description here. The AI will automatically extract required skills and evaluate candidates against this description..." required />
                        </div>
                        <div className="flex justify-between pt-2">
                            <Button variant="secondary" onClick={() => setStep(0)}>← Back</Button>
                            <Button onClick={handleCreateAndExtract} loading={loading} size="lg">Create & Extract Skills →</Button>
                        </div>
                    </div>
                </Card>
            )}

            {/* Step 3: Skills & Weights */}
            {step === 2 && (
                <div className="space-y-6">
                    <Card>
                        <div className="p-6">
                            <h2 className="font-serif text-xl tracking-tight text-shortlyst-text mb-1">AI-Extracted Skills</h2>
                            <p className="text-sm text-shortlyst-text/50 font-light mb-6">Review skills extracted by AI. Add, remove, or reclassify.</p>

                            {/* Required */}
                            <div className="mb-6">
                                <h3 className="font-serif text-lg text-shortlyst-text mb-3">Required Skills</h3>
                                <div className="flex flex-wrap gap-2">
                                    {form.requiredSkills.map((skill) => (
                                        <span key={skill} className="inline-flex items-center gap-1 bg-shortlyst-text/5 text-shortlyst-text px-3 py-1.5 rounded-full text-sm border border-shortlyst-border">
                                            {skill}
                                            <button onClick={() => removeSkill(skill, 'required')} className="text-shortlyst-text/40 hover:text-shortlyst-accent ml-1 transition-colors">×</button>
                                        </span>
                                    ))}
                                    {form.requiredSkills.length === 0 && <span className="text-sm text-shortlyst-text/40 font-light">No required skills</span>}
                                </div>
                            </div>

                            {/* Nice-to-have */}
                            <div className="mb-6">
                                <h3 className="font-serif text-lg text-shortlyst-text mb-3">Nice-to-Have Skills</h3>
                                <div className="flex flex-wrap gap-2">
                                    {form.niceToHaveSkills.map((skill) => (
                                        <span key={skill} className="inline-flex items-center gap-1 bg-transparent text-shortlyst-text px-3 py-1.5 rounded-full text-sm border border-shortlyst-text/20">
                                            {skill}
                                            <button onClick={() => removeSkill(skill, 'nice')} className="text-shortlyst-text/40 hover:text-shortlyst-accent ml-1 transition-colors">×</button>
                                        </span>
                                    ))}
                                    {form.niceToHaveSkills.length === 0 && <span className="text-sm text-shortlyst-text/40 font-light">No nice-to-have skills</span>}
                                </div>
                            </div>

                            {/* Add skill */}
                            <div className="flex gap-2">
                                <select value={skillType} onChange={(e) => setSkillType(e.target.value as 'required' | 'nice')} className={`${inputClasses} w-28 sm:w-32 shrink-0`}>
                                    <option value="required">Required</option>
                                    <option value="nice">Nice-to-Have</option>
                                </select>
                                <input type="text" value={newSkill} onChange={(e) => setNewSkill(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }} className={`flex-1 min-w-0 ${inputClasses}`} placeholder="Add a skill..." />
                                <Button variant="secondary" onClick={addSkill}>Add</Button>
                            </div>
                        </div>
                    </Card>

                    {/* Scoring Weights */}
                    <Card>
                        <div className="p-6 space-y-5">
                            <div>
                                <h2 className="font-serif text-xl tracking-tight text-shortlyst-text mb-1">Scoring Weights</h2>
                                <p className="text-sm text-shortlyst-text/50 font-light">Adjust how much each factor contributes to the overall score.</p>
                            </div>
                            <Slider label="Skill Match" value={form.skill_weight} onChange={(v) => updateForm({ skill_weight: v })} />
                            <Slider label="Experience" value={form.experience_weight} onChange={(v) => updateForm({ experience_weight: v })} />
                            <Slider label="Education" value={form.education_weight} onChange={(v) => updateForm({ education_weight: v })} />
                            <div className={`flex items-center justify-between p-4 rounded-xl border border-shortlyst-border transition-colors ${weightValid ? 'bg-shortlyst-text/5' : 'bg-red-900/20 border-red-900/50'}`}>
                                <span className="text-sm font-medium text-shortlyst-text/80">Total</span>
                                <span className={`text-sm font-serif ${weightValid ? 'text-sh-text' : 'text-[#c45c5c]'}`}>{Math.round(weightTotal * 100)}%</span>
                            </div>
                        </div>
                    </Card>

                    <div className="flex justify-between">
                        <Button variant="secondary" onClick={() => setStep(1)}>← Back</Button>
                        <Button onClick={() => { if (weightValid) setStep(3); else addToast('Fix weight total', 'error'); }} size="lg">Next: Custom Criteria →</Button>
                    </div>
                </div>
            )}

            {/* Step 4: Custom Criteria */}
            {step === 3 && (
                <Card>
                    <div className="p-6 space-y-5">
                        <div>
                            <h2 className="font-serif text-xl tracking-tight text-shortlyst-text mb-1">Custom Evaluation Criteria</h2>
                            <p className="text-sm text-shortlyst-text/50 font-light">Add criteria beyond skills, experience, and education (optional).</p>
                        </div>

                        {form.custom_criteria.length > 0 && (
                            <div className="space-y-2">
                                {form.custom_criteria.map((c, i) => (
                                    <div key={i} className="flex items-start gap-3 p-4 border border-shortlyst-border bg-shortlyst-text/5 rounded-xl">
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-shortlyst-text">{c.name}</p>
                                            {c.description && <p className="text-xs text-shortlyst-text/60 font-light mt-1">{c.description}</p>}
                                        </div>
                                        <button onClick={() => removeCriterion(i)} className="text-[#c45c5c] hover:opacity-80 text-sm">Remove</button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="space-y-4 border-t border-shortlyst-border pt-6">
                            <input type="text" value={newCriterionName} onChange={(e) => setNewCriterionName(e.target.value)} className={inputClasses} placeholder="Criterion name (e.g. Leadership experience)" />
                            <input type="text" value={newCriterionDesc} onChange={(e) => setNewCriterionDesc(e.target.value)} className={inputClasses} placeholder="Description (optional)" />
                            <Button variant="secondary" onClick={addCriterion}>+ Add Criterion</Button>
                        </div>

                        <div className="flex justify-between pt-2">
                            <Button variant="secondary" onClick={() => setStep(2)}>← Back</Button>
                            <Button onClick={() => setStep(4)} size="lg">Next: Review →</Button>
                        </div>
                    </div>
                </Card>
            )}

            {/* Step 5: Confirmation */}
            {step === 4 && (
                <Card>
                    <div className="p-6 space-y-8">
                        <h2 className="font-serif text-xl tracking-tight text-shortlyst-text">Review & Confirm</h2>

                        <div className="space-y-4">
                            <div className="grid sm:grid-cols-2 gap-6 bg-shortlyst-text/5 p-5 rounded-2xl border border-shortlyst-border">
                                <div>
                                    <p className="text-xs font-medium text-shortlyst-text/50 uppercase tracking-wider mb-1">Title</p>
                                    <p className="text-base font-serif text-shortlyst-text">{form.title}</p>
                                </div>
                                {form.department && (
                                    <div>
                                        <p className="text-xs font-medium text-shortlyst-text/50 uppercase tracking-wider mb-1">Department</p>
                                        <p className="text-sm text-shortlyst-text/80">{form.department}</p>
                                    </div>
                                )}
                                {form.location && (
                                    <div>
                                        <p className="text-xs font-medium text-shortlyst-text/50 uppercase tracking-wider mb-1">Location</p>
                                        <p className="text-sm text-shortlyst-text/80">{form.location}</p>
                                    </div>
                                )}
                                <div>
                                    <p className="text-xs font-medium text-shortlyst-text/50 uppercase tracking-wider mb-1">Type</p>
                                    <p className="text-sm text-shortlyst-text/80 capitalize">{form.job_type}</p>
                                </div>
                            </div>

                            <div>
                                <p className="text-xs font-medium text-shortlyst-text/50 uppercase tracking-wider mb-3">Required Skills ({form.requiredSkills.length})</p>
                                <div className="flex flex-wrap gap-2">
                                    {form.requiredSkills.map((s) => (
                                        <span key={s} className="bg-shortlyst-text/5 border border-shortlyst-border text-shortlyst-text px-3 py-1 rounded-full text-xs">{s}</span>
                                    ))}
                                </div>
                            </div>

                            {form.niceToHaveSkills.length > 0 && (
                                <div>
                                    <p className="text-xs font-medium text-shortlyst-text/50 uppercase tracking-wider mb-3">Nice-to-Have ({form.niceToHaveSkills.length})</p>
                                    <div className="flex flex-wrap gap-2">
                                        {form.niceToHaveSkills.map((s) => (
                                            <span key={s} className="bg-transparent border border-shortlyst-text/20 text-shortlyst-text px-3 py-1 rounded-full text-xs">{s}</span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div>
                                <p className="text-xs font-medium text-shortlyst-text/50 uppercase tracking-wider mb-3">Scoring Weights</p>
                                <div className="flex gap-6 text-sm">
                                    <span className="text-shortlyst-text/80">Skills: <strong className="text-shortlyst-text font-serif">{Math.round(form.skill_weight * 100)}%</strong></span>
                                    <span className="text-shortlyst-text/80">Experience: <strong className="text-shortlyst-text font-serif">{Math.round(form.experience_weight * 100)}%</strong></span>
                                    <span className="text-shortlyst-text/80">Education: <strong className="text-shortlyst-text font-serif">{Math.round(form.education_weight * 100)}%</strong></span>
                                </div>
                            </div>

                            {form.custom_criteria.length > 0 && (
                                <div>
                                    <p className="text-xs font-medium text-shortlyst-text/50 uppercase tracking-wider mb-3">Custom Criteria ({form.custom_criteria.length})</p>
                                    {form.custom_criteria.map((c, i) => (
                                        <p key={i} className="text-sm text-shortlyst-text/80 font-light">• {c.name}</p>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex justify-between pt-6 border-t border-shortlyst-border">
                            <Button variant="secondary" onClick={() => setStep(3)}>← Back</Button>
                            <Button onClick={handleFinalize} loading={loading} size="lg">Finalize & Upload Resumes →</Button>
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );
}
