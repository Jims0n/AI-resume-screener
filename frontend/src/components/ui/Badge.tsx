import React from 'react';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface BadgeProps {
    children: React.ReactNode;
    variant?: BadgeVariant;
    className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
    success: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    warning: 'bg-amber-50 text-amber-700 ring-amber-600/20',
    danger: 'bg-red-50 text-red-700 ring-red-600/20',
    info: 'bg-blue-50 text-blue-700 ring-blue-600/20',
    neutral: 'bg-slate-50 text-slate-700 ring-slate-600/20',
};

export function getStatusVariant(status: string): BadgeVariant {
    switch (status) {
        case 'scored': case 'active': return 'success';
        case 'pending': case 'draft': return 'warning';
        case 'rejected': case 'closed': return 'danger';
        case 'processing': case 'shortlisted': return 'info';
        default: return 'neutral';
    }
}

export default function Badge({ children, variant = 'neutral', className = '' }: BadgeProps) {
    return (
        <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${variantStyles[variant]} ${className}`}
        >
            {children}
        </span>
    );
}
