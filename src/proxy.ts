import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { AdminRole } from '@/generated/prisma/client'
import { checkRateLimit, AUTH_RATE_LIMIT, API_RATE_LIMIT, SEARCH_RATE_LIMIT } from '@/lib/rate-limit'
import { applyCorsHeaders, createCorsPreflightResponse } from '@/lib/cors'

// ============================================================================
// PROXY FUNCTION (Node.js Runtime)
// Next.js 16: middleware.ts is deprecated, use proxy.ts instead
// ============================================================================

/**
 * Extract client IP from request headers (handles proxies like Vercel/Cloudflare).
 */
function getClientIp(request: NextRequest): string {
    return (
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        request.headers.get('x-real-ip') ||
        '127.0.0.1'
    )
}

export async function proxy(request: NextRequest) {
    const path = request.nextUrl.pathname
    const isApiRoute = path.startsWith('/api/')

    // Browser CORS preflight should not go through auth/rate-limit checks.
    if (isApiRoute && request.method === 'OPTIONS') {
        return createCorsPreflightResponse(request)
    }

    // ============================================================================
    // PUBLIC ROUTES (Skip authentication)
    // ============================================================================
    const publicRoutes = [
        '/',
        '/about',
        '/courses',
        '/login',
        '/register',
        '/verify-email',
        '/reset-password',
        '/admin/login',
    ]

    const isPublicRoute =
        publicRoutes.includes(path) ||
        path.startsWith('/_next') ||
        path.startsWith('/api/public') ||
        path.startsWith('/api/admin/auth/login') ||
        path.startsWith('/api/auth/register') ||
        path.startsWith('/api/auth/login') ||
        path.startsWith('/api/auth/google') ||
        path.startsWith('/api/auth/forgot-password') ||
        path.startsWith('/api/auth/reset-password') ||
        path.startsWith('/api/auth/verify-email') ||
        path.startsWith('/api/webhooks') ||
        path.match(/\.(ico|png|svg|jpg|jpeg|gif|webp)$/)

    // Public routes must never go through auth enforcement.
    // Otherwise `/admin/login` redirects to itself and the browser hits ERR_TOO_MANY_REDIRECTS.
    if (isPublicRoute) {
        const response = NextResponse.next()
        if (process.env.NODE_ENV === 'development') {
            response.headers.set('X-RateLimit-Remaining', '999')
        }
        return isApiRoute ? applyCorsHeaders(request, response) : response
    }

    // ============================================================================
    // RATE LIMITING (Applied to all non-static routes)
    // ============================================================================
    const clientIp = getClientIp(request)

    // Pick the right config based on the route
    let rateLimitConfig = API_RATE_LIMIT
    let rateLimitKey = `api:${clientIp}`

    if (path.startsWith('/api/auth')) {
        rateLimitConfig = AUTH_RATE_LIMIT
        rateLimitKey = `auth:${clientIp}`
    } else if (path.startsWith('/api/courses/search')) {
        rateLimitConfig = SEARCH_RATE_LIMIT
        rateLimitKey = `search:${clientIp}`
    }

    // Skip rate limiting in development
    if (process.env.NODE_ENV === 'development') {
        const response = await handleRouteAuth(request, path)
        response.headers.set('X-RateLimit-Remaining', '999')
        return isApiRoute ? applyCorsHeaders(request, response) : response
    }

    const { limited, remaining, retryAfterMs } = checkRateLimit(rateLimitKey, rateLimitConfig)

    if (limited) {
        const retryAfterSeconds = Math.ceil(retryAfterMs / 1000)
        const response = NextResponse.json(
            {
                success: false,
                data: null,
                error: {
                    code: 'RATE_LIMITED',
                    message: 'Too many requests. Please try again later.',
                    details: { retryAfter: retryAfterSeconds },
                },
            },
            {
                status: 429,
                headers: {
                    'Retry-After': String(retryAfterSeconds),
                    'X-RateLimit-Remaining': '0',
                },
            },
        )
        return isApiRoute ? applyCorsHeaders(request, response) : response
    }

    const response = await handleRouteAuth(request, path)
    response.headers.set('X-RateLimit-Remaining', String(remaining))
    return isApiRoute ? applyCorsHeaders(request, response) : response
}

/**
 * Common logic for routing to Admin or Student auth handlers.
 * Refactored to allow skipping rate limits in dev.
 */
async function handleRouteAuth(request: NextRequest, path: string) {
    if (path.startsWith('/admin') || path.startsWith('/api/admin/')) {
        return await handleAdminAuth(request)
    }

    // Student Routes
    const isProtectedPage =
        path.startsWith('/dashboard') ||
        path.startsWith('/learn') ||
        path.startsWith('/profile')

    const isProtectedApi =
        path.startsWith('/api/users') ||
        path.startsWith('/api/enrollments') ||
        path.startsWith('/api/learn') ||
        path.startsWith('/api/quiz') ||
        path.startsWith('/api/submissions') ||
        path.startsWith('/api/enroll') ||
        path.startsWith('/api/wallet') ||
        (path.startsWith('/api/referrals') && !path.startsWith('/api/referrals/validate'))

    if (isProtectedPage || isProtectedApi) {
        return await handleStudentAuth(request)
    }

    return NextResponse.next()
}

// ============================================================================
// ADMIN AUTHENTICATION HANDLER
// ============================================================================
async function handleAdminAuth(request: NextRequest) {
    // Import dynamically to avoid edge runtime issues
    const { prisma } = await import('@/lib/db')

    const path = request.nextUrl.pathname
    const isApiRoute = path.startsWith('/api/')

    // Helper: return 401 JSON for APIs, redirect for pages
    function unauthorized401() {
        if (isApiRoute) {
            return NextResponse.json(
                { success: false, data: null, error: { code: 'AUTH_REQUIRED', message: 'Authentication required' } },
                { status: 401 },
            )
        }
        return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    // Check for admin session cookie
    const adminSessionId = request.cookies.get('admin_session')?.value

    if (!adminSessionId) {
        return unauthorized401()
    }

    // Validate admin session
    const adminSession = await prisma.adminSession.findUnique({
        where: { id: adminSessionId },
        include: { admin: true },
    })

    if (!adminSession || adminSession.expiresAt < new Date()) {
        // Session expired or invalid - clear cookie and redirect/json
        // Don't delete from DB here - let background job handle cleanup or let session naturally expire
        const response = unauthorized401()
        if (!isApiRoute) {
            response.cookies.delete('admin_session')
        }
        return response
    }

    const admin = adminSession.admin

    // Check if admin is active
    if (!admin.isActive) {
        return unauthorized401()
    }

    // Role-based route restrictions
    const adminRole = admin.role as AdminRole

    if (path.startsWith('/admin/settings') && adminRole !== 'super_admin') {
        return NextResponse.json(
            { success: false, data: null, error: { code: 'AUTH_FORBIDDEN', message: 'SuperAdmin access required' } },
            { status: 403 },
        )
    }

    if (
        path.startsWith('/admin/users') &&
        adminRole !== 'super_admin' &&
        adminRole !== 'admin'
    ) {
        return NextResponse.json(
            { success: false, data: null, error: { code: 'AUTH_FORBIDDEN', message: 'Admin access required' } },
            { status: 403 },
        )
    }

    // Attach admin info to request headers
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-admin-id', admin.id)
    requestHeaders.set('x-admin-role', admin.role)
    requestHeaders.set('x-admin-email', admin.email)

    return NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    })
}

// ============================================================================
// STUDENT AUTHENTICATION HANDLER
// ============================================================================
async function handleStudentAuth(request: NextRequest) {
    // Import dynamically to avoid edge runtime issues
    const { prisma } = await import('@/lib/db')

    const path = request.nextUrl.pathname
    const isApiRoute = path.startsWith('/api/')

    // Helper: return 401 JSON for APIs, redirect for pages
    function unauthorized401() {
        if (isApiRoute) {
            return NextResponse.json(
                { success: false, data: null, error: { code: 'AUTH_REQUIRED', message: 'Authentication required' } },
                { status: 401 },
            )
        }
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // Check for student session cookie
    const sessionId = request.cookies.get('sprintern_session')?.value

    if (!sessionId) {
        return unauthorized401()
    }

    // Validate student session
    const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: { user: true },
    })

    if (!session || session.expiresAt < new Date()) {
        // Session expired or invalid - clear cookie and return unauthorized
        // Don't delete from DB here - let background job handle cleanup or let session naturally expire
        const response = unauthorized401()
        response.cookies.delete('sprintern_session')
        return response
    }

    const user = session.user

    // Check if user account is deleted
    if (user.deletedAt) {
        return unauthorized401()
    }

    // Attach user info to request headers
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', user.id)
    requestHeaders.set('x-user-email', user.email)
    requestHeaders.set('x-user-role', user.role)

    return NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    })
}

// ============================================================================
// PROXY CONFIGURATION
// ============================================================================
export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder files
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
