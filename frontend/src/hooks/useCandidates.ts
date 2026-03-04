'use client';

import { useState, useCallback } from 'react';
import { Candidate, CandidateListItem } from '@/types';
import { candidateService } from '@/lib/candidateService';

export function useCandidates() {
    const [candidates, setCandidates] = useState<CandidateListItem[]>([]);
    const [currentCandidate, setCurrentCandidate] = useState<Candidate | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchCandidates = useCallback(async (jobId: number, params?: Record<string, string>) => {
        setLoading(true);
        setError(null);
        try {
            const data = await candidateService.getCandidates(jobId, params);
            setCandidates(data.results);
            return data;
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to load candidates');
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchCandidate = useCallback(async (id: number) => {
        setLoading(true);
        setError(null);
        try {
            const data = await candidateService.getCandidate(id);
            setCurrentCandidate(data);
            return data;
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to load candidate');
        } finally {
            setLoading(false);
        }
    }, []);

    const uploadResumes = useCallback(async (jobId: number, files: File[]) => {
        setLoading(true);
        setError(null);
        try {
            const data = await candidateService.uploadResumes(jobId, files);
            return data;
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to upload resumes');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const updateStatus = useCallback(async (id: number, status: string) => {
        try {
            await candidateService.updateCandidateStatus(id, status);
            setCandidates((prev) => prev.map((c) => (c.id === id ? { ...c, status: status as any } : c)));
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to update status');
        }
    }, []);

    const reprocess = useCallback(async (id: number) => {
        try {
            await candidateService.reprocessCandidate(id);
            setCandidates((prev) => prev.map((c) => (c.id === id ? { ...c, status: 'pending' as const } : c)));
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to reprocess');
        }
    }, []);

    const exportCSV = useCallback(async (jobId: number) => {
        try {
            const blob = await candidateService.exportCandidates(jobId);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `candidates_export.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (err: any) {
            setError('Failed to export');
        }
    }, []);

    return {
        candidates, currentCandidate, loading, error,
        fetchCandidates, fetchCandidate, uploadResumes,
        updateStatus, reprocess, exportCSV, setCandidates,
    };
}
