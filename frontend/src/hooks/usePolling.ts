'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface UsePollingOptions<T> {
    fetcher: () => Promise<T>;
    interval?: number;
    shouldStop?: (data: T) => boolean;
    enabled?: boolean;
    maxDuration?: number;
}

export function usePolling<T>({
    fetcher,
    interval = 5000,
    shouldStop,
    enabled = true,
    maxDuration = 120000,
}: UsePollingOptions<T>) {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isPolling, setIsPolling] = useState(false);
    const [timedOut, setTimedOut] = useState(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const stoppedRef = useRef(false);

    const stopPolling = useCallback(() => {
        stoppedRef.current = true;
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        setIsPolling(false);
    }, []);

    const poll = useCallback(async () => {
        if (stoppedRef.current) return;
        try {
            setLoading(true);
            const result = await fetcher();
            setData(result);
            setError(null);

            if (shouldStop?.(result)) {
                stopPolling();
            }
        } catch (err: any) {
            const status = err.response?.status;
            if (status === 401 || status === 403) {
                stopPolling();
                setError('Authentication error');
                return;
            }
            // On 429 (rate limited), don't set error — just skip this tick
            if (status === 429) return;
            setError(err.message || 'Polling failed');
        } finally {
            setLoading(false);
        }
    }, [fetcher, shouldStop, stopPolling]);

    useEffect(() => {
        if (!enabled) return;

        stoppedRef.current = false;
        poll();

        setIsPolling(true);
        intervalRef.current = setInterval(poll, interval);

        if (maxDuration > 0) {
            timeoutRef.current = setTimeout(() => {
                stopPolling();
                setTimedOut(true);
            }, maxDuration);
        }

        return () => {
            stopPolling();
        };
    }, [enabled, interval, poll, maxDuration, stopPolling]);

    return { data, loading, error, isPolling, timedOut };
}
