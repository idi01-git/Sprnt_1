import { NextRequest } from 'next/server'
import { validateRequest } from '@/lib/auth/session'
import { createOrderSchema } from '@/lib/validations/enrollment'
import { createEnrollmentOrder } from '@/lib/enrollment-payments'
import { PaymentError } from '@/lib/payments'
import {
    createSuccessResponse,
    createErrorResponse,
    serverError,
    HttpStatus,
    ErrorCode,
} from '@/lib/api-response'

/**
 * POST /api/enroll/create-order
 * Create Razorpay order with course price (minus discount if promocode valid).
 * Return order_id, amount, key_id.
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
        const result = createOrderSchema.safeParse(body)
        if (!result.success) {
            return createErrorResponse(
                ErrorCode.VALIDATION_ERROR,
                'Invalid request body',
                HttpStatus.BAD_REQUEST,
                { errors: result.error.flatten().fieldErrors }
            )
        }

        const { courseId, promocode: promoCode } = result.data

        const canonicalOrder = await createEnrollmentOrder({
            userId: user.id,
            courseId,
            promocode: promoCode,
        })

        return createSuccessResponse(canonicalOrder, HttpStatus.CREATED)
    } catch (error) {
        if (error instanceof PaymentError) {
            console.error('[POST /api/enroll/create-order] PaymentError:', error.message)
            return createErrorResponse(
                error.code,
                error.message,
                error.statusCode as 400 | 500,
            )
        }
        console.error('[POST /api/enroll/create-order]', error)
        return serverError('Failed to create order')
    }
}
