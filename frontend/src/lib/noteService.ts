import api from './api';
import type { CandidateNote } from '@/types';

const noteService = {
    getNotes: async (candidateId: number): Promise<CandidateNote[]> => {
        const { data } = await api.get(`/candidates/${candidateId}/notes`);
        return data;
    },

    createNote: async (candidateId: number, content: string): Promise<CandidateNote> => {
        const { data } = await api.post(`/candidates/${candidateId}/notes`, { content });
        return data;
    },

    updateNote: async (noteId: number, content: string): Promise<CandidateNote> => {
        const { data } = await api.patch(`/notes/${noteId}`, { content });
        return data;
    },

    deleteNote: async (noteId: number): Promise<void> => {
        await api.delete(`/notes/${noteId}`);
    },
};

export default noteService;
