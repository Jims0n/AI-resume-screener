'use client';

import { useState, useCallback } from 'react';
import noteService from '@/lib/noteService';
import type { CandidateNote } from '@/types';

export function useNotes(candidateId: number) {
    const [notes, setNotes] = useState<CandidateNote[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchNotes = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await noteService.getNotes(candidateId);
            setNotes(data);
        } catch {
            setError('Failed to load notes');
        } finally {
            setLoading(false);
        }
    }, [candidateId]);

    const addNote = useCallback(async (content: string) => {
        const note = await noteService.createNote(candidateId, content);
        setNotes((prev) => [...prev, note]);
        return note;
    }, [candidateId]);

    const updateNote = useCallback(async (noteId: number, content: string) => {
        const updated = await noteService.updateNote(noteId, content);
        setNotes((prev) => prev.map((n) => (n.id === noteId ? updated : n)));
        return updated;
    }, []);

    const deleteNote = useCallback(async (noteId: number) => {
        await noteService.deleteNote(noteId);
        setNotes((prev) => prev.filter((n) => n.id !== noteId));
    }, []);

    return { notes, loading, error, fetchNotes, addNote, updateNote, deleteNote };
}
