// ──────────────────────────── Auth ────────────────────────────
export interface User {
    id: number;
    username: string;
    email: string;
    company: string;
    role: 'recruiter' | 'hiring_manager' | 'admin';
    date_joined: string;
}

export interface AuthTokens {
    access: string;
    refresh: string;
}

export interface LoginPayload {
    username: string;
    password: string;
}

export interface RegisterPayload {
    username: string;
    email: string;
    password: string;
    password_confirm: string;
    company?: string;
    role?: string;
}

// ──────────────────────────── Jobs ────────────────────────────
export interface Job {
    id: number;
    title: string;
    description: string;
    required_skills: string[];
    nice_to_have_skills: string[];
    min_experience_years: number;
    status: 'draft' | 'active' | 'closed';
    candidate_count: number;
    average_score: number | null;
    created_at: string;
    updated_at: string;
}

export interface JobCreate {
    title: string;
    description: string;
    required_skills?: string[];
    nice_to_have_skills?: string[];
    min_experience_years?: number;
    status?: string;
}

// ──────────────────────────── Candidates ──────────────────────
export interface SkillMatch {
    id: number;
    skill_name: string;
    found: boolean;
    proficiency: 'none' | 'beginner' | 'intermediate' | 'advanced' | 'expert';
    evidence: string;
    is_required: boolean;
}

export interface Experience {
    company: string;
    title: string;
    duration: string;
    years: number;
    highlights: string[];
}

export interface Education {
    institution: string;
    degree: string;
    year: number | null;
}

export interface ParsedResumeData {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
    summary?: string;
    skills?: string[];
    experience?: Experience[];
    education?: Education[];
    certifications?: string[];
    total_experience_years?: number;
    raw_text?: string;
}

export interface Candidate {
    id: number;
    job: number;
    job_title?: string;
    name: string;
    email: string;
    phone: string;
    resume_file: string;
    resume_url?: string;
    resume_text: string;
    parsed_data: ParsedResumeData;
    overall_score: number | null;
    skill_match_score: number | null;
    experience_score: number | null;
    education_score: number | null;
    scoring_reasoning: string;
    strengths: string[];
    red_flags: string[];
    status: 'pending' | 'processing' | 'scored' | 'shortlisted' | 'rejected';
    processed_at: string | null;
    created_at: string;
    skill_matches: SkillMatch[];
}

export type CandidateListItem = Pick<
    Candidate,
    | 'id' | 'name' | 'email' | 'phone'
    | 'overall_score' | 'skill_match_score'
    | 'experience_score' | 'education_score'
    | 'status' | 'created_at' | 'processed_at'
    | 'skill_matches'
>;

// ──────────────────────────── Analytics ──────────────────────
export interface ScoreDistribution {
    range: string;
    count: number;
}

export interface SkillGap {
    skill: string;
    percentage: number;
}

export interface PipelineStats {
    pending: number;
    processing: number;
    scored: number;
    shortlisted: number;
    rejected: number;
}

export interface AnalyticsData {
    score_distribution: ScoreDistribution[];
    skill_gap: SkillGap[];
    pipeline: PipelineStats;
    average_scores: {
        average_overall: number;
        average_skill_match: number;
        average_experience: number;
        average_education: number;
    };
    top_candidates: CandidateListItem[];
    total_candidates: number;
    total_scored: number;
}

// ──────────────────────────── API ────────────────────────────
export interface ApiError {
    detail?: string;
    [key: string]: unknown;
}

export interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}
