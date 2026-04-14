import { NextRequest } from 'next/server'
import { validateRequest } from '@/lib/auth/session'
import { verifyPaymentSchema } from '@/lib/validations/enrollment'
import { verifyEnrollmentPayment } from '@/lib/enrollment-payments'
import {
    createSuccessResponse,
    createErrorResponse,
    serverError,
    HttpStatus,
    ErrorCode,
} from '@/lib/api-response'

/**
 * POST /api/enroll/verify-payment
 * Client-side payment verification: validate Razorpay signature,
 * update enrollment status as backup to webhook.
 * Auth: Session Cookie
 */
export async function POST(request: NextRequest) {
    try {
        const { user } = await validateRequest()
        if (!user) {
            return createErrorResponse(
                ErrorCode.AUTH_REQUIRED,
                'Authentication required',
                HttpStatus.UNAUTHORIZED
            )
        }

        const body = await request.json()
        const result = verifyPaymentSchema.safeParse(body)
        if (!result.success) {
            return createErrorResponse(
                ErrorCode.VALIDATION_ERROR,
                'Invalid request body',
                HttpStatus.BAD_REQUEST,
                { errors: result.error.flatten().fieldErrors }
            )
        }

        const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = result.data

        const canonicalVerification = await verifyEnrollmentPayment({
            userId: user.id,
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature,
        })

        return createSuccessResponse(canonicalVerification)
    } catch (error) {
        console.error('[POST /api/enroll/verify-payment]', error)
        return serverError('Failed to verify payment')
    }
}
