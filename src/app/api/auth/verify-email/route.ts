import { prisma } from '@/lib/db'
import { findValidEmailVerificationToken } from '@/lib/auth/tokens'
import { verifyEmailSchema } from '@/lib/validations/auth'
import {
    createSuccessResponse,
    createErrorResponse,
    badRequest,
    serverError,
    HttpStatus,
    ErrorCode,
} from '@/lib/api-response'

/**
 * POST /api/auth/verify-email
 * Validate email verification token, set emailVerified = true
 */
export async function POST(request: Request) {
    try {
        const body = await request.json().catch(() => null)
        if (!body) return badRequest('Request body is required')

        const result = verifyEmailSchema.safeParse(body)
        if (!result.success) {
            return createErrorResponse(
                ErrorCode.VALIDATION_ERROR,
                'Validation failed',
                HttpStatus.BAD_REQUEST,
                { errors: result.error.flatten().fieldErrors }
            )
        }

        const verificationToken = await findValidEmailVerificationToken(result.data.token)

        if (!verificationToken) {
            return createErrorResponse(
                ErrorCode.AUTH_TOKEN_INVALID,
                'Verification token is invalid or expired',
                HttpStatus.BAD_REQUEST
            )
        }

        await prisma.$transaction(async (transactionClient) => {
            await transactionClient.user.update({
                where: { id: verificationToken.userId },
                data: { emailVerified: true },
            })

            await transactionClient.emailVerificationToken.update({
                where: { id: verificationToken.id },
                data: { usedAt: new Date() },
            })

            await transactionClient.emailVerificationToken.updateMany({
                where: {
                    userId: verificationToken.userId,
                    usedAt: null,
                },
                data: { usedAt: new Date() },
            })
        })

        return createSuccessResponse({
            message: 'Email verified successfully',
        })
    } catch (error) {
        console.error('[POST /api/auth/verify-email]', error)
        return serverError('Failed to verify email')
    }
}
