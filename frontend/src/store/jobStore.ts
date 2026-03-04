'use client';

import { create } from 'zustand';
import { Job } from '@/types';
import { jobService } from '@/lib/jobService';

interface JobState {
    jobs: Job[];
    currentJob: Job | null;
    loading: boolean;
    error: string | null;
    fetchJobs: () => Promise<void>;
    createJob: (data: { title: string; description: string; required_skills?: string[]; nice_to_have_skills?: string[]; min_experience_years?: number }) => Promise<Job>;
    fetchJob: (id: number) => Promise<void>;
    setCurrentJob: (job: Job | null) => void;
}

export const useJobStore = create<JobState>((set) => ({
    jobs: [],
    currentJob: null,
    loading: false,
    error: null,

    fetchJobs: async () => {
        set({ loading: true, error: null });
        try {
            const data = await jobService.getJobs();
            set({ jobs: data.results, loading: false });
        } catch (err: any) {
            set({ error: err.response?.data?.detail || 'Failed to load jobs', loading: false });
        }
    },

    createJob: async (payload) => {
        set({ loading: true, error: null });
        try {
            const job = await jobService.createJob(payload);
            set((state) => ({ jobs: [job, ...state.jobs], loading: false }));
            return job;
        } catch (err: any) {
            set({ error: err.response?.data?.detail || 'Failed to create job', loading: false });
            throw err;
        }
    },

    fetchJob: async (id) => {
        set({ loading: true, error: null });
        try {
            const job = await jobService.getJob(id);
            set({ currentJob: job, loading: false });
        } catch (err: any) {
            set({ error: err.response?.data?.detail || 'Failed to load job', loading: false });
        }
    },

    setCurrentJob: (job) => set({ currentJob: job }),
}));
