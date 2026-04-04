import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require authentication
const protectedPaths = ['/dashboard', '/jobs', '/candidates', '/settings', '/notifications', '/onboarding'];

// Routes only accessible when NOT authenticated
const authPaths = ['/login', '/register', '/forgot-password', '/reset-password'];

function getTokenFromCookie(request: NextRequest): string | null {
    // Zustand persist stores auth state in a cookie-readable format via localStorage
    // Since we use localStorage, we check for a lightweight auth cookie instead
    // The AuthGuard component handles the full validation client-side
    // This middleware provides a fast server-side redirect for obvious cases
    const authStorage = request.cookies.get('auth-storage')?.value;
    if (!authStorage) return null;
    try {
        const parsed = JSON.parse(authStorage);
        return parsed?.state?.accessToken || null;
    } catch {
        return null;
    }
}

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    const isProtected = protectedPaths.some((p) => pathname.startsWith(p));
    const isAuthPage = authPaths.some((p) => pathname.startsWith(p));

    // For protected routes, check if there's any indication of auth
    // The real validation happens via API calls — this just prevents
    // obvious unauthenticated access from seeing a flash of dashboard
    if (isProtected) {
        const token = getTokenFromCookie(request);
        if (!token) {
            const url = request.nextUrl.clone();
            url.pathname = '/login';
            return NextResponse.redirect(url);
        }
    }

    // If authenticated user tries to visit login/register, redirect to dashboard
    if (isAuthPage) {
        const token = getTokenFromCookie(request);
        if (token) {
            const url = request.nextUrl.clone();
            url.pathname = '/dashboard';
            return NextResponse.redirect(url);
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/dashboard/:path*',
        '/jobs/:path*',
        '/candidates/:path*',
        '/settings/:path*',
        '/notifications/:path*',
        '/onboarding/:path*',
        '/login',
        '/register',
        '/forgot-password',
        '/reset-password',
    ],
};
