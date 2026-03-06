from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import JobViewSet

router = DefaultRouter(trailing_slash=False)
router.register('jobs', JobViewSet, basename='job')

urlpatterns = [
    path('', include(router.urls)),
]
