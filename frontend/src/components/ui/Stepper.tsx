import clsx from 'clsx';

interface Step {
    label: string;
    description?: string;
}

interface StepperProps {
    steps: Step[];
    currentStep: number;
    onStepClick?: (step: number) => void;
}

export default function Stepper({ steps, currentStep, onStepClick }: StepperProps) {
    return (
        <nav aria-label="Progress" className="mb-8">
            <ol className="flex items-center">
                {steps.map((step, index) => {
                    const isCompleted = index < currentStep;
                    const isCurrent = index === currentStep;
                    const isClickable = onStepClick && index <= currentStep;

                    return (
                        <li key={step.label} className={clsx('relative', index < steps.length - 1 && 'flex-1')}>
                            <div className="flex items-center">
                                <button
                                    onClick={() => isClickable && onStepClick(index)}
                                    disabled={!isClickable}
                                    className={clsx(
                                        'relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-all duration-200',
                                        isCompleted && 'bg-[#e8e4d9] text-[#1a1a1a]',
                                        isCurrent && 'border-2 border-[#e8e4d9] bg-[#1a1a1a] text-[#e8e4d9]',
                                        !isCompleted && !isCurrent && 'border-2 border-[#3a3a3a] bg-[#1a1a1a] text-[#6b6560]',
                                        isClickable && 'cursor-pointer hover:ring-2 hover:ring-[#e8e4d9]/20'
                                    )}
                                >
                                    {isCompleted ? (
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    ) : (
                                        index + 1
                                    )}
                                </button>

                                {index < steps.length - 1 && (
                                    <div
                                        className={clsx(
                                            'flex-1 h-0.5 mx-2 transition-colors duration-200',
                                            isCompleted ? 'bg-[#e8e4d9]' : 'bg-[#2a2a2a]'
                                        )}
                                    />
                                )}
                            </div>

                            <div className="mt-1.5 hidden sm:block">
                                <p className={clsx(
                                    'text-xs font-medium',
                                    isCurrent ? 'text-[#e8e4d9]' : isCompleted ? 'text-[#e8e4d9]' : 'text-[#6b6560]'
                                )}>
                                    {step.label}
                                </p>
                            </div>
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}
