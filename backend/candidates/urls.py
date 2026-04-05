from django.urls import path
from .views import (
    ResumeUploadView,
    CandidateListView,
    CandidateDetailView,
    CandidateDeleteView,
    CandidateBulkDeleteView,
    CandidateStatusUpdateView,
    CandidateReprocessView,
    CandidateExportView,
    CandidateNoteListCreateView,
    CandidateNoteDetailView,
    BatchDetailView,
    CandidateCompareView,
)

urlpatterns = [
    # Job-scoped candidate endpoints
    path('jobs/<int:job_id>/upload', ResumeUploadView.as_view(), name='resume-upload'),
    path('jobs/<int:job_id>/candidates', CandidateListView.as_view(), name='candidate-list'),
    path('jobs/<int:job_id>/candidates/bulk-delete', CandidateBulkDeleteView.as_view(), name='candidate-bulk-delete'),
    path('jobs/<int:job_id>/export', CandidateExportView.as_view(), name='candidate-export'),
    path('jobs/<int:job_id>/compare', CandidateCompareView.as_view(), name='candidate-compare'),

    # Candidate endpoints
    path('candidates/<int:pk>', CandidateDetailView.as_view(), name='candidate-detail'),
    path('candidates/<int:pk>/delete', CandidateDeleteView.as_view(), name='candidate-delete'),
    path('candidates/<int:pk>/status', CandidateStatusUpdateView.as_view(), name='candidate-status'),
    path('candidates/<int:pk>/reprocess', CandidateReprocessView.as_view(), name='candidate-reprocess'),

    # Candidate notes
    path('candidates/<int:pk>/notes', CandidateNoteListCreateView.as_view(), name='candidate-notes'),
    path('notes/<int:note_id>', CandidateNoteDetailView.as_view(), name='note-detail'),

    # Batch status
    path('batches/<int:pk>', BatchDetailView.as_view(), name='batch-detail'),
]
