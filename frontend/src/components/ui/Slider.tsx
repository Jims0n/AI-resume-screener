'use client';

interface SliderProps {
    label: string;
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
    suffix?: string;
    className?: string;
}

export default function Slider({
    label,
    value,
    onChange,
    min = 0,
    max = 1,
    step = 0.05,
    suffix = '%',
    className = '',
}: SliderProps) {
    const displayValue = suffix === '%' ? Math.round(value * 100) : value;

    return (
        <div className={className}>
            <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-[#8a8578]">{label}</label>
                <span className="text-sm font-semibold text-[#e8e4d9] tabular-nums font-serif">
                    {displayValue}{suffix}
                </span>
            </div>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value))}
                className="w-full h-2 bg-[#2a2a2a] rounded-lg appearance-none cursor-pointer accent-[#e8e4d9]"
            />
        </div>
    );
}
