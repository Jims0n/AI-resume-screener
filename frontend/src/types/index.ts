// ──────────────────────────── Organization ─────────────────────
export interface Organization {
    id: number;
    name: string;
    slug: string;
    logo: string | null;
    max_jobs: number;
    max_resumes_per_job: number;
    max_users: number;
    member_count: number;
    active_job_count: number;
    created_at: string;
}

export interface OrganizationInvite {
    id: number;
    email: string;
    role: string;
    status: 'pending' | 'accepted' | 'expired';
    invited_by_email: string;
    created_at: string;
    expires_at: string;
}

export interface OrganizationMember {
    id: number;
    username: string;
    email: string;
    role: UserRole;
    date_joined: string;
    avatar: string | null;
}

// ──────────────────────────── Auth ────────────────────────────
export type UserRole = 'owner' | 'admin' | 'recruiter' | 'hiring_manager' | 'viewer';

export interface User {
    id: number;
    username: string;
    email: string;
    company: string;
    role: UserRole;
    avatar: string | null;
    organization: Organization | null;
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
    skill_weight: number;
    experience_weight: number;
    education_weight: number;
    custom_criteria: Record<string, string>[];
    created_by_email: string;
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
    skill_weight?: number;
    experience_weight?: number;
    education_weight?: number;
    custom_criteria?: Record<string, string>[];
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
    notes?: CandidateNote[];
}

export type CandidateListItem = Pick<
    Candidate,
    | 'id' | 'name' | 'email' | 'phone'
    | 'overall_score' | 'skill_match_score'
    | 'experience_score' | 'education_score'
    | 'status' | 'created_at' | 'processed_at'
    | 'skill_matches'
> & { note_count?: number };

// ──────────────────────────── Notes ──────────────────────────
export interface CandidateNote {
    id: number;
    content: string;
    user_email: string;
    user_name: string;
    created_at: string;
    updated_at: string;
}

// ──────────────────────────── Batch Processing ───────────────
export interface ProcessingBatch {
    id: number;
    job: number;
    job_title: string;
    total_count: number;
    processed_count: number;
    failed_count: number;
    status: 'processing' | 'completed' | 'partial';
    progress_percentage: number;
    started_at: string;
    completed_at: string | null;
}

// ──────────────────────────── Notifications ──────────────────
export type NotificationType =
    | 'processing_complete'
    | 'batch_complete'
    | 'candidate_shortlisted'
    | 'candidate_rejected'
    | 'new_member'
    | 'plan_limit_warning'
    | 'email_sent'
    | 'general';

export interface Notification {
    id: number;
    type: NotificationType;
    title: string;
    message: string;
    data: Record<string, unknown>;
    is_read: boolean;
    created_at: string;
}

// ──────────────────────────── Email Templates ────────────────
export type EmailTemplateType = 'shortlist' | 'rejection' | 'interview_invite' | 'custom';

export interface EmailTemplate {
    id: number;
    name: string;
    type: EmailTemplateType;
    subject: string;
    body: string;
    is_default: boolean;
    created_at: string;
    updated_at: string;
}

export interface EmailTemplateCreate {
    name: string;
    type: EmailTemplateType;
    subject: string;
    body: string;
    is_default?: boolean;
}

export interface SentEmail {
    id: number;
    candidate: number;
    candidate_name: string;
    template: number | null;
    template_name: string;
    sender_email: string;
    recipient_email: string;
    subject: string;
    body: string;
    status: 'sent' | 'failed';
    error_message: string;
    created_at: string;
}

export interface SendEmailPayload {
    template_id?: number;
    subject?: string;
    body?: string;
}

export interface BulkEmailPayload {
    candidate_ids: number[];
    template_id?: number;
    subject?: string;
    body?: string;
}

// ──────────────────────────── Activity Log ───────────────────
export interface ActivityLog {
    id: number;
    user_email: string;
    user_name: string;
    action: string;
    target_type: string;
    target_id: number | null;
    details: Record<string, unknown>;
    created_at: string;
}

// ──────────────────────────── Comparison ─────────────────────
export interface ComparisonResult {
    candidates: Candidate[];
    comparison_summary: string;
    recommendation: string;
    comparison_matrix: Record<string, Record<string, { found: boolean; proficiency: string }>>;
}

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
