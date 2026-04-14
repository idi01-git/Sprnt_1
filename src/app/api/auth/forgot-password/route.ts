import { prisma } from '@/lib/db'
import { forgotPasswordSchema } from '@/lib/validations/auth'
import { sendPasswordResetEmail } from '@/lib/email'
import { issuePasswordResetToken } from '@/lib/auth/tokens'
import {
    createSuccessResponse,
    createErrorResponse,
    badRequest,
    serverError,
    HttpStatus,
    ErrorCode,
} from '@/lib/api-response'

/**
 * POST /api/auth/forgot-password
 * Generate password reset token and send password reset email via Resend
 */
export async function POST(request: Request) {
    try {
        // 1. Parse & validate body
        const body = await request.json().catch(() => null)
        if (!body) return badRequest('Request body is required')

        const result = forgotPasswordSchema.safeParse(body)
        if (!result.success) {
            return createErrorResponse(
                ErrorCode.VALIDATION_ERROR,
                'Validation failed',
                HttpStatus.BAD_REQUEST,
                { errors: result.error.flatten().fieldErrors }
            )
        }

        const { email } = result.data

        const user = await prisma.user.findUnique({
            where: { email, deletedAt: null },
            select: {
                id: true,
                email: true,
                name: true,
                isSuspended: true,
            },
        })

        if (!user || user.isSuspended) {
            return createSuccessResponse({
                message: 'If that email exists, a password reset link has been sent.',
            })
        }

        await prisma.passwordResetToken.updateMany({
            where: {
                userId: user.id,
                usedAt: null,
            },
            data: {
                usedAt: new Date(),
            },
        })

        const passwordResetToken = await issuePasswordResetToken(user.id)
        await sendPasswordResetEmail(user.email, user.name, passwordResetToken)

        return createSuccessResponse({
            message: 'If that email exists, a password reset link has been sent.',
        })
    } catch (error) {
        console.error('[POST /api/auth/forgot-password]', error)
        return serverError('Failed to process password reset request')
    }
}
