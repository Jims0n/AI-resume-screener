import api from './api';
import type { ComparisonResult } from '@/types';

const comparisonService = {
    compareCandidates: async (jobId: number, candidateIds: number[]): Promise<ComparisonResult> => {
        const { data } = await api.post(`/jobs/${jobId}/compare`, { candidate_ids: candidateIds });
        return data;
    },
};

export default comparisonService;
