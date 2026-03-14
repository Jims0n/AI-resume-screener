"""
Centralized logging configuration for the AI Resume Screener.

Uses two named loggers following the semis pattern:
  - 'app_info'  → INFO-level messages (operations, state changes, metrics)
  - 'app_error' → ERROR-level messages (failures, exceptions)

All modules should import these two loggers:
    from config.logging_config import info_logger, error_logger
"""

import logging
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent


def get_log_dir():
    """Create and return the logs directory."""
    log_dir = os.path.join(BASE_DIR, 'logs')
    try:
        os.makedirs(log_dir, exist_ok=True)
    except OSError:
        # Fallback to /tmp if we can't write to project dir
        log_dir = os.path.join('/tmp', 'ai-resume-screener-logs')
        os.makedirs(log_dir, exist_ok=True)
    return log_dir


# Pre-configured loggers for import across the project
info_logger = logging.getLogger('app_info')
error_logger = logging.getLogger('app_error')


def get_logging_config():
    """Return the Django LOGGING dict configuration."""
    log_dir = get_log_dir()

    return {
        'version': 1,
        'disable_existing_loggers': False,
        'formatters': {
            'standard': {
                'format': '%(asctime)s [%(levelname)s] %(message)s (%(filename)s:%(lineno)s)',
            },
            'verbose': {
                'format': '%(asctime)s [%(levelname)s] %(name)s %(module)s %(message)s (%(filename)s:%(lineno)s)',
            },
            'simple': {
                'format': '[%(levelname)s] %(message)s',
            },
        },
        'handlers': {
            'console': {
                'class': 'logging.StreamHandler',
                'formatter': 'simple',
                'level': 'INFO',
            },
            'info_file': {
                'level': 'INFO',
                'class': 'logging.handlers.RotatingFileHandler',
                'formatter': 'standard',
                'filename': os.path.join(log_dir, 'info.log'),
                'maxBytes': 10 * 1024 * 1024,  # 10MB
                'backupCount': 5,
                'encoding': 'utf-8',
            },
            'error_file': {
                'level': 'ERROR',
                'class': 'logging.handlers.RotatingFileHandler',
                'formatter': 'verbose',
                'filename': os.path.join(log_dir, 'error.log'),
                'maxBytes': 10 * 1024 * 1024,  # 10MB
                'backupCount': 5,
                'encoding': 'utf-8',
            },
        },
        'loggers': {
            # Centralized named loggers
            'app_info': {
                'level': 'INFO',
                'handlers': ['console', 'info_file'],
                'propagate': False,
            },
            'app_error': {
                'level': 'ERROR',
                'handlers': ['console', 'error_file'],
                'propagate': False,
            },
            # Django internals — only warn+
            'django': {
                'level': 'WARNING',
                'handlers': ['console', 'error_file'],
                'propagate': False,
            },
            'django.request': {
                'level': 'ERROR',
                'handlers': ['console', 'error_file'],
                'propagate': False,
            },
            # Per-app loggers (use __name__) — route to both files
            'accounts': {
                'level': 'INFO',
                'handlers': ['console', 'info_file', 'error_file'],
                'propagate': False,
            },
            'jobs': {
                'level': 'INFO',
                'handlers': ['console', 'info_file', 'error_file'],
                'propagate': False,
            },
            'candidates': {
                'level': 'INFO',
                'handlers': ['console', 'info_file', 'error_file'],
                'propagate': False,
            },
            'analytics': {
                'level': 'INFO',
                'handlers': ['console', 'info_file', 'error_file'],
                'propagate': False,
            },
            'notifications': {
                'level': 'INFO',
                'handlers': ['console', 'info_file', 'error_file'],
                'propagate': False,
            },
            'emails': {
                'level': 'INFO',
                'handlers': ['console', 'info_file', 'error_file'],
                'propagate': False,
            },
        },
        'root': {
            'handlers': ['console', 'info_file'],
            'level': 'INFO',
        },
    }
