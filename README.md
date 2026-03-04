# AI Resume Screener

An AI-powered resume screening application that helps recruiters efficiently evaluate candidates. Upload resumes (PDF/DOCX), paste job descriptions, and let AI extract skills, score candidates, and rank them automatically.

## Tech Stack

- **Backend:** Python 3.9+, Django 4.2, Django REST Framework, SQLite/PostgreSQL, Celery + Redis
- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Zustand, Recharts
- **AI:** Anthropic Claude API for skill extraction, resume parsing, and candidate scoring

## Quick Start (Local Development)

### 1. Backend Setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Configure environment
cp .env.example .env   # or edit .env directly
# Add your ANTHROPIC_API_KEY to .env

# Run migrations
python manage.py migrate

# Create superuser (optional)
python manage.py createsuperuser

# Start server
python manage.py runserver
```

### 2. Frontend Setup

```bash
cd frontend
npm install

# Start dev server
npm run dev
```

### 3. Celery Worker (for async resume processing)

If you have Redis installed locally:
```bash
cd backend
source venv/bin/activate
celery -A config worker -l info
```

If you don't have Redis, add `CELERY_TASK_ALWAYS_EAGER=True` to your `.env` to process resumes synchronously.

### 4. Open the App

Visit [http://localhost:3000](http://localhost:3000)

## Optional: Docker Setup

```bash
docker compose up --build
```

This starts PostgreSQL, Redis, Django, Celery, and Next.js — all pre-configured.

## Features

- **Job Management** — Create jobs, paste descriptions, and AI extracts required skills
- **Resume Upload** — Drag & drop PDF/DOCX files with batch processing
- **AI Scoring** — Candidates scored on skills (50%), experience (30%), education (20%)
- **Ranking Table** — Sort by any score, filter by status, bulk shortlist/reject
- **Candidate Detail** — Radar chart, skill match grid, strengths, red flags, AI reasoning
- **Analytics** — Score distribution, skill gap analysis, pipeline stats
- **CSV Export** — Download candidate data as CSV

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SECRET_KEY` | Django secret key | Set in .env |
| `DB_ENGINE` | `sqlite3` or `postgresql` | `sqlite3` |
| `ANTHROPIC_API_KEY` | Claude API key for AI features | Required |
| `REDIS_URL` | Redis connection URL | `redis://localhost:6379/0` |
| `CELERY_TASK_ALWAYS_EAGER` | Process tasks synchronously | `False` |
