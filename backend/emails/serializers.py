from rest_framework import serializers
from .models import EmailTemplate, SentEmail


class EmailTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailTemplate
        fields = [
            'id', 'name', 'type', 'subject', 'body',
            'is_default', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class SendEmailSerializer(serializers.Serializer):
    template_id = serializers.IntegerField(required=False)
    subject = serializers.CharField(required=False)
    body = serializers.CharField(required=False)

    def validate(self, attrs):
        if not attrs.get('template_id') and not (attrs.get('subject') and attrs.get('body')):
            raise serializers.ValidationError(
                'Provide either template_id or both subject and body.'
            )
        return attrs


class BulkEmailSerializer(serializers.Serializer):
    candidate_ids = serializers.ListField(
        child=serializers.IntegerField(),
        min_length=1,
    )
    template_id = serializers.IntegerField(required=False)
    subject = serializers.CharField(required=False)
    body = serializers.CharField(required=False)

    def validate(self, attrs):
        if not attrs.get('template_id') and not (attrs.get('subject') and attrs.get('body')):
            raise serializers.ValidationError(
                'Provide either template_id or both subject and body.'
            )
        return attrs


class SentEmailSerializer(serializers.ModelSerializer):
    candidate_name = serializers.CharField(source='candidate.name', read_only=True)
    sender_email = serializers.CharField(source='sender.email', read_only=True, default=None)

    class Meta:
        model = SentEmail
        fields = [
            'id', 'candidate_name', 'recipient_email', 'subject',
            'body', 'status', 'error_message', 'sender_email', 'sent_at',
        ]
