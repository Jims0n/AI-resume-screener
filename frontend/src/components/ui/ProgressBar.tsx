interface ProgressBarProps {
    value: number;
    max?: number;
    showLabel?: boolean;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

function getColor(value: number): string {
    if (value >= 70) return 'bg-emerald-500';
    if (value >= 40) return 'bg-amber-500';
    return 'bg-red-500';
}

export default function ProgressBar({
    value,
    max = 100,
    showLabel = true,
    size = 'md',
    className = '',
}: ProgressBarProps) {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
    const heights = { sm: 'h-1.5', md: 'h-2.5', lg: 'h-4' };

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <div className={`flex-1 bg-slate-100 rounded-full overflow-hidden ${heights[size]}`}>
                <div
                    className={`${getColor(value)} ${heights[size]} rounded-full transition-all duration-500 ease-out`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
            {showLabel && (
                <span className="text-xs font-semibold text-slate-600 w-10 text-right">
                    {Math.round(value)}
                </span>
            )}
        </div>
    );
}
