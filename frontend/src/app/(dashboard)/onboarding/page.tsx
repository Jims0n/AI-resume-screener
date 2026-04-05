'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Button from '@/components/ui/Button';
import Stepper from '@/components/ui/Stepper';
import ConfettiCelebration from '@/components/ui/ConfettiCelebration';

const steps = [
    { label: 'Welcome' },
    { label: 'Organization' },
    { label: 'First Job' },
    { label: 'Ready!' },
];

export default function OnboardingPage() {
    const router = useRouter();
    const { user } = useAuthStore();
    const [currentStep, setCurrentStep] = useState(0);
    const [showConfetti, setShowConfetti] = useState(false);

    const next = () => {
        if (currentStep < steps.length - 1) {
            const nextStep = currentStep + 1;
            setCurrentStep(nextStep);
            if (nextStep === steps.length - 1) {
                setShowConfetti(true);
                localStorage.setItem('onboarding_completed', 'true');
            }
        }
    };

    const goToDashboard = () => {
        router.push('/dashboard');
    };

    const goToCreateJob = () => {
        router.push('/jobs/new');
    };

    return (
        <div className="max-w-2xl mx-auto py-12 px-4 animate-fade-in">
            <ConfettiCelebration trigger={showConfetti} onComplete={() => setShowConfetti(false)} />

            {/* Stepper */}
            <div className="mb-12">
                <Stepper steps={steps} currentStep={currentStep} />
            </div>

            {/* Step Content */}
            <div className="bg-shortlyst-bg rounded-3xl border border-shortlyst-border p-8 md:p-12 shadow-2xl">
                {currentStep === 0 && (
                    <div className="text-center">
                        <div className="text-6xl mb-6">✨</div>
                        <h1 className="font-serif text-4xl text-shortlyst-text mb-4">
                            Welcome{user?.username ? `, ${user.username}` : ''}.
                        </h1>
                        <p className="text-shortlyst-text/60 text-lg mb-10 max-w-md mx-auto leading-relaxed font-light">
                            Let&apos;s get you set up with shortlyst. It only takes a moment to refine your talent discovery.
                        </p>
                        <div className="grid grid-cols-3 gap-4 mb-8 max-w-sm mx-auto">
                            {[
                                { icon: '📄', label: 'Upload resumes' },
                                { icon: '🤖', label: 'AI scores them' },
                                { icon: '🏆', label: 'See top talent' },
                            ].map((item) => (
                                <div key={item.label} className="text-center">
                                    <div className="text-2xl mb-1">{item.icon}</div>
                                    <p className="text-xs text-[#8a8578]">{item.label}</p>
                                </div>
                            ))}
                        </div>
                        <Button size="lg" onClick={next}>
                            Get Started →
                        </Button>
                    </div>
                )}

                {currentStep === 1 && (
                    <div>
                        <div className="text-center mb-8">
                            <div className="text-5xl mb-4">🏢</div>
                            <h2 className="font-serif text-2xl text-[#e8e4d9] mb-2">
                                Your Organization
                            </h2>
                            <p className="text-[#8a8578] font-light">
                                Your workspace has been set up automatically. You can customize it later in Settings.
                            </p>
                        </div>

                        <div className="bg-[#1a1a1a] rounded-xl p-6 mb-6 space-y-4 border border-[#2a2a2a]">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-[#8a8578]">Organization</span>
                                <span className="text-sm text-[#e8e4d9]">
                                    {user?.company || user?.username || 'Your Company'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-[#8a8578]">Your Role</span>
                                <span className="text-sm text-[#e8e4d9] font-medium">Owner</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-[#8a8578]">Team Members</span>
                                <span className="text-sm text-[#8a8578]">Invite from Settings</span>
                            </div>
                        </div>

                        <div className="bg-[#2a2820] rounded-xl p-4 mb-8 border border-[#d4c8a0]/20">
                            <p className="text-sm text-[#d4c8a0]">
                                💡 <strong>Tip:</strong> You can invite team members, customize scoring weights, and create email templates in the Settings page.
                            </p>
                        </div>

                        <div className="flex justify-between">
                            <Button variant="ghost" onClick={() => setCurrentStep(0)}>← Back</Button>
                            <Button size="lg" onClick={next}>Continue →</Button>
                        </div>
                    </div>
                )}

                {currentStep === 2 && (
                    <div>
                        <div className="text-center mb-8">
                            <div className="text-5xl mb-4">💼</div>
                            <h2 className="font-serif text-2xl text-[#e8e4d9] mb-2">
                                Create Your First Job
                            </h2>
                            <p className="text-[#8a8578] font-light">
                                Jobs are how you organize your recruitment pipeline. Create one to start screening resumes.
                            </p>
                        </div>

                        <div className="space-y-4 mb-8">
                            {[
                                { step: '1', title: 'Create a Job', desc: 'Add a title, department, and paste a job description' },
                                { step: '2', title: 'AI Extracts Skills', desc: 'Our AI reads your description and identifies required skills' },
                                { step: '3', title: 'Upload Resumes', desc: 'Drag & drop PDFs or DOCX files for instant AI scoring' },
                                { step: '4', title: 'Review Rankings', desc: 'See candidates ranked by fit with detailed skill breakdowns' },
                            ].map((item) => (
                                <div key={item.step} className="flex gap-4 items-start">
                                    <div className="w-8 h-8 rounded-full bg-[#e8e4d9]/10 text-[#e8e4d9] flex items-center justify-center text-sm font-bold flex-shrink-0">
                                        {item.step}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-[#e8e4d9]">{item.title}</p>
                                        <p className="text-sm text-[#8a8578] font-light">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-between">
                            <Button variant="ghost" onClick={() => setCurrentStep(1)}>← Back</Button>
                            <Button size="lg" onClick={next}>Continue →</Button>
                        </div>
                    </div>
                )}

                {currentStep === 3 && (
                    <div className="text-center">
                        <div className="text-6xl mb-6">🎉</div>
                        <h2 className="font-serif text-3xl text-[#e8e4d9] mb-3">
                            You&apos;re All Set!
                        </h2>
                        <p className="text-[#8a8578] text-lg mb-8 max-w-md mx-auto font-light">
                            Your account is ready. Start by creating your first job or explore the dashboard.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Button size="lg" onClick={goToCreateJob}>
                                Create First Job →
                            </Button>
                            <Button variant="secondary" size="lg" onClick={goToDashboard}>
                                Go to Dashboard
                            </Button>
                        </div>

                        <div className="mt-8 text-xs text-[#6b6560]">
                            You can revisit these tips anytime from the Help menu.
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
