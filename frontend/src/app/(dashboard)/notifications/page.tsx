'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useNotifications } from '@/hooks/useNotifications';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import type { Notification } from '@/types';

function timeAgo(dateStr: string): string {
    const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
}

function getNotificationIcon(type: string): string {
    switch (type) {
        case 'processing_complete': return '✅';
        case 'processing_failed': return '❌';
        case 'status_changed': return '🔄';
        case 'new_candidate': return '👤';
        case 'score_ready': return '📊';
        case 'batch_complete': return '📦';
        case 'invite_received': return '📨';
        default: return '🔔';
    }
}

function getNotificationLink(notification: Notification): string | null {
    const { data, type } = notification;
    if (data.candidate_id && data.job_id) {
        return `/candidates/${data.candidate_id}`;
    }
    if (data.job_id) {
        return `/jobs/${data.job_id}`;
    }
    if (data.invite_token) {
        return `/invite/${data.invite_token}`;
    }
    return null;
}

type FilterType = 'all' | 'unread' | 'read';

export default function NotificationsPage() {
    const { notifications, unreadCount, fetchNotifications, markRead, markAllRead } = useNotifications();
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<FilterType>('all');
    const router = useRouter();

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            await fetchNotifications();
            setLoading(false);
        };
        load();
    }, [fetchNotifications]);

    const handleNotificationClick = async (notification: Notification) => {
        if (!notification.is_read) {
            await markRead(notification.id);
        }
        const link = getNotificationLink(notification);
        if (link) {
            router.push(link);
        }
    };

    const filteredNotifications = notifications.filter((n) => {
        if (filter === 'unread') return !n.is_read;
        if (filter === 'read') return n.is_read;
        return true;
    });

    // Group notifications by date
    const grouped = filteredNotifications.reduce<Record<string, Notification[]>>((acc, n) => {
        const date = new Date(n.created_at);
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        let label: string;
        if (date.toDateString() === today.toDateString()) {
            label = 'Today';
        } else if (date.toDateString() === yesterday.toDateString()) {
            label = 'Yesterday';
        } else {
            label = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        }

        if (!acc[label]) acc[label] = [];
        acc[label].push(n);
        return acc;
    }, {});

    const filters: { key: FilterType; label: string }[] = [
        { key: 'all', label: 'All' },
        { key: 'unread', label: `Unread (${unreadCount})` },
        { key: 'read', label: 'Read' },
    ];

    return (
        <div className="animate-fade-in max-w-3xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="font-serif text-3xl tracking-tight text-[#e8e4d9]">Notifications</h1>
                    <p className="text-sm text-[#8a8578] mt-1 font-light">
                        {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
                    </p>
                </div>
                {unreadCount > 0 && (
                    <Button variant="secondary" size="sm" onClick={markAllRead}>
                        Mark all read
                    </Button>
                )}
            </div>

            {/* Filters */}
            <div className="flex gap-1 mb-6 bg-[#1a1a1a] rounded-lg p-1">
                {filters.map((f) => (
                    <button
                        key={f.key}
                        onClick={() => setFilter(f.key)}
                        className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                            filter === f.key
                                ? 'bg-[#2a2a2a] text-[#e8e4d9] shadow-sm'
                                : 'text-[#8a8578] hover:text-[#e8e4d9]'
                        }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Loading */}
            {loading ? (
                <div className="space-y-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="flex gap-3 p-4 bg-[#242424] rounded-xl border border-[#2a2a2a]">
                            <Skeleton variant="circle" width={40} />
                            <div className="flex-1 space-y-2">
                                <Skeleton height={16} width="60%" />
                                <Skeleton height={14} width="80%" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : filteredNotifications.length === 0 ? (
                <Card>
                    <div className="text-center py-12">
                        <div className="text-4xl mb-3">🔔</div>
                        <p className="text-[#8a8578] font-light">
                            {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                        </p>
                    </div>
                </Card>
            ) : (
                <div className="space-y-6">
                    {Object.entries(grouped).map(([dateLabel, items]) => (
                        <div key={dateLabel}>
                            <h3 className="text-xs font-medium text-[#6b6560] uppercase tracking-wider mb-2 px-1">
                                {dateLabel}
                            </h3>
                            <div className="space-y-1">
                                {items.map((n) => {
                                    const link = getNotificationLink(n);
                                    return (
                                        <button
                                            key={n.id}
                                            onClick={() => handleNotificationClick(n)}
                                            className={`w-full text-left flex items-start gap-3 p-4 rounded-xl border transition-all cursor-pointer ${
                                                n.is_read
                                                    ? 'bg-[#242424] border-[#2a2a2a] hover:bg-[#2a2a2a]'
                                                    : 'bg-[#2a2820] border-[#d4c8a0]/20 hover:bg-[#302e24]'
                                            } ${link ? 'cursor-pointer' : 'cursor-default'}`}
                                        >
                                            <div className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center text-lg flex-shrink-0">
                                                {getNotificationIcon(n.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <p className={`text-sm ${
                                                        n.is_read
                                                            ? 'text-[#e8e4d9]/80'
                                                            : 'text-[#e8e4d9] font-medium'
                                                    }`}>
                                                        {n.title}
                                                    </p>
                                                    <span className="text-xs text-[#6b6560] whitespace-nowrap flex-shrink-0">
                                                        {timeAgo(n.created_at)}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-[#8a8578] mt-0.5 line-clamp-2">
                                                    {n.message}
                                                </p>
                                                {!n.is_read && (
                                                    <div className="flex items-center mt-2">
                                                        <span className="w-2 h-2 bg-[#e8e4d9] rounded-full" />
                                                        <span className="text-xs text-[#e8e4d9]/60 ml-1.5">New</span>
                                                    </div>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
