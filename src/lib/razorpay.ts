import Razorpay from 'razorpay';
import { paymentEnv } from '@/lib/env';

let razorpayClient: Razorpay | null = null;

function getRazorpayClient() {
  if (razorpayClient) {
    return razorpayClient;
  }

  if (!paymentEnv.keyId || !paymentEnv.keySecret) {
    throw new Error('Razorpay is not configured');
  }

  razorpayClient = new Razorpay({
    key_id: paymentEnv.keyId,
    key_secret: paymentEnv.keySecret,
  });

  return razorpayClient;
}

export const razorpay = new Proxy({} as Razorpay, {
  get(_target, property) {
    return getRazorpayClient()[property as keyof Razorpay];
  },
});
