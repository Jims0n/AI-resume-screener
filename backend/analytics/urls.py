from django.urls import path
from .views import JobAnalyticsView

urlpatterns = [
    path('jobs/<int:job_id>/analytics/', JobAnalyticsView.as_view(), name='job-analytics'),
]
