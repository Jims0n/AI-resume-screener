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
        <div className={`bg-sh-bg2 rounded-xl shadow-sm border border-sh-border overflow-hidden ${className}`}>
            {header && (
                <div className="px-6 py-4 border-b border-sh-border bg-sh-bg3">
                    {header}
                </div>
            )}
            <div className={noPadding ? '' : 'p-6'}>{children}</div>
            {footer && (
                <div className="px-6 py-4 border-t border-sh-border bg-sh-bg3">
                    {footer}
                </div>
            )}
        </div>
    );
}
