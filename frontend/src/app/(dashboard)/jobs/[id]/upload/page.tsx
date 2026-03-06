'use client';

import { useState, useCallback, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { useCandidates } from '@/hooks/useCandidates';
import { candidateService } from '@/lib/candidateService';
import { useToast } from '@/components/ui/Toast';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge, { getStatusVariant } from '@/components/ui/Badge';
import { CandidateListItem } from '@/types';

export default function UploadPage() {
    const params = useParams();
    const router = useRouter();
    const jobId = Number(params.id);
    const { uploadResumes, loading } = useCandidates();
    const { addToast } = useToast();
    const [files, setFiles] = useState<File[]>([]);
    const [uploaded, setUploaded] = useState(false);
    const [results, setResults] = useState<CandidateListItem[]>([]);
    const [fetching, setFetching] = useState(false);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        setFiles((prev) => [...prev, ...acceptedFiles]);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
        },
        maxSize: 10 * 1024 * 1024,
    });

    const removeFile = (idx: number) => {
        setFiles((prev) => prev.filter((_, i) => i !== idx));
    };

    const handleUpload = async () => {
        try {
            const result = await uploadResumes(jobId, files);
            setUploaded(true);
            setFiles([]);
            addToast(`${result.candidates.length} resume(s) uploaded & processed!`, 'success');

            // Fetch results once (resumes are already processed synchronously)
            setFetching(true);
            try {
                const data = await candidateService.getCandidates(jobId, { ordering: '-overall_score' });
                setResults(data.results);
            } catch {
                // silently fail — user can navigate to see results
            } finally {
                setFetching(false);
            }
        } catch {
            addToast('Upload failed', 'error');
        }
    };

    return (
        <div className="max-w-3xl mx-auto animate-fade-in">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Upload Resumes</h1>
                    <p className="text-slate-500 mt-1">Upload PDF or DOCX resumes for AI analysis</p>
                </div>
                {uploaded && (
                    <Button onClick={() => router.push(`/jobs/${jobId}`)}>
                        View Rankings →
                    </Button>
                )}
            </div>

            {!uploaded ? (
                <div className="space-y-6">
                    <Card>
                        <div
                            {...getRootProps()}
                            className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${isDragActive
                                ? 'border-indigo-500 bg-indigo-50'
                                : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'
                                }`}
                        >
                            <input {...getInputProps()} />
                            <div className="text-4xl mb-3">📁</div>
                            <p className="text-base font-medium text-slate-700">
                                {isDragActive ? 'Drop files here...' : 'Drag & drop resumes here, or click to browse'}
                            </p>
                            <p className="text-sm text-slate-400 mt-1">PDF & DOCX only · Max 10MB per file</p>
                        </div>
                    </Card>

                    {files.length > 0 && (
                        <Card header={<span className="font-semibold text-slate-700">{files.length} file(s) selected</span>}>
                            <ul className="divide-y divide-slate-100">
                                {files.map((file, idx) => (
                                    <li key={idx} className="flex items-center justify-between py-2.5">
                                        <div className="flex items-center gap-3">
                                            <span className="text-lg">{file.name.endsWith('.pdf') ? '📕' : '📘'}</span>
                                            <div>
                                                <p className="text-sm font-medium text-slate-900">{file.name}</p>
                                                <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
                                            </div>
                                        </div>
                                        <button onClick={() => removeFile(idx)} className="text-slate-400 hover:text-red-500 transition-colors">✕</button>
                                    </li>
                                ))}
                            </ul>
                            <div className="mt-4">
                                <Button onClick={handleUpload} loading={loading} size="lg" className="w-full">
                                    Upload & Process {files.length} Resume{files.length > 1 ? 's' : ''}
                                </Button>
                            </div>
                        </Card>
                    )}
                </div>
            ) : (
                <Card header={
                    <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-700">Results</span>
                        {fetching && <span className="text-xs text-slate-400">Loading...</span>}
                    </div>
                }>
                    {results.length > 0 ? (
                        <>
                            <ul className="divide-y divide-slate-100">
                                {results.map((c) => (
                                    <li key={c.id} className="flex items-center justify-between py-3 cursor-pointer hover:bg-slate-50 -mx-6 px-6 transition-colors"
                                        onClick={() => router.push(`/candidates/${c.id}`)}>
                                        <div className="flex items-center gap-3">
                                            <span className="text-lg">📄</span>
                                            <p className="text-sm font-medium text-slate-900">{c.name}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {c.overall_score !== null && (
                                                <span className="text-sm font-semibold text-slate-700">Score: {c.overall_score}</span>
                                            )}
                                            <Badge variant={getStatusVariant(c.status)}>{c.status}</Badge>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                            <div className="mt-4">
                                <Button onClick={() => router.push(`/jobs/${jobId}`)} className="w-full" size="lg">
                                    View Full Rankings →
                                </Button>
                            </div>
                        </>
                    ) : (
                        <p className="text-sm text-slate-500 text-center py-4">
                            Resumes processed. <button onClick={() => router.push(`/jobs/${jobId}`)} className="text-indigo-600 hover:underline">View rankings →</button>
                        </p>
                    )}
                </Card>
            )}
        </div>
    );
}
