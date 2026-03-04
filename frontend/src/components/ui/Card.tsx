import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    header?: React.ReactNode;
    footer?: React.ReactNode;
    noPadding?: boolean;
}

export default function Card({ children, className = '', header, footer, noPadding }: CardProps) {
    return (
        <div className={`bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden ${className}`}>
            {header && (
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50">
                    {header}
                </div>
            )}
            <div className={noPadding ? '' : 'p-6'}>{children}</div>
            {footer && (
                <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/50">
                    {footer}
                </div>
            )}
        </div>
    );
}
