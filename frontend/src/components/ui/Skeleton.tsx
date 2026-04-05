import clsx from 'clsx';

interface SkeletonProps {
    className?: string;
    variant?: 'text' | 'rect' | 'circle';
    width?: string | number;
    height?: string | number;
    lines?: number;
}

export default function Skeleton({
    className,
    variant = 'rect',
    width,
    height,
    lines = 1,
}: SkeletonProps) {
    const baseClasses = 'animate-skeleton bg-[#242424] rounded';

    if (variant === 'circle') {
        return (
            <div
                className={clsx(baseClasses, 'rounded-full', className)}
                style={{ width: width || 40, height: height || width || 40 }}
            />
        );
    }

    if (variant === 'text' && lines > 1) {
        return (
            <div className="space-y-2">
                {Array.from({ length: lines }).map((_, i) => (
                    <div
                        key={i}
                        className={clsx(baseClasses, className)}
                        style={{
                            width: i === lines - 1 ? '60%' : width || '100%',
                            height: height || 16,
                        }}
                    />
                ))}
            </div>
        );
    }

    return (
        <div
            className={clsx(baseClasses, className)}
            style={{ width: width || '100%', height: height || 20 }}
        />
    );
}
