import { issueEmailVerificationToken } from '@/lib/auth/tokens'
import { getStudentAuthContext } from '@/lib/auth/session'
import { sendVerificationEmail } from '@/lib/email'
import {
    createSuccessResponse,
    createErrorResponse,
    unauthorized,
    serverError,
    HttpStatus,
    ErrorCode,
} from '@/lib/api-response'

/**
 * POST /api/auth/resend-verification
 * Generate new email verification token and send email via Resend
 */
export async function POST() {
    try {
        const authContext = await getStudentAuthContext()
        if (!authContext) {
            return unauthorized()
        }

        if (authContext.user.emailVerified) {
            return createSuccessResponse({
                message: 'Email is already verified',
            })
        }

        const verificationToken = await issueEmailVerificationToken(authContext.user.id)
        await sendVerificationEmail(
            authContext.user.email,
            authContext.user.name,
            verificationToken
        )

        return createSuccessResponse({
            message: 'Verification email sent successfully',
        })
    } catch (error) {
        console.error('[POST /api/auth/resend-verification]', error)
        return serverError('Failed to resend verification email')
    }
}
