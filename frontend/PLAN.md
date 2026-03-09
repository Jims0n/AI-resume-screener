# Frontend Enhancement Plan — AI Resume Screener

## Overview
Transform the MVP frontend into a production-ready SaaS product across 10 phases. Each phase builds on the previous, starting with foundation work and ending with polish.

---

## Phase 1: Foundation — Types, Services, Dark Mode Infrastructure
**Goal:** Update type system, add all new API services, set up dark mode, and add new npm packages.

### New packages to install:
- `canvas-confetti` — for confetti animation (lightweight, ~4KB)
- `clsx` — for conditional classnames (tiny utility)

### Files to modify:
- **`src/types/index.ts`** — Add: Organization, OrganizationInvite, ActivityLog, Notification, CandidateNote, ProcessingBatch, EmailTemplate, SentEmail, ComparisonResult types. Update User to include `organization`, `avatar`, expanded role choices. Update Job to include `skill_weight`, `experience_weight`, `education_weight`, `custom_criteria`, `created_by_email`. Update CandidateListItem to include `note_count`. Remove `resume_file` from Candidate (use `resume_url` only).
- **`tailwind.config.ts`** — Enable `darkMode: 'class'`, extend theme with custom colors and animations.
- **`src/app/globals.css`** — Add dark mode CSS variables, skeleton animation, confetti keyframes, page transition classes.

### New files to create:
- **`src/lib/organizationService.ts`** — getOrganization, updateOrganization, getMembers, updateMember, removeMember, createInvite, getInvites, cancelInvite, joinOrganization
- **`src/lib/notificationService.ts`** — getNotifications, markRead, markAllRead, getUnreadCount
- **`src/lib/emailTemplateService.ts`** — getTemplates, createTemplate, updateTemplate, deleteTemplate, sendCandidateEmail, sendBulkEmail, getSentEmails
- **`src/lib/activityService.ts`** — getActivityLog (with filters)
- **`src/lib/noteService.ts`** — getNotes, createNote, updateNote, deleteNote
- **`src/lib/comparisonService.ts`** — compareCandidates
- **`src/lib/batchService.ts`** — getBatch
- **`src/store/themeStore.ts`** — Zustand store for dark mode (persisted to localStorage, respects system preference)
- **`src/hooks/useTheme.ts`** — Hook wrapping themeStore, applies `dark` class to document
- **`src/hooks/useNotifications.ts`** — Hook for notification fetching + polling
- **`src/hooks/useKeyboardShortcuts.ts`** — Generic keyboard shortcut hook
- **`src/components/ui/Skeleton.tsx`** — Reusable skeleton loader component (rect, circle, text variants)
- **`src/components/ui/ThemeToggle.tsx`** — Dark/light mode toggle button with sun/moon icon

---

## Phase 2: Layout & Navigation Enhancements
**Goal:** Upgrade Sidebar with new nav items, add notification bell to Navbar, add dark mode toggle, improve mobile responsiveness of the shell.

### Files to modify:
- **`src/components/layout/Navbar.tsx`** — Add notification bell with unread count badge, dark mode toggle, improve mobile layout
- **`src/components/layout/Sidebar.tsx`** — Add Settings link, update styling for dark mode, improve mobile bottom bar (add Settings tab)
- **`src/app/(dashboard)/layout.tsx`** — Add ThemeProvider context, sidebar collapse state handling
- **`src/components/layout/AuthGuard.tsx`** — Use skeleton instead of spinner during loading

### New files to create:
- **`src/components/layout/NotificationBell.tsx`** — Bell icon with badge, dropdown panel with notification list, mark-all-read, click-to-navigate, polls every 30s using usePolling
- **`src/components/layout/NotificationDropdown.tsx`** — The actual dropdown panel rendering notification items

---

## Phase 3: Settings Pages
**Goal:** Full settings section with sub-navigation tabs.

### New files to create:
- **`src/app/(dashboard)/settings/layout.tsx`** — Settings layout with tab navigation (Profile, Organization, Team, Email Templates, Scoring)
- **`src/app/(dashboard)/settings/profile/page.tsx`** — Edit name, email, avatar upload
- **`src/app/(dashboard)/settings/organization/page.tsx`** — Edit org name, logo, view plan limits
- **`src/app/(dashboard)/settings/team/page.tsx`** — Member list, invite form (email+role), remove members, change roles. Shows pending invites.
- **`src/app/(dashboard)/settings/email-templates/page.tsx`** — CRUD for email templates with placeholder guide ({candidate_name}, {job_title}, etc.)
- **`src/app/(dashboard)/settings/scoring/page.tsx`** — Default scoring weight sliders (skill/experience/education), saved to localStorage or org settings
- **`src/components/settings/MemberRow.tsx`** — Single member row with role dropdown and remove button
- **`src/components/settings/InviteForm.tsx`** — Email + role input for inviting new members
- **`src/components/settings/TemplateEditor.tsx`** — Email template form with name, type, subject, body fields + placeholder reference

### Files to modify:
- **`src/lib/authService.ts`** — Add `updateProfile(data)` method

---

## Phase 4: Enhanced Dashboard
**Goal:** Upgrade from simple job grid to comprehensive overview with stats, activity, and quick actions.

### Files to modify:
- **`src/app/(dashboard)/dashboard/page.tsx`** — Complete rewrite: stats row, activity feed, improved job cards with mini progress bars, quick action buttons

### New files to create:
- **`src/components/dashboard/StatsRow.tsx`** — 4 stat cards: Active Jobs, Total Candidates, Avg Score, Shortlist Rate
- **`src/components/dashboard/ActivityFeed.tsx`** — Recent activity log items with relative timestamps and action icons
- **`src/components/dashboard/JobCard.tsx`** — Enhanced job card with candidate count progress bar, scoring summary, status badge, quick links
- **`src/components/dashboard/QuickActions.tsx`** — "Create Job" and "Upload to [Recent Job]" buttons

### Files to modify:
- **`src/lib/candidateService.ts`** — Add method to fetch dashboard stats (aggregate from existing endpoints)

---

## Phase 5: Improved Job Creation Flow
**Goal:** Transform 2-step form into 5-step guided flow with weight sliders and custom criteria.

### Files to modify:
- **`src/app/(dashboard)/jobs/new/page.tsx`** — Complete rewrite: 5-step form with stepper

### New files to create:
- **`src/components/jobs/JobCreationStepper.tsx`** — Progress stepper component (Step 1-5 with labels)
- **`src/components/jobs/StepJobDetails.tsx`** — Title, department, location, job type fields
- **`src/components/jobs/StepDescription.tsx`** — Large textarea for JD with paste/upload option
- **`src/components/jobs/StepSkillReview.tsx`** — AI-extracted skills with tag editor, weight sliders (Skills %, Experience %, Education %) with sum validation
- **`src/components/jobs/StepCustomCriteria.tsx`** — Add/remove custom evaluation criteria
- **`src/components/jobs/StepConfirmation.tsx`** — Summary of all entered data before creating
- **`src/components/ui/Slider.tsx`** — Range slider component for scoring weights
- **`src/components/ui/Stepper.tsx`** — Generic multi-step stepper/progress component (reusable for onboarding too)
- **`src/hooks/useMultiStepForm.ts`** — Hook managing step state, validation, draft saving to localStorage

---

## Phase 6: Candidate Enhancements — Notes, Comparison, Email
**Goal:** Add notes/collaboration, side-by-side comparison, and email actions.

### Files to modify:
- **`src/app/(dashboard)/candidates/[id]/page.tsx`** — Add notes section, email send button, sent email history tab
- **`src/app/(dashboard)/jobs/[id]/page.tsx`** — Add candidate selection checkboxes, "Compare Selected" button, "Email Selected" button

### New files to create:
- **`src/app/(dashboard)/jobs/[id]/compare/page.tsx`** — Side-by-side comparison page: columns per candidate, skill matrix, AI summary, recommendation highlight
- **`src/components/candidates/NotesSection.tsx`** — Threaded notes with add/edit/delete, polls every 10s, shows commenter name+avatar+timestamp
- **`src/components/candidates/NoteItem.tsx`** — Single note with edit/delete for own notes
- **`src/components/candidates/ComparisonTable.tsx`** — Comparison matrix rendering (skills, scores, experience, education)
- **`src/components/candidates/SendEmailModal.tsx`** — Template selector dropdown, pre-filled subject/body, editable, send button
- **`src/components/candidates/BulkEmailModal.tsx`** — Similar but for multiple candidates from job page
- **`src/components/candidates/SentEmailHistory.tsx`** — List of sent emails for a candidate with status badges
- **`src/components/candidates/CandidateCheckbox.tsx`** — Selection checkbox for bulk actions
- **`src/hooks/useNotes.ts`** — Hook for CRUD notes with polling
- **`src/hooks/useEmails.ts`** — Hook for email template selection, sending, history

---

## Phase 7: Notification System
**Goal:** Full notification experience beyond just the bell.

### New files to create:
- **`src/app/(dashboard)/notifications/page.tsx`** — Full notification list page with filters (all, unread), clickable items
- **`src/components/notifications/NotificationItem.tsx`** — Single notification with icon, title, message, timestamp, read status, click handler

---

## Phase 8: Enhanced Analytics
**Goal:** Richer, more interactive analytics page.

### Files to modify:
- **`src/app/(dashboard)/jobs/[id]/analytics/page.tsx`** — Major upgrade: interactive charts, more visualizations

### New files to create:
- **`src/components/analytics/ScoreHistogram.tsx`** — Interactive bar chart (click bar to filter candidates)
- **`src/components/analytics/SkillGapBars.tsx`** — Horizontal bars with color coding (green >70%, yellow 30-70%, red <30%)
- **`src/components/analytics/PipelineFunnel.tsx`** — Visual funnel: Uploaded → Scored → Shortlisted → Emailed
- **`src/components/analytics/TopSkillsChart.tsx`** — Bar chart of most common skills
- **`src/components/analytics/ScoreCards.tsx`** — Average score cards with trend indicators

---

## Phase 9: Loading States & Micro-Interactions
**Goal:** Polish the entire UX with skeleton loaders, optimistic updates, animations, keyboard shortcuts, and proper empty states.

### Files to modify (ALL page files):
- Every page gets skeleton loaders replacing spinners
- Empty states get custom illustrations and CTAs
- Status updates get optimistic behavior (update UI → revert on error)
- Page transitions with fade-in animations

### New files to create:
- **`src/components/ui/ConfettiCelebration.tsx`** — Confetti burst using canvas-confetti (triggered when first batch completes)
- **`src/components/ui/HoverPreviewCard.tsx`** — Mini candidate card shown on hover over table rows
- **`src/components/ui/SkeletonJobCard.tsx`** — Skeleton version of job card
- **`src/components/ui/SkeletonTable.tsx`** — Skeleton version of candidate table
- **`src/components/ui/SkeletonDetail.tsx`** — Skeleton version of candidate detail

### Files to modify:
- **`src/app/(dashboard)/candidates/[id]/page.tsx`** — Add keyboard shortcuts (S=shortlist, R=reject, N=next, P=prev)
- **`src/hooks/useCandidates.ts`** — Add optimistic update logic for status changes

---

## Phase 10: Onboarding Flow
**Goal:** Guided first-time user experience.

### New files to create:
- **`src/app/(dashboard)/onboarding/page.tsx`** — Multi-step onboarding: Welcome → Org Setup → Create First Job → Upload Resumes → View Results
- **`src/components/onboarding/WelcomeStep.tsx`** — Welcome message with app name
- **`src/components/onboarding/OrgSetupStep.tsx`** — Company name + logo upload
- **`src/components/onboarding/FirstJobStep.tsx`** — Pre-filled JD sample, guide through skill editing
- **`src/components/onboarding/UploadStep.tsx`** — Drag and drop with encouraging copy
- **`src/components/onboarding/ResultsStep.tsx`** — Redirect to rankings when processing completes

### Files to modify:
- **`src/components/layout/AuthGuard.tsx`** — Check onboarding_completed flag on user profile, redirect to /onboarding if not completed
- **`src/lib/authService.ts`** — Add onboarding completion status check/update

---

## Implementation Notes

### Dark Mode Strategy
- Use Tailwind's `class` dark mode strategy
- Add `dark:` variants to ALL existing components as we touch them
- ThemeStore persists to localStorage, respects `prefers-color-scheme` by default
- Smooth transition via CSS `transition-colors duration-200` on body

### Mobile Responsiveness Strategy
- Applied incrementally as each component/page is built or modified
- Tables → card lists on mobile (md: breakpoint)
- Modals → full-screen sheets on mobile
- Sidebar already has mobile bottom bar — add Settings tab
- Charts use Recharts `ResponsiveContainer` (already in use)

### State Management Strategy
- Keep Zustand for global persistent state (auth, theme)
- Use React hooks for server data (fetching, loading, error)
- Use local component state for UI state (form steps, selections, dropdowns)
- No need for additional state management libraries

### Error Handling Strategy
- All new services follow existing pattern: try/catch + toast
- All pages get proper error states with retry buttons
- API errors display user-friendly messages
