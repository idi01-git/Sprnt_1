export { POST } from '@/app/api/webhooks/razorpay/route';

/*

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/db';

async function legacyWebhookRoute(req: NextRequest) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = req.headers.get('x-razorpay-signature');

  if (!secret || !signature) {
    return NextResponse.json({ error: 'Webhook secret or signature missing' }, { status: 400 });
  }

  const rawBody = await req.text();
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  if (expectedSignature !== signature) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const event = JSON.parse(rawBody);
  const { event: eventName, payload } = event;

  try {
    if (eventName === 'payment.captured' || eventName === 'order.paid') {
      const payment = payload.payment.entity;
      const orderId = payment.order_id;
      const paymentId = payment.id;

      // Enrollment is created directly - find by orderId in payment metadata
      const enrollment = await prisma.enrollment.findFirst({
        where: { paymentGatewayOrderId: orderId }
      });

      if (enrollment && enrollment.paymentStatus !== 'success') {
        await prisma.enrollment.update({
          where: { id: enrollment.id },
          data: {
            paymentStatus: 'success',
            paymentGatewayPaymentId: paymentId,
            enrolledAt: new Date()
          }
        });
      }
    }
    // payment.failed event can be handled if needed

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error('[RAZORPAY_WEBHOOK_ERROR]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
*/
