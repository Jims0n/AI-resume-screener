"""
Request and error logging middleware.

RequestLoggingMiddleware — Logs every request with method, path, user, status, and duration.
ErrorLoggingMiddleware — Logs 4xx/5xx responses with response body for debugging.
"""

import time
import logging

info_logger = logging.getLogger('app_info')
error_logger = logging.getLogger('app_error')


class RequestLoggingMiddleware:
    """Log each HTTP request with timing information."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        start = time.monotonic()

        response = self.get_response(request)

        duration_ms = (time.monotonic() - start) * 1000
        user = getattr(request, 'user', None)
        username = user.username if user and user.is_authenticated else 'anonymous'

        info_logger.info(
            f"{request.method} {request.path} → {response.status_code} "
            f"({duration_ms:.0f}ms) user={username}"
        )

        return response


class ErrorLoggingMiddleware:
    """Log error responses (4xx client errors, 5xx server errors) with body content."""

    def __init__(self, get_response):
        self.get_response = get_response
        self._exception_logged = False

    def __call__(self, request):
        self._exception_logged = False
        response = self.get_response(request)

        if response.status_code >= 500 and not self._exception_logged:
            body = self._get_response_body(response)
            error_logger.error(
                f"SERVER ERROR {response.status_code} | {request.method} {request.path} | "
                f"user={getattr(request.user, 'username', 'anonymous')} | body={body}"
            )
        elif response.status_code in (400, 401, 403, 404, 409, 429):
            body = self._get_response_body(response)
            info_logger.info(
                f"CLIENT ERROR {response.status_code} | {request.method} {request.path} | "
                f"user={getattr(request.user, 'username', 'anonymous')} | body={body}"
            )

        return response

    def process_exception(self, request, exception):
        """Log unhandled exceptions before Django's error handling kicks in."""
        self._exception_logged = True
        error_logger.error(
            f"UNHANDLED EXCEPTION | {request.method} {request.path} | "
            f"user={getattr(request.user, 'username', 'anonymous')} | "
            f"{exception.__class__.__name__}: {exception}",
            exc_info=True,
        )
        return None

    @staticmethod
    def _get_response_body(response):
        """Safely extract response body for logging."""
        try:
            if hasattr(response, 'content'):
                body = response.content.decode('utf-8', errors='replace')[:500]
                return body
        except Exception:
            pass
        return '<unavailable>'
