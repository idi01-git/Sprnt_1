import { hash } from 'argon2'
import { prisma } from '@/lib/db'
import { createSession } from '@/lib/auth/session'
import { findValidPasswordResetToken } from '@/lib/auth/tokens'
import { resetPasswordSchema } from '@/lib/validations/auth'
import {
    createSuccessResponse,
    createErrorResponse,
    badRequest,
    serverError,
    HttpStatus,
    ErrorCode,
} from '@/lib/api-response'

/**
 * POST /api/auth/reset-password
 * Validate reset token, hash new password, auto-login
 */
export async function POST(request: Request) {
    try {
        // 1. Parse & validate body
        const body = await request.json().catch(() => null)
        if (!body) return badRequest('Request body is required')

        const result = resetPasswordSchema.safeParse(body)
        if (!result.success) {
            return createErrorResponse(
                ErrorCode.VALIDATION_ERROR,
                'Validation failed',
                HttpStatus.BAD_REQUEST,
                { errors: result.error.flatten().fieldErrors }
            )
        }

        const passwordResetToken = await findValidPasswordResetToken(result.data.token)

        if (!passwordResetToken) {
            return createErrorResponse(
                ErrorCode.AUTH_TOKEN_INVALID,
                'Reset token is invalid or expired',
                HttpStatus.BAD_REQUEST
            )
        }

        const hashedPassword = await hash(result.data.password)

        await prisma.$transaction(async (transactionClient) => {
            await transactionClient.user.update({
                where: { id: passwordResetToken.userId },
                data: {
                    hashedPassword,
                },
            })

            await transactionClient.passwordResetToken.update({
                where: { id: passwordResetToken.id },
                data: { usedAt: new Date() },
            })

            await transactionClient.passwordResetToken.updateMany({
                where: {
                    userId: passwordResetToken.userId,
                    usedAt: null,
                },
                data: { usedAt: new Date() },
            })

            await transactionClient.session.deleteMany({
                where: {
                    userId: passwordResetToken.userId,
                },
            })
        })

        await createSession(passwordResetToken.userId)

        return createSuccessResponse({
            message: 'Password reset successful',
        })
    } catch (error) {
        console.error('[POST /api/auth/reset-password]', error)
        return serverError('Failed to reset password')
    }
}
