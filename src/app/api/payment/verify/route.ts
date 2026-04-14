export { POST } from '@/app/api/enroll/verify-payment/route';

/*

import { NextRequest } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/db';
import { validateRequest } from '@/lib/auth/session';
import { 
  createSuccessResponse, 
  unauthorized,
  badRequest, 
  serverError 
} from '@/lib/api-response';

async function legacyVerifyPaymentRoute(req: NextRequest) {
  try {
    const { user } = await validateRequest();
    if (!user) {
      return unauthorized();
    }

    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, courseId } = await req.json();

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return badRequest('Signature verification data missing');
    }

    // Razorpay signature verification
    const secret = process.env.RAZORPAY_KEY_SECRET!;
    const body = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    const isValid = expectedSignature === razorpaySignature;

    if (!isValid) {
      return badRequest('Invalid payment signature');
    }

    // Update enrollment to success
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        userId: user.id,
        courseId: courseId,
        paymentGatewayOrderId: razorpayOrderId
      }
    });

    if (enrollment) {
      await prisma.enrollment.update({
        where: { id: enrollment.id },
        data: {
          paymentStatus: 'success',
          paymentGatewayPaymentId: razorpayPaymentId,
          enrolledAt: new Date()
        }
      });
    }

    return createSuccessResponse({ success: true });

  } catch (error) {
    console.error('[RAZORPAY_VERIFY_PAYMENT_ERROR]', error);
    return serverError('Failed to verify payment');
  }
}
*/
