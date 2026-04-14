'use client';

import { useState } from 'react';
import { Check, Sparkles, Loader2, ShieldCheck, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

interface PricingCardProps {
  courseId: string;
  courseName: string;
  price?: number;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function PricingCard({ courseId, courseName, price = 4999 }: PricingCardProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    setLoading(true);
    try {
      // 1. Load Razorpay script
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        alert('Razorpay SDK failed to load. Are you online?');
        setLoading(false);
        return;
      }

      // 2. Create order on server
      const orderRes = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId }),
      });

      const orderData = await orderRes.json();
      if (!orderData.success) {
        throw new Error(orderData.error?.message || 'Failed to create order');
      }

      const { orderId, amount, currency, keyId } = orderData.data;

      // 3. Open Razorpay Checkout
      const options = {
        key: keyId,
        amount: amount,
        currency: currency,
        name: 'Sprintern',
        description: `Enrollment for ${courseName}`,
        order_id: orderId,
        handler: async function (response: any) {
          // 4. Verify payment on server
          setLoading(true);
          const verifyRes = await fetch('/api/payment/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            }),
          });

          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            router.push('/dashboard');
          } else {
            alert('Payment verification failed. Please contact support.');
          }
          setLoading(false);
        },
        prefill: {
          name: '',
          email: '',
          contact: '',
        },
        theme: {
          color: '#7C3AED', // purple-600
        },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();

    } catch (error: any) {
      console.error('Payment Error:', error);
      alert(error.message || 'Something went wrong with the payment');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    '7-Day Industry-Ready Curriculum',
    'Guided Projects & Portfolio Tasks',
    'Personalized Feedback & Peer Review',
    'Verified Digital Certificate',
    'Lifetime Access to Course Content',
    'Priority Support & Community Access',
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md w-full mx-auto"
    >
      <div className="relative group">
        {/* Glow Effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
        
        <div className="relative bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-xl">
          {/* Header */}
          <div className="bg-gradient-to-br from-purple-50 to-white px-8 py-10 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 border border-purple-200 mb-4">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span className="text-xs font-bold text-purple-700 uppercase tracking-wider">Premium Access</span>
            </div>
            
            <h3 className="text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
              Full Program Access
            </h3>
            
            <div className="flex items-center justify-center gap-1 mt-4">
              <span className="text-5xl font-extrabold text-gray-900">₹{price.toLocaleString()}</span>
              <span className="text-gray-500 font-medium">/course</span>
            </div>
          </div>

          {/* Features List */}
          <div className="px-8 py-8 space-y-4">
            {features.map((feature, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <div className="mt-1 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-green-600" />
                </div>
                <p className="text-gray-600 text-sm font-medium" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  {feature}
                </p>
              </div>
            ))}
          </div>

          {/* Footer / CTA */}
          <div className="px-8 pb-10">
            <button
              onClick={handlePayment}
              disabled={loading}
              className="w-full relative group/btn overflow-hidden px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-[102%] group-hover/btn:translate-y-0 transition-transform duration-300" />
              
              <span className="relative flex items-center justify-center gap-3 font-bold text-lg" style={{ fontFamily: "'Poppins', sans-serif" }}>
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5 fill-current" />
                    Enroll Now
                  </>
                )}
              </span>
            </button>

            <div className="mt-6 flex items-center justify-center gap-4 text-xs text-gray-400 font-medium uppercase tracking-widest">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-green-500" />
                <span>Secure Payment</span>
              </div>
              <div className="w-1 h-1 bg-gray-300 rounded-full" />
              <span>Instant Access</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
