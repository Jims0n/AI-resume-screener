'use client';

import { useState, useCallback } from 'react';

interface UseMultiStepFormOptions {
    totalSteps: number;
    draftKey?: string; // localStorage key for draft persistence
}

export function useMultiStepForm<T extends Record<string, unknown>>({
    totalSteps,
    draftKey,
}: UseMultiStepFormOptions) {
    const [currentStep, setCurrentStep] = useState(0);
    const [formData, setFormData] = useState<Partial<T>>(() => {
        if (draftKey && typeof window !== 'undefined') {
            try {
                const saved = localStorage.getItem(draftKey);
                return saved ? JSON.parse(saved) : {};
            } catch {
                return {};
            }
        }
        return {};
    });

    const updateFormData = useCallback(
        (updates: Partial<T>) => {
            setFormData((prev) => {
                const next = { ...prev, ...updates };
                if (draftKey) {
                    try {
                        localStorage.setItem(draftKey, JSON.stringify(next));
                    } catch {
                        // Ignore localStorage errors
                    }
                }
                return next;
            });
        },
        [draftKey]
    );

    const nextStep = useCallback(() => {
        setCurrentStep((prev) => Math.min(prev + 1, totalSteps - 1));
    }, [totalSteps]);

    const prevStep = useCallback(() => {
        setCurrentStep((prev) => Math.max(prev - 1, 0));
    }, []);

    const goToStep = useCallback(
        (step: number) => {
            if (step >= 0 && step < totalSteps) {
                setCurrentStep(step);
            }
        },
        [totalSteps]
    );

    const clearDraft = useCallback(() => {
        if (draftKey) {
            localStorage.removeItem(draftKey);
        }
        setFormData({});
        setCurrentStep(0);
    }, [draftKey]);

    const isFirstStep = currentStep === 0;
    const isLastStep = currentStep === totalSteps - 1;

    return {
        currentStep,
        formData,
        updateFormData,
        nextStep,
        prevStep,
        goToStep,
        clearDraft,
        isFirstStep,
        isLastStep,
        totalSteps,
    };
}
