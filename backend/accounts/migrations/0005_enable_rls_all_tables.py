"""
Enable Row Level Security (RLS) on all public tables.

Supabase exposes all public schema tables via its PostgREST API.
Since this Django app accesses the database directly (not via PostgREST),
we enable RLS on all tables and add a policy that allows full access only
to the postgres/service_role used by Django, effectively blocking
unauthorized access through the Supabase REST API.
"""

from django.db import migrations

# All tables flagged by Supabase Security Advisor
TABLES = [
    # Accounts
    'accounts_user',
    'accounts_user_groups',
    'accounts_user_user_permissions',
    'accounts_organization',
    'accounts_organizationinvite',
    'accounts_activitylog',
    # Jobs
    'jobs_job',
    # Candidates
    'candidates_candidate',
    'candidates_processingbatch',
    'candidates_skillmatch',
    'candidates_candidatenote',
    # Emails
    'emails_emailtemplate',
    'emails_sentemail',
    # Notifications
    'notifications_notification',
    # Django internals
    'django_migrations',
    'django_content_type',
    'django_admin_log',
    'django_session',
    'auth_permission',
    'auth_group',
    'auth_group_permissions',
    # JWT token blacklist
    'token_blacklist_outstandingtoken',
    'token_blacklist_blacklistedtoken',
]


def enable_rls(apps, schema_editor):
    """Enable RLS on all tables and create a policy for the Django DB role."""
    # Get the current database role Django is connected as
    with schema_editor.connection.cursor() as cursor:
        cursor.execute("SELECT current_user;")
        db_role = cursor.fetchone()[0]

    for table in TABLES:
        schema_editor.execute(f'ALTER TABLE public."{table}" ENABLE ROW LEVEL SECURITY;')
        # Allow full access to the Django DB role.
        # This ensures Django ORM operations are unaffected while
        # blocking access via Supabase PostgREST (anon/authenticated roles).
        schema_editor.execute(
            f'CREATE POLICY "django_full_access" ON public."{table}" '
            f'FOR ALL TO {db_role} USING (true) WITH CHECK (true);'
        )


def disable_rls(apps, schema_editor):
    """Reverse: disable RLS on all tables."""
    for table in TABLES:
        schema_editor.execute(
            f'DROP POLICY IF EXISTS "django_full_access" ON public."{table}";'
        )
        schema_editor.execute(f'ALTER TABLE public."{table}" DISABLE ROW LEVEL SECURITY;')


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0004_migrate_existing_users_to_orgs'),
    ]

    operations = [
        migrations.RunSQL(sql=migrations.RunSQL.noop, reverse_sql=migrations.RunSQL.noop),
        migrations.RunPython(enable_rls, disable_rls),
    ]
