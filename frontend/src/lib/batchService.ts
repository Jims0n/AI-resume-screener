import api from './api';
import type { ProcessingBatch } from '@/types';

const batchService = {
    getBatch: async (batchId: number): Promise<ProcessingBatch> => {
        const { data } = await api.get(`/batches/${batchId}`);
        return data;
    },
};

export default batchService;
