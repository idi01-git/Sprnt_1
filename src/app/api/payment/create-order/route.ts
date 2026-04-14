export { POST } from '@/app/api/enroll/create-order/route';

/*

import { NextRequest } from 'next/server';
import { razorpay } from '@/lib/razorpay';
import { prisma } from '@/lib/db';
import { validateRequest } from '@/lib/auth/session';
import { 
  createSuccessResponse, 
  unauthorized, 
  badRequest, 
  serverError 
} from '@/lib/api-response';

async function legacyCreateOrderRoute(req: NextRequest) {
  try {
    const { user } = await validateRequest();
    if (!user) {
      return unauthorized();
    }

    const body = await req.json();
    const { courseId } = body;

    if (!courseId) {
      return badRequest('Course ID is required');
    }

    // Check if course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, coursePrice: true }
    });

    if (!course) {
      return badRequest('Course not found');
    }

    // Amount in paise (₹4999 = 499900 paise)
    const amount = 499900; 
    const currency = 'INR';

    // Create Razorpay Order
    const order = await razorpay.orders.create({
      amount,
      currency,
      receipt: `receipt_${Date.now()}`,
    });

    // Create pending enrollment (updated to success on payment verification)
    await prisma.enrollment.create({
      data: {
        userId: user.id,
        courseId: course.id,
        paymentStatus: 'pending',
        paymentGatewayOrderId: order.id,
        amountPaid: 0, // Will be updated on verification
      }
    });

    return createSuccessResponse({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID
    });

  } catch (error) {
    console.error('[RAZORPAY_CREATE_ORDER_ERROR]', error);
    return serverError('Failed to create payment order');
  }
}
*/
