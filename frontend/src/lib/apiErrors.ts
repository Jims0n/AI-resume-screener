import { AxiosError } from 'axios';

/**
 * Extract a human-readable error message from an Axios error response.
 *
 * Handles all common DRF response formats:
 *  - { "detail": "..." }                          → string
 *  - { "field_name": ["error msg"] }              → first field error
 *  - { "non_field_errors": ["error msg"] }        → non-field error
 *  - { "message": "..." }                         → generic message
 *  - Network/timeout errors                       → friendly fallback
 *
 * @param error    - The caught error (typically AxiosError)
 * @param fallback - Fallback message if nothing useful can be extracted
 * @returns A single string error message
 */
export function extractApiError(
    error: unknown,
    fallback: string = 'Something went wrong. Please try again.'
): string {
    // Not an Axios error — return fallback
    if (!isAxiosError(error)) {
        if (error instanceof Error) return error.message;
        return fallback;
    }

    const data = error.response?.data;

    // No response body (network error, timeout, etc.)
    if (!data) {
        if (error.code === 'ERR_NETWORK') return 'Network error. Please check your connection.';
        if (error.code === 'ECONNABORTED') return 'Request timed out. Please try again.';
        return fallback;
    }

    // String response
    if (typeof data === 'string') return data;

    // { detail: "..." } — most common DRF error format
    if (data.detail && typeof data.detail === 'string') return data.detail;

    // { detail: [{...}] } — token errors from SimpleJWT
    if (Array.isArray(data.detail) && data.detail.length > 0) {
        return data.detail[0]?.message || data.detail[0] || fallback;
    }

    // { non_field_errors: ["..."] }
    if (Array.isArray(data.non_field_errors) && data.non_field_errors.length > 0) {
        return data.non_field_errors[0];
    }

    // { message: "..." }
    if (data.message && typeof data.message === 'string') return data.message;

    // Field-level errors: { field_name: ["error msg"] }
    // Return the first field error found
    const fieldError = extractFirstFieldError(data);
    if (fieldError) return fieldError;

    return fallback;
}

/**
 * Extract the first field-level error from a DRF validation response.
 * E.g., { "email": ["This field is required."], "username": ["..."] }
 * Returns: "This field is required." (from the first field)
 */
function extractFirstFieldError(data: Record<string, unknown>): string | null {
    const skipKeys = new Set(['detail', 'non_field_errors', 'message', 'code']);

    for (const key of Object.keys(data)) {
        if (skipKeys.has(key)) continue;
        const value = data[key];

        if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'string') {
            return value[0];
        }
        if (typeof value === 'string') {
            return value;
        }
    }
    return null;
}

/**
 * Type guard for AxiosError
 */
function isAxiosError(error: unknown): error is AxiosError<Record<string, unknown>> {
    return (
        typeof error === 'object' &&
        error !== null &&
        'isAxiosError' in error &&
        (error as AxiosError).isAxiosError === true
    );
}
