'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface UsePollingOptions<T> {
    fetcher: () => Promise<T>;
    interval?: number;
    shouldStop?: (data: T) => boolean;
    enabled?: boolean;
}

export function usePolling<T>({ fetcher, interval = 3000, shouldStop, enabled = true }: UsePollingOptions<T>) {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isPolling, setIsPolling] = useState(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const poll = useCallback(async () => {
        try {
            setLoading(true);
            const result = await fetcher();
            setData(result);
            setError(null);

            if (shouldStop?.(result)) {
                if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                    intervalRef.current = null;
                }
                setIsPolling(false);
            }
        } catch (err: any) {
            setError(err.message || 'Polling failed');
        } finally {
            setLoading(false);
        }
    }, [fetcher, shouldStop]);

    useEffect(() => {
        if (!enabled) return;

        // Initial fetch
        poll();

        // Start polling
        setIsPolling(true);
        intervalRef.current = setInterval(poll, interval);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            setIsPolling(false);
        };
    }, [enabled, interval, poll]);

    return { data, loading, error, isPolling };
}
