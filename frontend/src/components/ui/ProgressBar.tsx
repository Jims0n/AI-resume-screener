interface ProgressBarProps {
    value: number;
    max?: number;
    showLabel?: boolean;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

function getColor(value: number): string {
    if (value >= 70) return 'bg-[#7c9a72]';
    if (value >= 40) return 'bg-[#b8a855]';
    return 'bg-[#c45c5c]';
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
            <div className={`flex-1 bg-[#1a1a1a] rounded-full overflow-hidden ${heights[size]}`}>
                <div
                    className={`${getColor(value)} ${heights[size]} rounded-full transition-all duration-500 ease-out`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
            {showLabel && (
                <span className="text-xs font-semibold text-sh-text2 w-10 text-right tabular-nums">
                    {Math.round(value)}
                </span>
            )}
        </div>
    );
}
