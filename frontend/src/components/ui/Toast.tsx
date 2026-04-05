'use client';

import { useEffect, useState, createContext, useContext, useCallback } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
    id: number;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    addToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType>({ addToast: () => { } });

export const useToast = () => useContext(ToastContext);

let toastId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((message: string, type: ToastType = 'info') => {
        const id = ++toastId;
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 4000);
    }, []);

    const typeStyles: Record<ToastType, string> = {
        success: 'bg-[#2d3a2d] text-[#7c9a72] border border-[#7c9a72]/20',
        error: 'bg-[#3a2020] text-[#c45c5c] border border-[#c45c5c]/20',
        info: 'bg-[#1e2a3a] text-[#6b8ab5] border border-[#6b8ab5]/20',
    };

    const icons: Record<ToastType, string> = {
        success: '✓',
        error: '✕',
        info: 'ℹ',
    };

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        className={`${typeStyles[t.type]} px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 min-w-[300px] animate-slide-in backdrop-blur-sm`}
                    >
                        <span className="font-bold text-sm">{icons[t.type]}</span>
                        <span className="text-sm">{t.message}</span>
                        <button
                            className="ml-auto opacity-60 hover:opacity-100 transition-opacity"
                            onClick={() => setToasts((prev) => prev.filter((tt) => tt.id !== t.id))}
                        >
                            ✕
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}
