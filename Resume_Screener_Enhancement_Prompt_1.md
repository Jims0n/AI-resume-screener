# AI Resume Screener — Enhancement Prompt (Backend First, Then Frontend)

Copy everything below the line into your IDE as a single prompt. Work through backend enhancements first, then frontend.

---

## PROMPT START

We have a working AI Resume Screener (MVP) built with Django REST Framework (backend) and Next.js 14 App Router (frontend). The core flow works: users register, create jobs with AI skill extraction, upload resumes (PDF/DOCX), the Celery pipeline processes and scores candidates, and the frontend displays rankings and candidate details.

Now we need to enhance this into a production-ready, sellable SaaS product. Work through the backend improvements first, then the frontend improvements.

---

## PART 1: BACKEND ENHANCEMENTS

### 1.1 — Multi-Tenancy & Organization Model

Add an Organization model so multiple users can belong to the same company and share jobs/candidates.

```python
# accounts/models.py — add these models

class Organization(models.Model):
    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    logo = models.ImageField(upload_to='org_logos/', blank=True, null=True)
    plan = models.CharField(max_length=20, choices=[
        ('free', 'Free'),
        ('starter', 'Starter'),
        ('professional', 'Professional'),
        ('enterprise', 'Enterprise'),
    ], default='free')
    max_jobs = models.IntegerField(default=3)          # Free tier limit
    max_resumes_per_job = models.IntegerField(default=10)  # Free tier limit
    max_users = models.IntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)

class User(AbstractUser):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='members', null=True, blank=True)
    company = models.CharField(max_length=255, blank=True)  # keep for backward compat
    role = models.CharField(max_length=50, choices=[
        ('owner', 'Owner'),
        ('admin', 'Admin'),
        ('recruiter', 'Recruiter'),
        ('hiring_manager', 'Hiring Manager'),
        ('viewer', 'Viewer'),
    ], default='recruiter')
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    is_active = models.BooleanField(default=True)
```

Update the Job model to belong to an Organization (not just a User):
```python
class Job(models.Model):
    organization = models.ForeignKey('accounts.Organization', on_delete=models.CASCADE, related_name='jobs')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='created_jobs')
    # ... rest of existing fields
```

Update all querysets to filter by `request.user.organization` so users only see their org's data.

On registration, auto-create an Organization with the user as owner. Add an invite system:
- `POST /api/org/invite/` — owner/admin sends invite email (store invite token)
- `POST /api/org/join/` — accept invite with token, join the organization

### 1.2 — Usage Limits & Plan Enforcement

Create a middleware or decorator that enforces plan limits:

```python
# accounts/permissions.py

class PlanLimitMixin:
    """Check organization plan limits before allowing actions."""

    def check_job_limit(self, organization):
        if organization.jobs.filter(status='active').count() >= organization.max_jobs:
            raise PermissionDenied({
                "detail": "Job limit reached for your plan.",
                "upgrade_required": True,
                "current_plan": organization.plan,
                "limit": organization.max_jobs
            })

    def check_resume_limit(self, job):
        if job.candidates.count() >= job.organization.max_resumes_per_job:
            raise PermissionDenied({
                "detail": "Resume upload limit reached for this job.",
                "upgrade_required": True,
                "current_plan": job.organization.plan,
                "limit": job.organization.max_resumes_per_job
            })
```

Plan tiers:
- **Free**: 3 active jobs, 10 resumes per job, 1 user, basic scoring
- **Starter** ($29/mo): 10 active jobs, 50 resumes per job, 3 users, priority processing
- **Professional** ($79/mo): Unlimited jobs, 200 resumes per job, 10 users, advanced analytics, API access, custom scoring weights
- **Enterprise** ($199/mo): Unlimited everything, SSO, dedicated support, custom integrations

Apply these checks in the Job create view and Resume upload view.

### 1.3 — Improved AI Pipeline

**A. Custom Scoring Weights:**
Add to the Job model:
```python
class Job(models.Model):
    # ... existing fields
    skill_weight = models.FloatField(default=0.5)      # 0-1
    experience_weight = models.FloatField(default=0.3)  # 0-1
    education_weight = models.FloatField(default=0.2)   # 0-1
    custom_criteria = models.JSONField(default=list)     # e.g. [{"name": "Leadership", "weight": 0.1, "description": "..."}]
```

Pass these weights to the scorer service so the LLM uses them in scoring.

**B. Batch Processing Optimization:**
When multiple resumes are uploaded at once, create a batch record:

```python
class ProcessingBatch(models.Model):
    job = models.ForeignKey('jobs.Job', on_delete=models.CASCADE, related_name='batches')
    total_count = models.IntegerField(default=0)
    processed_count = models.IntegerField(default=0)
    failed_count = models.IntegerField(default=0)
    status = models.CharField(max_length=20, choices=[
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('partial', 'Partially Completed'),
    ], default='processing')
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
```

Update the Celery task to update the batch record as each resume completes. Add a batch status endpoint:
- `GET /api/batches/<batch_id>/` — returns batch progress

**C. Comparison Notes:**
Add a field for recruiters to add their own notes on candidates:
```python
class CandidateNote(models.Model):
    candidate = models.ForeignKey(Candidate, on_delete=models.CASCADE, related_name='notes')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

Endpoints:
- `GET /api/candidates/<id>/notes/` — list notes
- `POST /api/candidates/<id>/notes/` — add note
- `PATCH /api/notes/<id>/` — edit note
- `DELETE /api/notes/<id>/` — delete note

### 1.4 — Webhooks & Notifications

Create a simple notification system:

```python
class Notification(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    type = models.CharField(max_length=50, choices=[
        ('processing_complete', 'Processing Complete'),
        ('batch_complete', 'Batch Complete'),
        ('candidate_shortlisted', 'Candidate Shortlisted'),
        ('plan_limit_warning', 'Plan Limit Warning'),
    ])
    title = models.CharField(max_length=255)
    message = models.TextField()
    data = models.JSONField(default=dict)  # e.g. {"job_id": 1, "candidate_id": 5}
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
```

Endpoints:
- `GET /api/notifications/` — list user's notifications (unread first)
- `PATCH /api/notifications/<id>/read/` — mark as read
- `POST /api/notifications/read-all/` — mark all as read
- `GET /api/notifications/unread-count/` — return count of unread

Trigger notifications from the Celery task when processing completes, and from views when relevant actions occur.

### 1.5 — Activity Log / Audit Trail

Track important actions for accountability:

```python
class ActivityLog(models.Model):
    organization = models.ForeignKey('accounts.Organization', on_delete=models.CASCADE)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    action = models.CharField(max_length=50)  # 'created_job', 'uploaded_resumes', 'shortlisted', 'rejected', etc.
    target_type = models.CharField(max_length=50)  # 'job', 'candidate', 'user'
    target_id = models.IntegerField()
    details = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
```

Log actions in views using a helper: `log_activity(request.user, 'shortlisted', 'candidate', candidate.id, {"job_title": job.title})`

Endpoint:
- `GET /api/activity/` — list activity for the org (paginated, filterable by action and target_type)

### 1.6 — Candidate Comparison Endpoint

Add a dedicated comparison endpoint:
- `POST /api/jobs/<job_id>/compare/` — body: `{"candidate_ids": [1, 2, 3]}`
- Returns all selected candidates with their full scores, skill matches, and a new AI-generated comparison summary

The comparison summary calls the Anthropic API with all candidates' parsed data and asks for a structured comparison highlighting relative strengths, who's best for what, and a recommendation. Return as:
```json
{
  "candidates": [...full candidate data...],
  "comparison_summary": "string — AI analysis of relative strengths",
  "recommendation": "string — who to prioritize and why",
  "comparison_matrix": {
    "skill_name": {"candidate_1": "advanced", "candidate_2": "intermediate"}
  }
}
```

### 1.7 — Email Integration

Add ability to send shortlist/rejection emails directly from the platform:

```python
class EmailTemplate(models.Model):
    organization = models.ForeignKey('accounts.Organization', on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    type = models.CharField(max_length=20, choices=[
        ('shortlist', 'Shortlist'),
        ('rejection', 'Rejection'),
        ('interview_invite', 'Interview Invite'),
        ('custom', 'Custom'),
    ])
    subject = models.CharField(max_length=255)
    body = models.TextField()  # Supports placeholders: {{candidate_name}}, {{job_title}}, {{company_name}}
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
```

Endpoints:
- `GET /api/email-templates/` — list org's templates
- `POST /api/email-templates/` — create template
- `POST /api/candidates/<id>/send-email/` — send email using template, with placeholder replacement
- `POST /api/jobs/<job_id>/bulk-email/` — send to multiple candidates

Use Django's email backend. Store sent emails in a `SentEmail` model for tracking.

### 1.8 — API Rate Limiting

Add throttling to protect the AI endpoints:

```python
# config/settings.py
REST_FRAMEWORK = {
    # ... existing config
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.UserRateThrottle',
        'rest_framework.throttling.ScopedRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'user': '100/hour',
        'upload': '20/hour',
        'ai_reprocess': '10/hour',
    }
}
```

Apply `throttle_scope = 'upload'` to the resume upload view and `throttle_scope = 'ai_reprocess'` to the reprocess view.

### 1.9 — Search & Advanced Filtering

Add full-text search across candidates:
- `GET /api/jobs/<job_id>/candidates/?search=python+django` — search resume_text and parsed_data
- `GET /api/jobs/<job_id>/candidates/?min_score=70&max_score=100` — score range filter
- `GET /api/jobs/<job_id>/candidates/?skills=Python,React` — filter by specific skills found
- `GET /api/jobs/<job_id>/candidates/?experience_min=3` — minimum years of experience

Use Django's `SearchVector` and `SearchQuery` for PostgreSQL full-text search on `resume_text`.

### 1.10 — Data Export Improvements

Enhance the CSV export and add PDF report generation:
- `GET /api/jobs/<job_id>/export/?format=csv` — current CSV export
- `GET /api/jobs/<job_id>/export/?format=pdf` — generate a PDF report with:
  - Job summary
  - Score distribution chart (generate as image server-side using matplotlib)
  - Top candidates table
  - Skill gap analysis
- `GET /api/candidates/<id>/export/pdf/` — individual candidate PDF report

---

## PART 2: FRONTEND ENHANCEMENTS

### 2.1 — Onboarding Flow

After registration, show a guided onboarding:
1. **Welcome screen** — "Welcome to [App Name]! Let's set up your first screening."
2. **Organization setup** — company name, logo upload (optional)
3. **Create first job** — pre-fill with a sample JD as placeholder, guide through skill editing
4. **Upload resumes** — drag & drop with encouraging copy
5. **View results** — redirect to rankings when processing completes

Use a stepper/progress bar at top. Store onboarding completion status in the user profile. Show this only on first login.

### 2.2 — Enhanced Dashboard

Upgrade the dashboard from a simple job list to an overview:
- **Stats row at top**: Total active jobs, Total candidates screened, Average score across all jobs, Shortlist rate (%)
- **Recent activity feed**: "Israel Oyeboade scored 92 on Senior Backend Developer — 2 hours ago"
- **Job cards**: Keep current design but add a mini progress bar showing how many candidates are scored vs total
- **Quick actions**: "Create Job" and "Upload Resumes to [most recent job]"

### 2.3 — Side-by-Side Candidate Comparison

New page/modal: `/jobs/:id/compare?candidates=1,2,3`
- Select 2-3 candidates from the ranking table using checkboxes
- Click "Compare Selected" button
- Shows a comparison view:
  - Column per candidate with photo placeholder, name, overall score
  - Skill-by-skill comparison rows (green checkmark vs red X, with proficiency levels)
  - Experience comparison
  - Education comparison
  - AI-generated comparison summary at the bottom
  - "Best for this role" recommendation highlighted

### 2.4 — Notification Bell

Add a notification bell icon in the Navbar:
- Show unread count badge (red circle with number)
- Click opens a dropdown panel with recent notifications
- Each notification is clickable — navigates to the relevant job/candidate
- "Mark all as read" link at top
- Poll for new notifications every 30 seconds (or use the existing polling hook)

### 2.5 — Candidate Notes & Collaboration

On the candidate detail page, add a notes/comments section:
- Threaded comments area below the scores
- Shows commenter name, avatar, timestamp
- Edit/delete own comments
- Real-time-ish updates (poll every 10 seconds when on the page)
- This is critical for team collaboration — multiple recruiters discussing candidates

### 2.6 — Email Actions

Add email functionality to the candidate detail page and ranking table:
- On candidate detail: "Send Email" button opens a modal with:
  - Template selector dropdown
  - Pre-filled subject and body with placeholders replaced
  - Editable before sending
  - Send button
- On ranking table: bulk select → "Email Selected" → choose template → preview → send
- Sent email history on candidate detail page

### 2.7 — Settings Pages

Add a settings section accessible from the sidebar:
- **Profile**: Edit name, email, avatar
- **Organization**: Edit org name, logo, view plan details
- **Team**: List members, invite new members (email input), remove members, change roles
- **Email Templates**: CRUD for email templates with placeholder guide
- **Billing**: Current plan display, upgrade buttons, usage stats (jobs used / limit, resumes used / limit)
- **Scoring Defaults**: Set default scoring weights for new jobs

Route: `/settings/*` with sub-navigation tabs

### 2.8 — Improved Job Creation Flow

Enhance the create job page:
- Step 1: **Job Details** — title, department (optional), location (optional), job type (full-time/part-time/contract)
- Step 2: **Paste Job Description** — large textarea, OR upload a JD file (PDF/DOCX), OR URL to job posting
- Step 3: **Review AI-Extracted Skills** — show extracted required and nice-to-have skills in SkillTagEditor, let user adjust. Show scoring weight sliders (Skills %, Experience %, Education %)
- Step 4: **Custom Criteria** (optional) — add custom evaluation criteria beyond the defaults (e.g., "Leadership experience", "Open source contributions")
- Step 5: **Confirmation** — summary of everything before creating

Use a multi-step form with a progress stepper. Save draft state so users can come back.

### 2.9 — Enhanced Analytics Page

Make the analytics page more comprehensive:
- **Score Distribution**: Interactive histogram — click a bar to filter candidates to that score range
- **Skill Gap Analysis**: Horizontal bars showing % of candidates with each skill. Color code: green (>70% have it), yellow (30-70%), red (<30%)
- **Experience Distribution**: Pie chart of years of experience ranges
- **Education Breakdown**: Pie chart of degree types
- **Pipeline Funnel**: Visual funnel — Uploaded → Scored → Shortlisted → Emailed → (future: Hired)
- **Top Skills Found**: Word cloud or bar chart of most common skills across all candidates
- **Time to Screen**: Average time from upload to scored
- **Comparison with previous jobs**: If user has multiple jobs, show trends

### 2.10 — Loading States & Micro-Interactions

Polish the UX with:
- **Skeleton loaders** on all pages that fetch data (not just spinners)
- **Optimistic updates** for status changes (shortlist/reject) — update UI immediately, revert on error
- **Smooth transitions** between pages (subtle fade or slide)
- **Confetti animation** when first batch of resumes finishes processing (just once, as a delight)
- **Progress toast** during resume upload showing "Uploading 3/5 resumes..."
- **Hover previews** on candidate rows — show a mini card with top skills and score on hover
- **Keyboard shortcuts**: `S` to shortlist, `R` to reject, `N` for next candidate, `P` for previous (on candidate detail page)
- **Empty states**: Custom illustrations/icons + helpful CTAs for each empty page (no jobs, no candidates, no analytics)

### 2.11 — Dark Mode

Add a dark mode toggle in the navbar:
- Store preference in localStorage
- Apply Tailwind `dark:` classes throughout
- Respect system preference by default (`prefers-color-scheme`)
- Smooth transition when toggling

### 2.12 — Mobile Responsiveness

Make sure everything works well on mobile:
- Sidebar becomes bottom tab bar on mobile (Dashboard, Create, Settings)
- Candidate table becomes a card list on mobile (score prominently displayed)
- Candidate detail becomes single-column stack
- Upload zone is full-width and touch-friendly
- Charts resize with ResponsiveContainer
- Modal dialogs become full-screen on mobile

---

## IMPLEMENTATION ORDER

1. Backend: Organization model + multi-tenancy (1.1)
2. Backend: Usage limits + plan enforcement (1.2)
3. Backend: Custom scoring weights + batch processing (1.3)
4. Backend: Candidate notes (1.3C)
5. Backend: Notifications (1.4)
6. Backend: Activity log (1.5)
7. Backend: Candidate comparison endpoint (1.6)
8. Backend: Search + advanced filtering (1.9)
9. Backend: Email templates + sending (1.7)
10. Backend: Rate limiting (1.8)
11. Backend: Export improvements (1.10)
12. Frontend: Onboarding flow (2.1)
13. Frontend: Enhanced dashboard (2.2)
14. Frontend: Notification bell (2.4)
15. Frontend: Candidate notes (2.5)
16. Frontend: Side-by-side comparison (2.3)
17. Frontend: Improved job creation flow (2.8)
18. Frontend: Settings pages (2.7)
19. Frontend: Email actions (2.6)
20. Frontend: Enhanced analytics (2.9)
21. Frontend: Loading states + micro-interactions (2.10)
22. Frontend: Dark mode (2.11)
23. Frontend: Mobile responsiveness (2.12)

## IMPORTANT NOTES

- Maintain backward compatibility — existing endpoints should still work after enhancements.
- Every new endpoint needs proper authentication and organization-scoped queryset filtering.
- Run migrations carefully — use `RunPython` for data migrations when adding the Organization model to existing users.
- All new features should have proper loading, error, and empty states on the frontend.
- Test plan limit enforcement thoroughly — this is critical for monetization.
- Keep the PATCH trailing slash error in mind (seen in the terminal). Either set `APPEND_SLASH = False` in Django settings or ensure all frontend API calls include trailing slashes.

## PROMPT END
