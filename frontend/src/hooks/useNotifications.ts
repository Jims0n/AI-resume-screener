'use client';

import { useState, useCallback } from 'react';
import notificationService from '@/lib/notificationService';
import type { Notification } from '@/types';
import { usePolling } from './usePolling';

export function useNotifications() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchUnreadCount = useCallback(async () => {
        const result = await notificationService.getUnreadCount();
        setUnreadCount(result.unread_count);
        return result;
    }, []);

    const { isPolling } = usePolling({
        fetcher: fetchUnreadCount,
        interval: 30000,
        enabled: true,
        maxDuration: Infinity,
    });

    const fetchNotifications = useCallback(async () => {
        const result = await notificationService.getNotifications();
        setNotifications(result.results);
        return result;
    }, []);

    const markRead = useCallback(async (id: number) => {
        await notificationService.markRead(id);
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
    }, []);

    const markAllRead = useCallback(async () => {
        await notificationService.markAllRead();
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        setUnreadCount(0);
    }, []);

    return {
        notifications,
        unreadCount,
        isPolling,
        fetchNotifications,
        markRead,
        markAllRead,
    };
}
