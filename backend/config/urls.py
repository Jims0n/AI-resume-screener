from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/', include('jobs.urls')),
    path('api/', include('candidates.urls')),
    path('api/', include('analytics.urls')),
    path('api/', include('notifications.urls')),
    path('api/', include('emails.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
