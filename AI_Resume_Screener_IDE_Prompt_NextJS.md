
## PROMPT START

Build a full-stack AI Resume Screener application from scratch. This is a web app where recruiters upload resumes (PDF/DOCX), paste a job description, and the system uses AI to extract skills, score candidates against the job requirements, and rank them.

## Tech Stack

**Backend:** Python 3.11+, Django 5, Django REST Framework, PostgreSQL, Celery + Redis, PyMuPDF (fitz), python-docx, Anthropic SDK (Claude API)
**Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Zustand (state management), Axios, react-dropzone, recharts
**DevOps:** Docker, docker-compose

## Project Structure

```
ai-resume-screener/
├── backend/
│   ├── config/                    # Django project config
│   │   ├── __init__.py            # Celery app import
│   │   ├── settings.py
│   │   ├── urls.py
│   │   ├── wsgi.py
│   │   └── celery.py
│   ├── accounts/                  # Custom user, auth endpoints
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── urls.py
│   ├── jobs/                      # Job CRUD + JD skill extraction
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── urls.py
│   ├── candidates/                # Resume upload, processing, scoring
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── urls.py
│   │   ├── tasks.py               # Celery async tasks
│   │   └── services/
│   │       ├── __init__.py
│   │       ├── parser.py           # PDF/DOCX text extraction
│   │       ├── extractor.py        # LLM structured data extraction
│   │       └── scorer.py           # LLM candidate scoring
│   ├── analytics/
│   │   ├── views.py
│   │   └── urls.py
│   ├── manage.py
│   ├── requirements.txt
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx                    # Root layout with sidebar nav
│   │   │   ├── page.tsx                      # Landing page (public)
│   │   │   ├── globals.css
│   │   │   ├── (auth)/
│   │   │   │   ├── login/page.tsx
│   │   │   │   └── register/page.tsx
│   │   │   └── (dashboard)/
│   │   │       ├── layout.tsx                # Dashboard layout with sidebar
│   │   │       ├── dashboard/page.tsx        # Job listings
│   │   │       ├── jobs/
│   │   │       │   ├── new/page.tsx          # Create job
│   │   │       │   └── [id]/
│   │   │       │       ├── page.tsx          # Job detail — candidate rankings
│   │   │       │       ├── upload/page.tsx   # Resume upload
│   │   │       │       └── analytics/page.tsx
│   │   │       └── candidates/
│   │   │           └── [id]/page.tsx         # Candidate detail
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Navbar.tsx
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   └── AuthGuard.tsx
│   │   │   ├── jobs/
│   │   │   │   ├── JobCard.tsx
│   │   │   │   ├── JobForm.tsx
│   │   │   │   └── SkillTagEditor.tsx
│   │   │   ├── candidates/
│   │   │   │   ├── CandidateTable.tsx
│   │   │   │   ├── CandidateRow.tsx
│   │   │   │   ├── CandidateDetail.tsx
│   │   │   │   ├── SkillMatchGrid.tsx
│   │   │   │   ├── ScoreRadar.tsx
│   │   │   │   └── ResumeViewer.tsx
│   │   │   ├── upload/
│   │   │   │   ├── DropZone.tsx
│   │   │   │   └── UploadProgress.tsx
│   │   │   ├── analytics/
│   │   │   │   ├── ScoreDistribution.tsx
│   │   │   │   ├── SkillGapChart.tsx
│   │   │   │   └── ComparisonView.tsx
│   │   │   └── ui/
│   │   │       ├── Button.tsx
│   │   │       ├── Card.tsx
│   │   │       ├── Badge.tsx
│   │   │       ├── ProgressBar.tsx
│   │   │       ├── Toast.tsx
│   │   │       ├── Modal.tsx
│   │   │       ├── Spinner.tsx
│   │   │       └── EmptyState.tsx
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── useJobs.ts
│   │   │   ├── useCandidates.ts
│   │   │   └── usePolling.ts
│   │   ├── lib/
│   │   │   ├── api.ts                # Axios instance + interceptors
│   │   │   ├── authService.ts
│   │   │   ├── jobService.ts
│   │   │   └── candidateService.ts
│   │   ├── store/
│   │   │   ├── authStore.ts
│   │   │   └── jobStore.ts
│   │   └── types/
│   │       └── index.ts
│   ├── next.config.js
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── package.json
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

## BACKEND SPECIFICATIONS

### 1. Django Settings (`config/settings.py`)

- Use `python-decouple` to read all secrets from `.env`
- PostgreSQL as default database
- Custom user model: `AUTH_USER_MODEL = 'accounts.User'`
- DRF with JWT auth (djangorestframework-simplejwt), 1hr access / 7d refresh
- django-cors-headers allowing `http://localhost:3000` (Next.js default port)
- django-filter for queryset filtering
- Celery broker + result backend pointing to Redis
- MEDIA_ROOT for uploaded resumes
- ANTHROPIC_API_KEY from env

### 2. Celery (`config/celery.py`)

- Standard Celery setup with `autodiscover_tasks()`
- Import celery app in `config/__init__.py`

### 3. Accounts App

**Model:**
```python
class User(AbstractUser):
    company = models.CharField(max_length=255, blank=True)
    role = models.CharField(max_length=50, choices=[
        ('recruiter', 'Recruiter'),
        ('hiring_manager', 'Hiring Manager'),
        ('admin', 'Admin'),
    ], default='recruiter')
```

**Endpoints:**
- `POST /api/auth/register/` — create user (username, email, password, company, role)
- `POST /api/auth/login/` — returns JWT access + refresh tokens
- `POST /api/auth/refresh/` — refresh access token
- `GET /api/auth/me/` — return current user profile

### 4. Jobs App

**Model:**
```python
class Job(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='jobs')
    title = models.CharField(max_length=255)
    description = models.TextField()
    required_skills = models.JSONField(default=list)
    nice_to_have_skills = models.JSONField(default=list)
    min_experience_years = models.IntegerField(default=0)
    status = models.CharField(max_length=20, choices=[
        ('draft', 'Draft'), ('active', 'Active'), ('closed', 'Closed')
    ], default='active')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

**Endpoints (ViewSet):**
- `GET /api/jobs/` — list current user's jobs, ordered by `-created_at`
- `POST /api/jobs/` — create job. On create, use Anthropic API to auto-extract `required_skills` and `nice_to_have_skills` from the `description` field. The user can override these after.
- `GET /api/jobs/<id>/` — job detail, include candidate count and average score in response
- `PATCH /api/jobs/<id>/` — update job
- `DELETE /api/jobs/<id>/` — delete job and all related candidates

**JD Skill Extraction Service:**
When a job is created, call the Anthropic API with this system prompt pattern:

```
You are an expert recruiter. Extract skills from this job description.
Return ONLY valid JSON:
{
  "required_skills": ["skill1", "skill2"],
  "nice_to_have_skills": ["skill1", "skill2"],
  "min_experience_years": number
}

Job Description:
{description}
```

Use model `claude-sonnet-4-5-20250514`. Handle JSON parsing errors gracefully — if extraction fails, set empty lists and let the user fill them manually.

### 5. Candidates App

**Models:**
```python
class Candidate(models.Model):
    job = models.ForeignKey('jobs.Job', on_delete=models.CASCADE, related_name='candidates')
    name = models.CharField(max_length=255, default='Unknown')
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=50, blank=True)
    resume_file = models.FileField(upload_to='resumes/%Y/%m/')
    resume_text = models.TextField(blank=True)
    parsed_data = models.JSONField(default=dict)
    overall_score = models.FloatField(null=True, blank=True)
    skill_match_score = models.FloatField(null=True, blank=True)
    experience_score = models.FloatField(null=True, blank=True)
    education_score = models.FloatField(null=True, blank=True)
    scoring_reasoning = models.TextField(blank=True)
    strengths = models.JSONField(default=list)
    red_flags = models.JSONField(default=list)
    status = models.CharField(max_length=20, choices=[
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('scored', 'Scored'),
        ('shortlisted', 'Shortlisted'),
        ('rejected', 'Rejected'),
    ], default='pending')
    processed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

class SkillMatch(models.Model):
    candidate = models.ForeignKey(Candidate, on_delete=models.CASCADE, related_name='skill_matches')
    skill_name = models.CharField(max_length=100)
    found = models.BooleanField(default=False)
    proficiency = models.CharField(max_length=20, choices=[
        ('none', 'Not Found'),
        ('beginner', 'Beginner'),
        ('intermediate', 'Intermediate'),
        ('advanced', 'Advanced'),
        ('expert', 'Expert'),
    ], default='none')
    evidence = models.TextField(blank=True)
    is_required = models.BooleanField(default=True)
```

**Endpoints:**
- `POST /api/jobs/<job_id>/upload/` — accept multipart file upload (multiple files). For each file: create a Candidate record, dispatch `process_resume` Celery task. Return list of created candidate IDs + statuses.
- `GET /api/jobs/<job_id>/candidates/` — list candidates for a job. Support ordering by `overall_score`, `skill_match_score`, `experience_score`, `created_at`. Support filtering by `status`. Include `skill_matches` as nested serializer.
- `GET /api/candidates/<id>/` — full candidate detail with all scores, parsed_data, skill_matches, reasoning.
- `PATCH /api/candidates/<id>/` — update status (shortlist/reject)
- `POST /api/candidates/<id>/reprocess/` — re-run the AI pipeline on this candidate
- `GET /api/jobs/<job_id>/export/` — export candidates as CSV (name, email, overall_score, skill_match_score, experience_score, education_score, status)

### 6. AI Services (`candidates/services/`)

**parser.py — Resume Text Extraction:**
```python
import fitz  # PyMuPDF
from docx import Document

def extract_text(file_path: str) -> str:
    """Extract text from PDF or DOCX files."""
    if file_path.lower().endswith('.pdf'):
        doc = fitz.open(file_path)
        text = ""
        for page in doc:
            text += page.get_text()
        doc.close()
        return text.strip()
    elif file_path.lower().endswith('.docx'):
        doc = Document(file_path)
        return "\n".join([p.text for p in doc.paragraphs if p.text.strip()]).strip()
    else:
        raise ValueError(f"Unsupported file type: {file_path}")
```

**extractor.py — LLM Structured Data Extraction:**
Call Anthropic API with `claude-sonnet-4-5-20250514`. Prompt the model to extract structured JSON from the resume text:

```
{
  "name": "string",
  "email": "string or null",
  "phone": "string or null",
  "location": "string or null",
  "summary": "1-2 sentence professional summary",
  "skills": ["skill1", "skill2"],
  "experience": [
    {"company": "string", "title": "string", "duration": "string", "years": number, "highlights": ["string"]}
  ],
  "education": [
    {"institution": "string", "degree": "string", "year": number or null}
  ],
  "certifications": ["string"],
  "total_experience_years": number
}
```

Parse the response as JSON. If parsing fails, retry once. If it fails again, return a minimal dict with just the raw text.

**scorer.py — LLM Candidate Scoring:**
Call Anthropic API to score the candidate's parsed data against the job requirements. The prompt should instruct the model to return:

```
{
  "overall_score": 0-100,
  "skill_match_score": 0-100,
  "experience_score": 0-100,
  "education_score": 0-100,
  "reasoning": "2-3 sentence summary",
  "skill_matches": [
    {"skill_name": "string", "found": boolean, "proficiency": "none|beginner|intermediate|advanced|expert", "evidence": "string", "is_required": boolean}
  ],
  "strengths": ["string"],
  "red_flags": ["string"]
}
```

Scoring weights: 50% skills, 30% experience, 20% education. Required skills weighted 2x vs nice-to-have.

### 7. Celery Task (`candidates/tasks.py`)

```python
@shared_task(bind=True, max_retries=2, default_retry_delay=30)
def process_resume(self, candidate_id: int):
    """
    Full pipeline: extract text → parse structured data → score against job.
    Updates candidate status throughout: pending → processing → scored.
    On failure, resets to pending with error message in scoring_reasoning.
    """
```

The task should:
1. Set status to `processing`
2. Call `parser.extract_text()` → save to `resume_text`
3. Call `extractor.extract_resume_data()` → save to `parsed_data`, update name/email/phone
4. Call `scorer.score_candidate()` → save all scores, reasoning, strengths, red_flags
5. Create `SkillMatch` records for each skill
6. Set status to `scored`, set `processed_at`
7. On exception: set status back to `pending`, save error to `scoring_reasoning`, retry

### 8. Analytics (`analytics/views.py`)

- `GET /api/jobs/<job_id>/analytics/` — return:
  - `score_distribution`: histogram buckets (0-20, 20-40, 40-60, 60-80, 80-100) with counts
  - `skill_gap`: for each required skill, what % of candidates have it
  - `pipeline`: counts by status (pending, processing, scored, shortlisted, rejected)
  - `average_scores`: mean overall, skill, experience, education scores
  - `top_candidates`: top 5 by overall_score

### 9. URL Configuration

`config/urls.py`:
```python
urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/', include('jobs.urls')),
    path('api/', include('candidates.urls')),
    path('api/', include('analytics.urls')),
]
```

Wire up each app's urls.py with appropriate prefixes using DRF routers where applicable.

---

## FRONTEND SPECIFICATIONS (NEXT.JS 14 APP ROUTER)

### 1. Setup

- Next.js 14 with App Router (`src/` directory)
- TypeScript strict mode
- Tailwind CSS
- `next.config.js` should proxy API calls to Django:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
```

### 2. Route Groups & Layouts

Use Next.js route groups for clean layout separation:

- `(auth)` group — login/register pages with a centered, minimal layout (no sidebar)
- `(dashboard)` group — all authenticated pages with a sidebar + navbar layout
- Root `page.tsx` — public landing page with its own layout (marketing header + footer)

**`src/app/(dashboard)/layout.tsx`:**
This is the authenticated shell. It should:
- Render the `Sidebar` on the left (fixed, 256px wide, collapsible to 64px)
- Render the `Navbar` at top of the main content area
- Wrap children with `AuthGuard` that checks authStore and redirects to `/login` if not authenticated
- All dashboard components must be client components (`'use client'`) since they use hooks/state

### 3. Design System

Use a clean, modern, professional design:
- **Colors**: Slate grays for backgrounds/text, Indigo-600 as primary accent, Green for success/high scores, Yellow for medium scores, Red for low scores/warnings
- **Typography**: Inter font (import via `next/font/google`), clean hierarchy
- **Layout**: Sidebar navigation (collapsible) + main content area
- **Cards**: White background, subtle shadow, rounded-lg
- **Tables**: Striped rows, sticky header, hover highlight
- **Score visualization**: Colored progress bars (green > 70, yellow 40-70, red < 40)

Build a small set of reusable UI primitives in `components/ui/`:
- `Button.tsx` — variants: primary, secondary, danger, ghost. Sizes: sm, md, lg. Loading state with spinner.
- `Card.tsx` — wrapper with white bg, shadow, rounded corners, optional header/footer
- `Badge.tsx` — colored pill for status labels (scored=green, pending=yellow, rejected=red, processing=blue)
- `ProgressBar.tsx` — colored bar with percentage, color based on value thresholds
- `Toast.tsx` — success/error/info notifications, auto-dismiss
- `Modal.tsx` — centered overlay dialog with close button
- `Spinner.tsx` — loading spinner, sizes: sm, md, lg
- `EmptyState.tsx` — icon + message + optional CTA button for empty lists

### 4. TypeScript Types (`types/index.ts`)

Define interfaces for: `User`, `Job`, `JobCreate`, `Candidate`, `CandidateListItem`, `SkillMatch`, `ParsedResumeData`, `Experience`, `Education`, `AnalyticsData`, `ScoreDistribution`, `PipelineStats`, `AuthTokens`, `ApiError`, `PaginatedResponse<T>`

### 5. State Management (Zustand)

**authStore.ts:**
- `user`, `accessToken`, `refreshToken`
- `login()`, `register()`, `logout()`
- Persist tokens to localStorage (use Zustand persist middleware)
- `isAuthenticated` computed getter
- `hydrated` flag for SSR safety — prevent flash of unauthenticated content

**jobStore.ts:**
- `jobs[]`, `currentJob`, `loading`
- `fetchJobs()`, `createJob()`, `fetchJob(id)`

### 6. API Service Layer (`lib/`)

**api.ts:** Axios instance with:
- Base URL `/api` (proxied by Next.js rewrites to Django)
- Request interceptor: attach Bearer token from authStore
- Response interceptor: on 401, attempt token refresh. If refresh fails, logout and redirect to `/login` using `window.location.href` (not Next.js router, to ensure full state reset).

**authService.ts:** `register()`, `login()`, `refreshToken()`, `getProfile()`
**jobService.ts:** `getJobs()`, `createJob()`, `getJob(id)`, `updateJob()`, `deleteJob()`
**candidateService.ts:** `uploadResumes(jobId, files)`, `getCandidates(jobId, params)`, `getCandidate(id)`, `updateCandidateStatus(id, status)`, `reprocessCandidate(id)`, `exportCandidates(jobId)`

### 7. Pages

**`src/app/page.tsx` (Landing — Server Component):**
- Hero section with headline: "AI-Powered Resume Screening" and subtext about saving recruiter time
- 3 feature cards: Upload Resumes, AI Analysis, Ranked Results
- CTA button → /register
- Clean, professional, SaaS-style landing page
- This can be a Server Component for SEO benefits

**`src/app/(auth)/login/page.tsx` & `register/page.tsx` (Client Components):**
- `'use client'` at top
- Centered card with form fields
- Login: email/username + password
- Register: username, email, password, confirm password, company name
- Form validation, loading states, error display
- Link to switch between login/register
- On success: store tokens, redirect to `/dashboard`

**`src/app/(dashboard)/dashboard/page.tsx` (Client Component):**
- Grid of JobCards showing: title, status badge, candidate count, avg score, created date
- "Create New Job" button (prominent)
- Empty state if no jobs yet
- Search/filter by status

**`src/app/(dashboard)/jobs/new/page.tsx` (Client Component):**
- Large textarea for pasting job description
- Job title input
- On submit: call createJob API, which triggers backend skill extraction
- After creation, show extracted skills in editable tag format (SkillTagEditor)
- User can add/remove/edit skills before finalizing
- "Save & Upload Resumes" button → `router.push(/jobs/${id}/upload)`

**`src/app/(dashboard)/jobs/[id]/page.tsx` (THE MAIN SCREEN — Client Component):**
- Job header: title, status, created date, action buttons
- Tab navigation: Candidates | Analytics
- CandidateTable with columns: Rank, Name, Overall Score (progress bar), Skill Match, Experience, Education, Status (badge), Actions
- Sortable by clicking column headers
- Filter dropdown by status
- Bulk actions: select multiple → shortlist/reject
- "Upload More Resumes" button
- "Export CSV" button
- Click a row → `router.push(/candidates/${id})`

**`src/app/(dashboard)/jobs/[id]/upload/page.tsx` (Client Component):**
- Large drag-and-drop zone (react-dropzone)
- Accept .pdf and .docx only
- Show file list with names and sizes before upload
- Upload button → sends all files, shows individual progress bars
- After upload: show processing status for each file (pending → processing → scored)
- Poll every 3 seconds for status updates (usePolling hook)
- "View Rankings" button once processing is complete → `router.push(/jobs/${id})`

**`src/app/(dashboard)/candidates/[id]/page.tsx` (Client Component):**
- Header: candidate name, overall score (large), status badge
- Two column layout:
  - Left: Score breakdown
    - Radar chart (recharts RadarChart) with 3 axes: Skills, Experience, Education
    - Score cards for each dimension with progress bars
    - Strengths list (green bullets)
    - Red flags list (red bullets)
    - AI reasoning paragraph
  - Right: Resume details
    - Parsed data display: contact info, summary, skills tags
    - Experience timeline
    - Education section
    - Original resume text (scrollable, monospace)
- SkillMatchGrid: table of all required + nice-to-have skills with found/not-found status, proficiency badge, and evidence text
- Action buttons: Shortlist, Reject, Reprocess
- Back button → return to job detail

**`src/app/(dashboard)/jobs/[id]/analytics/page.tsx` (Client Component):**
- Score distribution histogram (recharts BarChart)
- Skill gap analysis: horizontal bar chart showing % of candidates with each required skill
- Pipeline funnel: visual showing counts at each status stage
- Top 5 candidates mini-table
- Average scores summary cards

### 8. Key Components

**AuthGuard.tsx:**
```typescript
'use client';
// Wraps dashboard layout
// Reads authStore.isAuthenticated and authStore.hydrated
// If not hydrated yet, show full-page spinner
// If hydrated but not authenticated, redirect to /login
// If authenticated, render children
```

**Sidebar.tsx:**
- Fixed left sidebar, 256px wide
- Logo/app name at top
- Navigation links: Dashboard, Create Job (with icons)
- Active link highlighted with indigo background
- Collapse toggle button at bottom → shrinks to 64px showing only icons
- User name + logout button at bottom

**CandidateTable.tsx:**
- Sortable columns (click header to toggle asc/desc, show arrow indicator)
- Score columns show colored ProgressBar components
- Status shown as Badge components
- Checkbox column for bulk selection
- Bulk action bar appears when items are selected
- Pagination at bottom (page numbers + prev/next)
- Loading skeleton state while fetching

**DropZone.tsx:**
- Uses react-dropzone
- Large dashed border area with drag-active highlight state
- Icon + "Drag & drop resumes here or click to browse"
- File type restriction: .pdf, .docx
- Max file size: 10MB
- Show selected files as removable chips/cards before upload
- File count indicator

**ScoreRadar.tsx:**
- recharts RadarChart with 3 data points: Skills, Experience, Education
- Filled area with indigo-600 at 30% opacity
- Score labels at each point
- Responsive sizing

**SkillMatchGrid.tsx:**
- Grid/table of skills
- Each skill shows: name, found (checkmark/x icon), proficiency (colored Badge), evidence (tooltip or expandable row)
- Required skills section separated from nice-to-have
- Sort: required first, then by found status

**SkillTagEditor.tsx:**
- Two sections: Required Skills, Nice-to-Have Skills
- Skills shown as removable tag chips (x button to remove)
- Input field to add new skills (Enter to add)
- Click a tag to toggle between required and nice-to-have

### 9. Hooks

**useAuth.ts:**
- Wraps authStore actions
- Provides `login()`, `register()`, `logout()` with loading/error state
- Handles redirect after login/register

**useJobs.ts:**
- `fetchJobs()`, `createJob()`, `fetchJob(id)`
- Returns `jobs`, `currentJob`, `loading`, `error`

**useCandidates.ts:**
- `fetchCandidates(jobId, params)`, `fetchCandidate(id)`
- `uploadResumes(jobId, files)` — returns upload progress per file
- `updateStatus(id, status)`, `reprocess(id)`, `exportCSV(jobId)`
- Returns `candidates`, `currentCandidate`, `loading`, `error`

**usePolling.ts:**
```typescript
// Takes: fetcher function, interval in ms, shouldStop condition
// Returns: data, loading, error, isPolling
// Auto-stops when shouldStop returns true (e.g., all candidates scored)
// Cleans up interval on unmount
```

### 10. Responsive Design

- Sidebar collapses to bottom tab bar on mobile (< 768px)
- Tables become card-based layouts on mobile
- Upload zone fills full width on mobile
- Charts resize responsively using recharts ResponsiveContainer
- Two-column candidate detail becomes single column on mobile

---

## DOCKER COMPOSE

```yaml
version: '3.8'
services:
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: resume_screener
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  backend:
    build: ./backend
    command: >
      sh -c "python manage.py migrate &&
             python manage.py runserver 0.0.0.0:8000"
    volumes:
      - ./backend:/app
      - media_data:/app/media
    ports:
      - "8000:8000"
    env_file: ./backend/.env
    depends_on:
      - db
      - redis

  celery:
    build: ./backend
    command: celery -A config worker -l info --concurrency=2
    volumes:
      - ./backend:/app
      - media_data:/app/media
    env_file: ./backend/.env
    depends_on:
      - db
      - redis

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    volumes:
      - ./frontend:/app
      - /app/node_modules
      - /app/.next
    depends_on:
      - backend

volumes:
  postgres_data:
  media_data:
```

**backend/Dockerfile:**
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
```

**frontend/Dockerfile:**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json .
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]
```

---

## ENVIRONMENT FILES

**backend/.env:**
```env
SECRET_KEY=django-insecure-change-this-in-production-abc123
DEBUG=True
DB_NAME=resume_screener
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=db
DB_PORT=5432
REDIS_URL=redis://redis:6379/0
ANTHROPIC_API_KEY=your-api-key-here
ALLOWED_HOSTS=localhost,127.0.0.1,0.0.0.0
```

**frontend/.env.local:**
```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

---

## .gitignore

```
# Python
__pycache__/
*.pyc
.env
venv/
*.egg-info/
db.sqlite3

# Node
node_modules/
.next/
out/
dist/
.env.local

# IDE
.vscode/
.idea/

# OS
.DS_Store

# Media
media/
```

---

## IMPLEMENTATION ORDER

Build in this exact order so each piece is testable before moving on:

1. **Backend foundation**: Django project + settings + celery config + all models + migrations. Verify `python manage.py migrate` works.
2. **Auth system**: User model, register/login/refresh/me endpoints + serializers. Test with curl or Postman.
3. **Jobs API**: Job CRUD with skill extraction on create. Test creating a job with a JD.
4. **Candidates API**: Upload endpoint + Candidate model. Test file upload (without AI yet).
5. **AI Pipeline**: parser.py → extractor.py → scorer.py → Celery task. Test end-to-end processing.
6. **Next.js setup**: Initialize project, configure tailwind, set up next.config.js rewrites, create route groups and layouts.
7. **Frontend auth**: Login/Register pages + API layer + authStore + AuthGuard.
8. **Frontend jobs**: Dashboard + JobCreate page + SkillTagEditor.
9. **Frontend upload**: ResumeUpload page + DropZone + UploadProgress + usePolling.
10. **Frontend rankings**: JobDetail page + CandidateTable (the most important screen — make it great).
11. **Frontend candidate detail**: CandidatePage + ScoreRadar + SkillMatchGrid.
12. **Analytics**: Backend aggregation endpoint + frontend charts page.
13. **UI components**: Build out the ui/ primitives and apply consistently.
14. **Docker**: Dockerfiles + docker-compose + verify full stack runs.
15. **Polish**: Loading skeletons, error boundaries, empty states, responsive tweaks, toast notifications.

## IMPORTANT NOTES

- All dashboard pages must be client components (`'use client'`) since they use hooks, state, and browser APIs.
- The landing page (`src/app/page.tsx`) can be a Server Component for SEO.
- Use `next/navigation` for `useRouter`, `useParams`, `useSearchParams` — NOT `next/router` (that's Pages Router).
- Use `next/link` for navigation links in the sidebar and navbar.
- Use `next/font/google` to load Inter font in the root layout.
- Always handle AI/LLM API errors gracefully — the app should never crash if the AI call fails. Show meaningful error states instead.
- All API responses should use consistent error format: `{"detail": "error message"}` or `{"field_name": ["error"]}`.
- Frontend should show toast notifications for success/error on mutations.
- Use environment variables for ALL secrets, never hardcode.
- Every list endpoint should support pagination.
- The candidate ranking table is the most important UI — make it polished, fast, and intuitive.
- For SSR hydration safety: wrap localStorage access in `typeof window !== 'undefined'` checks, or use Zustand's `onRehydrateStorage` to handle hydration properly.

## PROMPT END
