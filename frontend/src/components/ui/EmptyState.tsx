import React from 'react';
import Button from './Button';
import { Ghost } from 'lucide-react';

interface EmptyStateProps {
    icon?: React.ReactNode;
    title: string;
    description?: string;
    actionLabel?: string;
    onAction?: () => void;
}

export default function EmptyState({ icon = <Ghost className="w-12 h-12 stroke-sh-text2" />, title, description, actionLabel, onAction }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <span className="mb-4 text-sh-text2">{icon}</span>
            <h3 className="font-serif tracking-tight text-xl text-sh-text mb-1">{title}</h3>
            {description && <p className="text-sm text-sh-text2 font-light mb-6 max-w-sm">{description}</p>}
            {actionLabel && onAction && (
                <Button onClick={onAction}>{actionLabel}</Button>
            )}
        </div>
    );
}
