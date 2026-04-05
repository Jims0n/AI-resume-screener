'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useNotifications } from '@/hooks/useNotifications';
import type { Notification } from '@/types';

function timeAgo(dateStr: string): string {
    const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

function notificationIcon(type: string): string {
    const icons: Record<string, string> = {
        processing_complete: '✅',
        batch_complete: '📦',
        candidate_shortlisted: '⭐',
        candidate_rejected: '❌',
        new_member: '👤',
        plan_limit_warning: '⚠️',
        email_sent: '📧',
        general: '🔔',
    };
    return icons[type] || '🔔';
}

export default function NotificationBell() {
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const { notifications, unreadCount, fetchNotifications, markRead, markAllRead } = useNotifications();

    // Fetch notifications when dropdown opens
    useEffect(() => {
        if (open) {
            fetchNotifications();
        }
    }, [open, fetchNotifications]);

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleNotificationClick = async (notification: Notification) => {
        if (!notification.is_read) {
            await markRead(notification.id);
        }
        setOpen(false);

        // Navigate based on notification data
        const data = notification.data || {};
        if (data.candidate_id) {
            router.push(`/candidates/${data.candidate_id}`);
        } else if (data.job_id) {
            router.push(`/jobs/${data.job_id}`);
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setOpen(!open)}
                className="relative p-2 rounded-lg text-[#8a8578] hover:text-[#e8e4d9] hover:bg-[#242424] transition-colors cursor-pointer"
                aria-label="Notifications"
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#c45c5c] px-1 text-[10px] font-bold text-white animate-bounce-in">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#242424] rounded-xl shadow-2xl border border-[#2a2a2a] z-50 animate-modal-in overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2a2a]">
                        <h3 className="text-sm font-semibold text-[#e8e4d9]">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllRead}
                                className="text-xs text-[#e8e4d9] hover:underline cursor-pointer"
                            >
                                Mark all as read
                            </button>
                        )}
                    </div>

                    {/* Notification list */}
                    <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center">
                                <span className="text-3xl mb-2 block">🔔</span>
                                <p className="text-sm text-[#8a8578]">No notifications yet</p>
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <button
                                    key={notification.id}
                                    onClick={() => handleNotificationClick(notification)}
                                    className={`w-full text-left px-4 py-3 hover:bg-[#2a2a2a] transition-colors border-b border-[#2a2a2a]/50 last:border-0 cursor-pointer ${!notification.is_read ? 'bg-[#2a2820]' : ''
                                        }`}
                                >
                                    <div className="flex gap-3">
                                        <span className="text-lg flex-shrink-0 mt-0.5">
                                            {notificationIcon(notification.type)}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm ${!notification.is_read ? 'font-semibold text-[#e8e4d9]' : 'text-[#e8e4d9]/80'}`}>
                                                {notification.title}
                                            </p>
                                            <p className="text-xs text-[#8a8578] mt-0.5 line-clamp-2">
                                                {notification.message}
                                            </p>
                                            <p className="text-xs text-[#6b6560] mt-1">
                                                {timeAgo(notification.created_at)}
                                            </p>
                                        </div>
                                        {!notification.is_read && (
                                            <span className="w-2 h-2 bg-[#e8e4d9] rounded-full flex-shrink-0 mt-2" />
                                        )}
                                    </div>
                                </button>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="border-t border-[#2a2a2a]">
                            <button
                                onClick={() => { setOpen(false); router.push('/notifications'); }}
                                className="w-full text-center py-2.5 text-sm text-[#e8e4d9] hover:bg-[#2a2a2a] transition-colors cursor-pointer"
                            >
                                View all notifications
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
