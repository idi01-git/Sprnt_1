import { processRazorpayWebhook } from '@/lib/payments'

export async function POST(request: Request) {
    return processRazorpayWebhook(request)
}
