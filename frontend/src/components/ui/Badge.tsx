import React from 'react';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'shortlisted' | 'neutral';

interface BadgeProps {
    children: React.ReactNode;
    variant?: BadgeVariant | string;
    className?: string;
}

const variantStyles: Record<string, string> = {
    success: 'bg-[#2d3a2d] text-[#7c9a72]',
    warning: 'bg-[#3a3520] text-[#b8a855]',
    danger: 'bg-[#3a2020] text-[#c45c5c]',
    info: 'bg-[#1e2a3a] text-[#6b8ab5]',
    shortlisted: 'bg-[#2a2820] text-[#d4c8a0]',
    neutral: 'bg-[#2a2a2a] text-[#8a8578]',
};

export function getStatusVariant(status: string | undefined | null): BadgeVariant {
    if (!status) return 'neutral';
    switch (status.toLowerCase()) {
        case 'scored': case 'active': return 'success';
        case 'pending': case 'draft': return 'warning';
        case 'rejected': case 'closed': return 'danger';
        case 'processing': return 'info';
        case 'shortlisted': return 'shortlisted';
        default: return 'neutral';
    }
}

export default function Badge({ children, variant = 'neutral', className = '' }: BadgeProps) {
    return (
        <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${variantStyles[variant] || variantStyles.neutral} ${className}`}
        >
            {children}
        </span>
    );
}
