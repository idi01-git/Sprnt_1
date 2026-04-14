'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Tag, ShoppingCart, Check } from 'lucide-react';
import Script from 'next/script';
import { fetchApi } from '@/lib/api';

const poppins: React.CSSProperties = { fontFamily: "'Poppins', sans-serif" };
const outfit: React.CSSProperties = { fontFamily: "'Outfit', sans-serif" };

declare global {
    interface Window {
        Razorpay: any;
    }
}

interface BuyButtonProps {
    courseId: string;
    courseName: string;
    coursePrice: number;
    slug: string;
}

export default function BuyButton({ courseId, courseName, coursePrice, slug }: BuyButtonProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [promoCode, setPromoCode] = useState('');
    const [promoLoading, setPromoLoading] = useState(false);
    const [promoApplied, setPromoApplied] = useState<{ code: string; discount: number } | null>(null);
    const [promoError, setPromoError] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const finalPrice = promoApplied
        ? Math.max(0, coursePrice - promoApplied.discount)
        : coursePrice;

    const handleApplyPromo = async () => {
        if (!promoCode.trim()) return;

        setPromoLoading(true);
        setPromoError(null);
        setPromoApplied(null);

        try {
            const res = await fetchApi<{
                valid: boolean;
                discountAmount: number;
                discountType: string;
                originalPrice: number;
                finalAmount: number;
                message?: string;
            }>(
                '/api/promocode/validate',
                {
                    method: 'POST',
                    body: JSON.stringify({ code: promoCode.trim().toUpperCase(), courseId }),
                }
            );

            if (res.success && res.data?.valid) {
                setPromoApplied({
                    code: promoCode.trim().toUpperCase(),
                    discount: res.data.discountAmount,
                });
            } else {
                setPromoError(res.error?.message || res.data?.message || 'Invalid promo code');
            }
        } catch {
            setPromoError('Failed to validate promo code');
        } finally {
            setPromoLoading(false);
        }
    };

    const handleBuy = async () => {
        setLoading(true);
        setError(null);

        try {
            const orderRes = await fetchApi<{
                orderId: string;
                amount: number;
                currency: string;
                keyId: string;
                userName: string | null;
                userEmail: string | null;
                userPhone: string | null;
            }>('/api/enroll/create-order', {
                method: 'POST',
                body: JSON.stringify({
                    courseId,
                    promocode: promoApplied?.code || undefined,
                }),
            });

            if (!orderRes.success || !orderRes.data) {
                if (orderRes.error?.code === 'AUTH_REQUIRED' || orderRes.error?.code === 'UNAUTHORIZED') {
                    router.push(`/login?redirect=/courses/${slug}`);
                    return;
                }

                throw new Error(orderRes.error?.message || 'Failed to create order');
            }

            const { orderId, amount, currency, keyId, userName, userEmail, userPhone } = orderRes.data;

            if (!window.Razorpay) {
                throw new Error('Payment gateway not loaded. Please refresh and try again.');
            }

            const rzp = new window.Razorpay({
                key: keyId,
                amount,
                currency,
                name: 'Sprintern',
                description: courseName,
                order_id: orderId,
                prefill: {
                    name: userName || '',
                    email: userEmail || '',
                    contact: userPhone || '',
                },
                theme: { color: '#9333ea' },
                modal: {
                    ondismiss: () => setLoading(false),
                },
                handler: async (response: {
                    razorpay_order_id: string;
                    razorpay_payment_id: string;
                    razorpay_signature: string;
                }) => {
                    const verifyRes = await fetchApi<{ enrollmentId: string }>(
                        '/api/enroll/verify-payment',
                        {
                            method: 'POST',
                            body: JSON.stringify({
                                razorpayOrderId: response.razorpay_order_id,
                                razorpayPaymentId: response.razorpay_payment_id,
                                razorpaySignature: response.razorpay_signature,
                            }),
                        }
                    );

                    if (verifyRes.success && verifyRes.data?.enrollmentId) {
                        router.push(`/learn/${verifyRes.data.enrollmentId}/day/1`);
                    } else {
                        setError('Payment verified but enrollment failed. Please contact support.');
                        setLoading(false);
                    }
                },
            });

            rzp.on('payment.failed', (resp: any) => {
                console.error('[Razorpay Payment Failed]', {
                    resp,
                    errorKeys: resp.error ? Object.keys(resp.error) : 'no error object',
                    errorString: JSON.stringify(resp.error),
                });

                let errorMsg = 'Payment failed. Please try again.';
                if (resp.error) {
                    if (resp.error.description) {
                        errorMsg = resp.error.description;
                    } else if (resp.error.reason) {
                        errorMsg = resp.error.reason;
                    } else if (resp.error.message) {
                        errorMsg = resp.error.message;
                    } else if (resp.error.code) {
                        errorMsg = `Error (${resp.error.code}): Payment was declined`;
                    } else if (typeof resp.error === 'object' && Object.keys(resp.error).length === 0) {
                        errorMsg = 'Payment was declined by your bank. Please try a different payment method or card.';
                    }
                } else {
                    errorMsg = 'Payment failed. No response from payment gateway.';
                }

                setError(errorMsg);
                setLoading(false);
            });

            rzp.open();
        } catch (err: any) {
            setError(err.message || 'Something went wrong');
            setLoading(false);
        }
    };

    return (
        <>
            <Script
                src="https://checkout.razorpay.com/v1/checkout.js"
                strategy="afterInteractive"
            />

            <div className="mt-2 flex flex-col gap-3">
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Tag className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
                        <input
                            type="text"
                            value={promoCode}
                            onChange={(event) => {
                                setPromoCode(event.target.value.toUpperCase());
                                setPromoError(null);
                                setPromoApplied(null);
                            }}
                            placeholder="Promo code"
                            disabled={!!promoApplied}
                            className="w-full rounded-xl border border-white/20 bg-white/10 py-2.5 pl-9 pr-3 text-sm text-white placeholder-white/40 transition-all focus:border-white/50 focus:outline-none disabled:opacity-50"
                            style={poppins}
                        />
                    </div>
                    <button
                        onClick={handleApplyPromo}
                        disabled={promoLoading || !promoCode.trim() || !!promoApplied}
                        className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${promoApplied
                            ? 'bg-green-400 text-green-900'
                            : 'bg-white/20 text-white hover:bg-white/30 disabled:opacity-50'
                            }`}
                        style={poppins}
                    >
                        {promoLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : promoApplied ? <Check className="h-4 w-4" /> : 'Apply'}
                    </button>
                </div>

                {promoApplied && (
                    <p className="flex items-center gap-1.5 text-sm text-green-300" style={poppins}>
                        <Check className="h-3.5 w-3.5" /> Code <strong>{promoApplied.code}</strong> applied - Rs. {promoApplied.discount} off.
                    </p>
                )}

                {promoError && (
                    <p className="text-sm text-red-300" style={poppins}>{promoError}</p>
                )}

                {promoApplied && (
                    <div className="flex items-center gap-3">
                        <span className="text-xl text-white/50 line-through" style={outfit}>Rs. {coursePrice}</span>
                        <span className="text-3xl font-bold text-white" style={{ ...outfit, fontWeight: 800 }}>Rs. {finalPrice}</span>
                    </div>
                )}

                {error && (
                    <p className="rounded-xl bg-red-500/10 px-4 py-2 text-sm text-red-300" style={poppins}>{error}</p>
                )}

                <button
                    onClick={handleBuy}
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-white/30 px-8 py-4 font-semibold text-white transition-all hover:bg-white/10 disabled:opacity-60 sm:w-auto"
                    style={{ ...poppins, fontWeight: 600 }}
                >
                    {loading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                        <ShoppingCart className="h-5 w-5" />
                    )}
                    {loading ? 'Processing...' : `Buy Full Course - Rs. ${finalPrice}`}
                </button>
            </div>
        </>
    );
}
