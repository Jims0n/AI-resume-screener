from django.urls import path
from .views import (
    ResumeUploadView, CandidateListView, CandidateDetailView,
    CandidateStatusUpdateView, CandidateReprocessView, CandidateExportView,
)

urlpatterns = [
    path('jobs/<int:job_id>/upload', ResumeUploadView.as_view(), name='resume-upload'),
    path('jobs/<int:job_id>/candidates', CandidateListView.as_view(), name='candidate-list'),
    path('jobs/<int:job_id>/export', CandidateExportView.as_view(), name='candidate-export'),
    path('candidates/<int:pk>', CandidateDetailView.as_view(), name='candidate-detail'),
    path('candidates/<int:pk>/status', CandidateStatusUpdateView.as_view(), name='candidate-status'),
    path('candidates/<int:pk>/reprocess', CandidateReprocessView.as_view(), name='candidate-reprocess'),
]
