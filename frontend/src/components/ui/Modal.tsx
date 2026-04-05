'use client';

import { useEffect } from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    size?: 'sm' | 'md' | 'lg';
}

const sizeStyles = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
};

export default function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            document.addEventListener('keydown', handleEsc);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleEsc);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />
            <div className={`relative bg-[#242424] rounded-xl shadow-2xl border border-[#2a2a2a] ${sizeStyles[size]} w-full mx-4 animate-modal-in`}>
                {title && (
                    <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2a2a]">
                        <h3 className="text-lg font-serif text-[#e8e4d9]">{title}</h3>
                        <button onClick={onClose} className="text-[#6b6560] hover:text-[#e8e4d9] transition-colors text-xl">&times;</button>
                    </div>
                )}
                <div className="p-6">{children}</div>
            </div>
        </div>
    );
}
