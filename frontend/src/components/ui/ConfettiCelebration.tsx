'use client';

import { useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';

interface ConfettiCelebrationProps {
    trigger: boolean;
    onComplete?: () => void;
}

export default function ConfettiCelebration({ trigger, onComplete }: ConfettiCelebrationProps) {
    const fire = useCallback(() => {
        const duration = 2000;
        const end = Date.now() + duration;

        const frame = () => {
            confetti({
                particleCount: 3,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'],
            });
            confetti({
                particleCount: 3,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'],
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            } else {
                onComplete?.();
            }
        };

        frame();
    }, [onComplete]);

    useEffect(() => {
        if (trigger) {
            fire();
        }
    }, [trigger, fire]);

    return null;
}
