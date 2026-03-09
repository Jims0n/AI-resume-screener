'use client';

import { useState, useEffect, useCallback } from 'react';
import { useNotes } from '@/hooks/useNotes';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/components/ui/Toast';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';

function timeAgo(dateStr: string): string {
    const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

export default function NotesSection({ candidateId }: { candidateId: number }) {
    const { notes, loading, fetchNotes, addNote, updateNote, deleteNote } = useNotes(candidateId);
    const { user } = useAuthStore();
    const { addToast } = useToast();
    const [newContent, setNewContent] = useState('');
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editContent, setEditContent] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => { fetchNotes(); }, [fetchNotes]);

    // Poll every 10s
    const poll = useCallback(() => {
        const interval = setInterval(fetchNotes, 10000);
        return () => clearInterval(interval);
    }, [fetchNotes]);
    useEffect(poll, [poll]);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newContent.trim()) return;
        setSubmitting(true);
        try {
            await addNote(newContent.trim());
            setNewContent('');
        } catch {
            addToast('Failed to add note', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdate = async (noteId: number) => {
        if (!editContent.trim()) return;
        try {
            await updateNote(noteId, editContent.trim());
            setEditingId(null);
        } catch {
            addToast('Failed to update note', 'error');
        }
    };

    const handleDelete = async (noteId: number) => {
        if (!confirm('Delete this note?')) return;
        try {
            await deleteNote(noteId);
        } catch {
            addToast('Failed to delete note', 'error');
        }
    };

    return (
        <div>
            <h3 className="font-serif text-xl tracking-tight text-shortlyst-text mb-4">
                Notes & Comments ({notes.length})
            </h3>

            {/* Add note form */}
            <form onSubmit={handleAdd} className="mb-6">
                <textarea
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    rows={3}
                    placeholder="Add a note about this candidate..."
                    className="w-full px-3 py-2 rounded-xl border border-shortlyst-border bg-shortlyst-text/5 text-shortlyst-text focus:outline-none focus:ring-1 focus:ring-shortlyst-accent text-sm resize-none mb-2 placeholder:text-shortlyst-text/40 font-light"
                />
                <div className="flex justify-end">
                    <Button type="submit" size="sm" loading={submitting} disabled={!newContent.trim()}>
                        Add Note
                    </Button>
                </div>
            </form>

            {/* Notes list */}
            {loading && notes.length === 0 ? (
                <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="flex gap-3">
                            <Skeleton variant="circle" width={32} />
                            <div className="flex-1 space-y-1">
                                <Skeleton height={14} width="50%" />
                                <Skeleton height={40} />
                            </div>
                        </div>
                    ))}
                </div>
            ) : notes.length === 0 ? (
                <p className="text-sm text-shortlyst-text/40 font-light text-center py-4">No notes yet. Be the first to comment!</p>
            ) : (
                <div className="space-y-4">
                    {notes.map((note) => {
                        const isOwn = note.user_email === user?.email;
                        const isEditing = editingId === note.id;

                        return (
                            <div key={note.id} className="flex gap-3 group">
                                <div className="w-8 h-8 bg-shortlyst-text/10 rounded-full flex items-center justify-center text-xs font-serif text-shortlyst-text flex-shrink-0">
                                    {note.user_name?.charAt(0).toUpperCase() || '?'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-sm font-medium text-shortlyst-text">{note.user_name}</span>
                                        <span className="text-xs text-shortlyst-text/40">{timeAgo(note.created_at)}</span>
                                    </div>
                                    {isEditing ? (
                                        <div>
                                            <textarea
                                                value={editContent}
                                                onChange={(e) => setEditContent(e.target.value)}
                                                rows={2}
                                                className="w-full px-3 py-2 rounded-xl border border-shortlyst-border bg-shortlyst-text/5 text-shortlyst-text focus:outline-none focus:ring-1 focus:ring-shortlyst-accent text-sm resize-none mb-2 font-light"
                                            />
                                            <div className="flex gap-2">
                                                <Button size="sm" onClick={() => handleUpdate(note.id)}>Save</Button>
                                                <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <p className="text-sm text-shortlyst-text/80 font-light whitespace-pre-wrap">{note.content}</p>
                                            {isOwn && (
                                                <div className="flex gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => { setEditingId(note.id); setEditContent(note.content); }}
                                                        className="text-xs text-shortlyst-text/40 hover:text-shortlyst-text"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(note.id)}
                                                        className="text-xs text-[#c45c5c] hover:opacity-80"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
