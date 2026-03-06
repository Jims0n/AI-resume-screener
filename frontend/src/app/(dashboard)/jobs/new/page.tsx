'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useJobs } from '@/hooks/useJobs';
import { useToast } from '@/components/ui/Toast';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

export default function CreateJobPage() {
    const router = useRouter();
    const { createJob, loading } = useJobs();
    const { addToast } = useToast();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [step, setStep] = useState<'input' | 'skills'>('input');
    const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
    const [niceToHaveSkills, setNiceToHaveSkills] = useState<string[]>([]);
    const [newSkill, setNewSkill] = useState('');
    const [skillType, setSkillType] = useState<'required' | 'nice'>('required');
    const [jobId, setJobId] = useState<number | null>(null);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const job = await createJob({ title, description });
            setJobId(job.id);
            setRequiredSkills(job.required_skills || []);
            setNiceToHaveSkills(job.nice_to_have_skills || []);
            setStep('skills');
            addToast('Job created! AI extracted skills.', 'success');
        } catch {
            addToast('Failed to create job', 'error');
        }
    };

    const addSkill = () => {
        if (!newSkill.trim()) return;
        if (skillType === 'required') {
            setRequiredSkills((prev) => [...prev, newSkill.trim()]);
        } else {
            setNiceToHaveSkills((prev) => [...prev, newSkill.trim()]);
        }
        setNewSkill('');
    };

    const removeSkill = (skill: string, type: 'required' | 'nice') => {
        if (type === 'required') {
            setRequiredSkills((prev) => prev.filter((s) => s !== skill));
        } else {
            setNiceToHaveSkills((prev) => prev.filter((s) => s !== skill));
        }
    };

    const handleSaveAndUpload = async () => {
        if (jobId) {
            try {
                const { jobService } = await import('@/lib/jobService');
                await jobService.updateJob(jobId, {
                    required_skills: requiredSkills,
                    nice_to_have_skills: niceToHaveSkills,
                });
                addToast('Skills updated!', 'success');
                router.push(`/jobs/${jobId}/upload`);
            } catch {
                addToast('Failed to update skills', 'error');
            }
        }
    };

    return (
        <div className="max-w-3xl mx-auto animate-fade-in">
            <h1 className="text-2xl font-bold text-slate-900 mb-8">Create New Job</h1>

            {step === 'input' ? (
                <Card>
                    <form onSubmit={handleCreate} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Job Title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-sm"
                                placeholder="e.g. Senior Full-Stack Developer"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Job Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={12}
                                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-sm resize-none"
                                placeholder="Paste the full job description here. The AI will automatically extract required skills..."
                                required
                            />
                        </div>
                        <Button type="submit" loading={loading} size="lg">
                            Create Job & Extract Skills
                        </Button>
                    </form>
                </Card>
            ) : (
                <div className="space-y-6">
                    <Card header={<h2 className="text-lg font-semibold text-slate-900">AI-Extracted Skills</h2>}>
                        <p className="text-sm text-slate-500 mb-6">
                            Review the skills extracted by AI. You can add, remove, or toggle skills between categories.
                        </p>

                        {/* Required Skills */}
                        <div className="mb-6">
                            <h3 className="text-sm font-semibold text-slate-700 mb-3">Required Skills</h3>
                            <div className="flex flex-wrap gap-2">
                                {requiredSkills.map((skill) => (
                                    <span
                                        key={skill}
                                        className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full text-sm font-medium ring-1 ring-indigo-100"
                                    >
                                        {skill}
                                        <button
                                            onClick={() => removeSkill(skill, 'required')}
                                            className="text-indigo-400 hover:text-indigo-700 ml-1"
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                                {requiredSkills.length === 0 && (
                                    <span className="text-sm text-slate-400">No required skills yet</span>
                                )}
                            </div>
                        </div>

                        {/* Nice-to-Have Skills */}
                        <div className="mb-6">
                            <h3 className="text-sm font-semibold text-slate-700 mb-3">Nice-to-Have Skills</h3>
                            <div className="flex flex-wrap gap-2">
                                {niceToHaveSkills.map((skill) => (
                                    <span
                                        key={skill}
                                        className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 px-3 py-1.5 rounded-full text-sm font-medium ring-1 ring-purple-100"
                                    >
                                        {skill}
                                        <button
                                            onClick={() => removeSkill(skill, 'nice')}
                                            className="text-purple-400 hover:text-purple-700 ml-1"
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                                {niceToHaveSkills.length === 0 && (
                                    <span className="text-sm text-slate-400">No nice-to-have skills yet</span>
                                )}
                            </div>
                        </div>

                        {/* Add new skill */}
                        <div className="flex gap-2">
                            <select
                                value={skillType}
                                onChange={(e) => setSkillType(e.target.value as 'required' | 'nice')}
                                className="px-3 py-2 rounded-lg border border-slate-300 text-sm"
                            >
                                <option value="required">Required</option>
                                <option value="nice">Nice-to-Have</option>
                            </select>
                            <input
                                type="text"
                                value={newSkill}
                                onChange={(e) => setNewSkill(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                                className="flex-1 px-4 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-sm"
                                placeholder="Add a skill..."
                            />
                            <Button variant="secondary" onClick={addSkill}>
                                Add
                            </Button>
                        </div>
                    </Card>

                    <div className="flex gap-3">
                        <Button onClick={handleSaveAndUpload} size="lg">
                            Save & Upload Resumes →
                        </Button>
                        <Button variant="secondary" onClick={() => router.push('/dashboard')} size="lg">
                            Save & Go to Dashboard
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
