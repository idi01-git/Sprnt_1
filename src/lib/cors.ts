import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

const DEFAULT_ALLOWED_ORIGINS = ['http://localhost:3000', 'http://localhost:3001']
const DEFAULT_ALLOWED_METHODS = 'GET,POST,PUT,PATCH,DELETE,OPTIONS'
const DEFAULT_ALLOWED_HEADERS =
    'Content-Type, Authorization, X-Requested-With, x-user-id, x-user-email, x-user-role, x-admin-id, x-admin-role, x-admin-email'
const DEFAULT_MAX_AGE_SECONDS = '86400'

function splitOriginList(rawValue: string | undefined): string[] {
    if (!rawValue) return []

    return rawValue
        .split(',')
        .map((origin) => origin.trim())
        .filter((origin) => origin.length > 0)
}

function getAllowedOrigins(): Set<string> {
    const configuredOrigins = splitOriginList(process.env.CORS_ALLOWED_ORIGINS)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim()

    return new Set(
        [...DEFAULT_ALLOWED_ORIGINS, ...configuredOrigins, appUrl ?? '']
            .map((origin) => origin.trim())
            .filter((origin) => origin.length > 0),
    )
}

function getAllowedOriginFromRequest(request: NextRequest): string | null {
    const requestOrigin = request.headers.get('origin')
    if (!requestOrigin) return null

    const allowedOrigins = getAllowedOrigins()
    return allowedOrigins.has(requestOrigin) ? requestOrigin : null
}

/**
 * Backward-compatible export for older route handlers.
 */
export function getCorsOrigin(request: NextRequest): string | null {
    return getAllowedOriginFromRequest(request)
}

/**
 * Generates CORS headers as a plain object.
 * Returns Record<string, string> to ensure compatibility with utility functions 
 * like serverError() that expect a standard object with string indexes.
 */
export function createCorsHeaders(input: NextRequest | string): Record<string, string> {
    const allowedOrigin =
        typeof input === 'string' ? input : getAllowedOriginFromRequest(input)
    
    // Return an empty object if no origin is allowed
    if (!allowedOrigin) return {}

    const requestedHeaders =
        typeof input === 'string'
            ? DEFAULT_ALLOWED_HEADERS
            : input.headers.get('access-control-request-headers') ?? DEFAULT_ALLOWED_HEADERS

    return {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Methods': DEFAULT_ALLOWED_METHODS,
        'Access-Control-Allow-Headers': requestedHeaders,
        'Access-Control-Max-Age': DEFAULT_MAX_AGE_SECONDS,
        Vary: 'Origin',
    }
}

/**
 * Applies CORS headers to an existing NextResponse object.
 */
export function applyCorsHeaders(request: NextRequest, response: NextResponse): NextResponse {
    const allowedOrigin = getAllowedOriginFromRequest(request)
    if (!allowedOrigin) return response

    const requestedHeaders =
        request.headers.get('access-control-request-headers') ?? DEFAULT_ALLOWED_HEADERS

    response.headers.set('Access-Control-Allow-Origin', allowedOrigin)
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    response.headers.set('Access-Control-Allow-Methods', DEFAULT_ALLOWED_METHODS)
    response.headers.set('Access-Control-Allow-Headers', requestedHeaders)
    response.headers.set('Access-Control-Max-Age', DEFAULT_MAX_AGE_SECONDS)
    response.headers.set('Vary', 'Origin')

    return response
}

/**
 * Creates a response for OPTIONS preflight requests.
 */
export function createCorsPreflightResponse(request: NextRequest): NextResponse {
    const allowedOrigin = getAllowedOriginFromRequest(request)
    
    if (!allowedOrigin) {
        return NextResponse.json(
            {
                success: false,
                data: null,
                error: {
                    code: 'CORS_ORIGIN_DENIED',
                    message: 'Origin is not allowed',
                },
            },
            { status: 403 },
        )
    }

    const response = new NextResponse(null, { status: 204 })
    return applyCorsHeaders(request, response)
}