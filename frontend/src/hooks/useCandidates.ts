'use client';

import { useState, useCallback } from 'react';
import { Candidate, CandidateListItem } from '@/types';
import { candidateService } from '@/lib/candidateService';
import { extractApiError } from '@/lib/apiErrors';

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
        } catch (err: unknown) {
            setError(extractApiError(err, 'Failed to load candidates'));
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
        } catch (err: unknown) {
            setError(extractApiError(err, 'Failed to load candidate'));
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
        } catch (err: unknown) {
            setError(extractApiError(err, 'Failed to upload resumes'));
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const updateStatus = useCallback(async (id: number, status: string) => {
        try {
            await candidateService.updateCandidateStatus(id, status);
            setCandidates((prev) => prev.map((c) => (c.id === id ? { ...c, status: status as CandidateListItem['status'] } : c)));
        } catch (err: unknown) {
            setError(extractApiError(err, 'Failed to update status'));
        }
    }, []);

    const reprocess = useCallback(async (id: number) => {
        try {
            await candidateService.reprocessCandidate(id);
            setCandidates((prev) => prev.map((c) => (c.id === id ? { ...c, status: 'pending' as const } : c)));
        } catch (err: unknown) {
            setError(extractApiError(err, 'Failed to reprocess'));
        }
    }, []);

    const deleteCandidate = useCallback(async (id: number) => {
        try {
            await candidateService.deleteCandidate(id);
            setCandidates((prev) => prev.filter((c) => c.id !== id));
        } catch (err: unknown) {
            setError(extractApiError(err, 'Failed to delete candidate'));
            throw err;
        }
    }, []);

    const bulkDeleteCandidates = useCallback(async (jobId: number, candidateIds: number[]) => {
        try {
            const result = await candidateService.bulkDeleteCandidates(jobId, candidateIds);
            setCandidates((prev) => prev.filter((c) => !candidateIds.includes(c.id)));
            return result;
        } catch (err: unknown) {
            setError(extractApiError(err, 'Failed to delete candidates'));
            throw err;
        }
    }, []);

    const exportCSV = useCallback(async (jobId: number) => {
        try {
            const { blob, filename } = await candidateService.exportCandidates(jobId);
            if (!(blob instanceof Blob) || blob.size === 0) {
                throw new Error('Empty or invalid export response');
            }
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (err: unknown) {
            setError(extractApiError(err, 'Failed to export'));
            throw err;
        }
    }, []);

    return {
        candidates, currentCandidate, loading, error,
        fetchCandidates, fetchCandidate, uploadResumes,
        updateStatus, reprocess, deleteCandidate, bulkDeleteCandidates,
        exportCSV, setCandidates,
    };
}
