from rest_framework import generics, permissions, serializers

from .models import ActivityLog
from .permissions import IsOrganizationMember


class ActivityLogSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True, default=None)
    user_name = serializers.CharField(source='user.username', read_only=True, default=None)

    class Meta:
        model = ActivityLog
        fields = [
            'id', 'action', 'target_type', 'target_id', 'details',
            'user_email', 'user_name', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class ActivityLogListView(generics.ListAPIView):
    serializer_class = ActivityLogSerializer
    permission_classes = [permissions.IsAuthenticated, IsOrganizationMember]

    def get_queryset(self):
        queryset = ActivityLog.objects.filter(
            organization=self.request.user.organization,
        ).select_related('user')

        # Filter by action
        action = self.request.query_params.get('action')
        if action:
            queryset = queryset.filter(action=action)

        # Filter by target_type
        target_type = self.request.query_params.get('target_type')
        if target_type:
            queryset = queryset.filter(target_type=target_type)

        # Filter by date range
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        if date_from:
            queryset = queryset.filter(created_at__date__gte=date_from)
        if date_to:
            queryset = queryset.filter(created_at__date__lte=date_to)

        return queryset
