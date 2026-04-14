import { requireSuperAdmin, AuthError } from '@/lib/auth/guards'
import { createSuccessResponse, serverError, HttpStatus } from '@/lib/api-response'
import { paymentEnv } from '@/lib/env'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    try {
        await requireSuperAdmin()

        const keyId = paymentEnv.keyId ?? ''
        const hasSecret = !!paymentEnv.keySecret
        const hasWebhookSecret = !!paymentEnv.webhookSecret

        const masked = keyId.length > 4 ? `${keyId.slice(0, 4)}..${keyId.slice(-4)}` : '****'

        return createSuccessResponse({
            provider: 'Razorpay',
            keyId: masked,
            configured: hasSecret && keyId.length > 0,
            webhookConfigured: hasWebhookSecret,
        })
    } catch (error) {
        if (error instanceof AuthError) {
            return createSuccessResponse(null, HttpStatus.UNAUTHORIZED)
        }
        console.error('[GET /api/admin/settings/payment-gateway]', error)
        return serverError()
    }
}
