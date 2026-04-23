import { z } from 'zod'
import { badRequest, createSuccessResponse, rateLimited, serverError } from '@/lib/api-response'
import { sendCourseRequestEmail } from '@/lib/email'
import { checkRateLimit } from '@/lib/rate-limit'

const courseRequestSchema = z.object({
  name: z.string().trim().min(2).max(120),
  requestedCourse: z.string().trim().min(2).max(160),
  description: z.string().trim().min(10).max(2000),
  stream: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
})

function getClientIp(request: Request) {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() || 'unknown'
  }

  return request.headers.get('x-real-ip') || 'unknown'
}

export async function POST(request: Request) {
  try {
    const rateLimitKey = `course-request:${getClientIp(request)}`
    const limit = checkRateLimit(rateLimitKey, { maxRequests: 3, windowMs: 60 * 60 * 1000 })
    if (limit.limited) {
      return rateLimited(Math.ceil(limit.retryAfterMs / 1000))
    }

    const body = await request.json().catch(() => null)
    if (!body) {
      return badRequest('Request body is required')
    }

    const parsed = courseRequestSchema.safeParse(body)
    if (!parsed.success) {
      return badRequest('Validation failed', { errors: parsed.error.flatten().fieldErrors })
    }

    await sendCourseRequestEmail(parsed.data)

    return createSuccessResponse({ success: true })
  } catch (error) {
    console.error('[POST /api/course-requests]', error)
    return serverError('Failed to send course request')
  }
}
