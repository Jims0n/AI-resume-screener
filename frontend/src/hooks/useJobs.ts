'use client';

import { useState, useCallback } from 'react';
import { Job, JobCreate } from '@/types';
import { jobService } from '@/lib/jobService';

export function useJobs() {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [currentJob, setCurrentJob] = useState<Job | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchJobs = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await jobService.getJobs();
            setJobs(data.results);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to load jobs');
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchJob = useCallback(async (id: number) => {
        setLoading(true);
        setError(null);
        try {
            const data = await jobService.getJob(id);
            setCurrentJob(data);
            return data;
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to load job');
        } finally {
            setLoading(false);
        }
    }, []);

    const createJob = useCallback(async (payload: JobCreate) => {
        setLoading(true);
        setError(null);
        try {
            const job = await jobService.createJob(payload);
            setJobs((prev) => [job, ...prev]);
            return job;
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to create job');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    return { jobs, currentJob, loading, error, fetchJobs, fetchJob, createJob, setCurrentJob };
}
