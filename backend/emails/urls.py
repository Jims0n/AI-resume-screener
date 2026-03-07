from django.urls import path
from .views import (
    EmailTemplateListCreateView,
    EmailTemplateDetailView,
    SendCandidateEmailView,
    BulkEmailView,
    SentEmailListView,
)

urlpatterns = [
    # Templates
    path('email-templates', EmailTemplateListCreateView.as_view(), name='email-template-list'),
    path('email-templates/<int:pk>', EmailTemplateDetailView.as_view(), name='email-template-detail'),

    # Send
    path('candidates/<int:pk>/send-email', SendCandidateEmailView.as_view(), name='send-candidate-email'),
    path('jobs/<int:job_id>/bulk-email', BulkEmailView.as_view(), name='bulk-email'),

    # History
    path('sent-emails', SentEmailListView.as_view(), name='sent-email-list'),
]
