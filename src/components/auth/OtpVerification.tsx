'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Mail, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function OtpVerification() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Handle Resend Countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (data.success) {
        setStep(2);
        setResendTimer(30);
        // Focus first OTP input after short delay
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
      } else {
        setError(data.error?.message || 'Failed to send OTP');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (otpString: string) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otpString }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
      } else {
        setError(data.error?.message || 'Invalid or expired OTP');
        // Clear OTP on error
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch {
      setError('Failed to verify OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return;

    const newOtp = [...otp];
    // Allow pasting a full 6-digit string
    if (value.length > 1) {
      const pasted = value.slice(0, 6).split('');
      for (let i = 0; i < pasted.length; i++) {
        if (index + i < 6) newOtp[index + i] = pasted[i];
      }
      setOtp(newOtp);
      // Focus the next empty box or the last box
      const nextEmptyIndex = newOtp.findIndex(val => val === '');
      const focusIndex = nextEmptyIndex !== -1 ? nextEmptyIndex : 5;
      inputRefs.current[focusIndex]?.focus();
      
      if (newOtp.every(v => v !== '')) {
        handleVerifyOtp(newOtp.join(''));
      }
      return;
    }

    // Standard single character flow
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-advance
    if (value !== '') {
      if (index < 5) {
        inputRefs.current[index + 1]?.focus();
      } else {
        // Last digit entered
        if (newOtp.every(v => v !== '')) {
          handleVerifyOtp(newOtp.join(''));
        }
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (otp[index] === '' && index > 0) {
        // Move back and clear
        inputRefs.current[index - 1]?.focus();
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
      } else {
        // Just clear current
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      }
    }
  };

  return (
    <div className="w-full max-w-md mx-auto relative">
      <AnimatePresence mode="wait">
        
        {/* STEP 1: EMAIL ENTRY */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="bg-white p-8 rounded-3xl shadow-xl shadow-purple-500/5 border border-purple-100"
          >
            <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center mb-6">
              <Mail className="w-6 h-6 text-purple-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2 font-outfit">Sign in with Email</h2>
            <p className="text-gray-500 mb-6 font-poppins text-sm">We'll send a secure one-time password to your inbox — no password needed.</p>
            
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(null); }}
                  placeholder="Enter your email"
                  required
                  autoFocus
                  className={`w-full px-4 py-3 rounded-xl bg-gray-50 border transition-all focus:outline-none focus:ring-2 focus:bg-white font-poppins ${
                    error ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:border-purple-400 focus:ring-purple-100'
                  }`}
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg font-poppins">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold transition-all hover:shadow-lg hover:shadow-purple-500/30 flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed font-poppins"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Continue
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          </motion.div>
        )}

        {/* STEP 2: OTP ENTRY */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white p-8 rounded-3xl shadow-xl shadow-purple-500/5 border border-purple-100 relative overflow-hidden"
          >
            {success && (
               <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                 <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                   <CheckCircle2 className="w-8 h-8 text-green-600" />
                 </motion.div>
                 <h3 className="text-xl font-bold text-gray-900 font-outfit">Verified Successfully</h3>
                 <p className="text-gray-500 text-sm mt-2 font-poppins">Redirecting to your dashboard...</p>
               </div>
            )}

            <button 
              onClick={() => { setStep(1); setError(null); }}
              className="text-sm font-medium text-gray-400 hover:text-purple-600 mb-6 flex items-center gap-1 transition-colors font-poppins"
            >
              ← Back
            </button>

            <h2 className="text-2xl font-bold text-gray-900 mb-2 font-outfit">Check your email</h2>
            <p className="text-gray-500 mb-6 font-poppins text-sm leading-relaxed">
              We've sent a 6-digit code to <br/>
              <span className="font-semibold text-gray-800">{email}</span>
            </p>

            {/* 6-box input */}
            <div className="flex gap-2 justify-between mb-6">
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <input
                  key={index}
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp[index]}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  disabled={loading || success}
                  className={`w-12 h-14 text-center text-xl font-bold rounded-xl border-2 transition-all focus:outline-none focus:ring-0 ${
                    error 
                      ? 'border-red-300 text-red-600 focus:border-red-500 bg-red-50/50' 
                      : otp[index] 
                        ? 'border-purple-600 text-purple-700 bg-purple-50/30 shadow-[0_0_15px_rgba(147,51,234,0.1)]' 
                        : 'border-gray-200 text-gray-900 bg-gray-50 focus:border-purple-400 focus:bg-white'
                  }`}
                  style={{ fontFamily: 'var(--font-outfit)' }}
                />
              ))}
            </div>

            {error && (
              <div className="flex items-center justify-center gap-2 text-sm text-red-600 font-medium mb-6 animate-pulse font-poppins">
                <AlertCircle className="w-4 h-4" />
                <p>{error}</p>
              </div>
            )}

            {loading && !success && (
              <div className="flex justify-center mb-6">
                <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
              </div>
            )}

            <div className="text-center">
              <p className="text-sm text-gray-500 font-poppins">
                Didn't receive the code?{' '}
                <button
                  onClick={handleSendOtp}
                  disabled={resendTimer > 0 || loading || success}
                  className="font-medium text-purple-600 hover:text-purple-700 disabled:text-gray-400 disabled:pointer-events-none transition-colors ml-1"
                >
                  {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Click to resend'}
                </button>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
