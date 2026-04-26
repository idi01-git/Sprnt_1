'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { X, Mail, Lock, User, Phone, Calendar, ChevronDown, LogOut, Loader2, ArrowRight } from 'lucide-react';
import { getFirebaseAuth, getGoogleProvider } from '@/lib/firebase-client';

type View = 'login' | 'signup' | 'forgot';

interface AuthedUser {
  id: string;
  name: string;
  email: string;
  role: string;
  emailVerified: boolean;
}

interface FieldErrors {
  email?: string[];
  password?: string[];
  name?: string[];
  phone?: string[];
  dob?: string[];
  studyLevel?: string[];
  referralCode?: string[];
}

const STUDY_LEVEL_OPTIONS = [
  { value: 'NINTH', label: '9th Grade' },
  { value: 'TENTH', label: '10th Grade' },
  { value: 'ELEVENTH', label: '11th Grade' },
  { value: 'TWELFTH', label: '12th Grade' },
  { value: 'COLLEGE_1', label: 'College 1st Year' },
  { value: 'COLLEGE_2', label: 'College 2nd Year' },
  { value: 'COLLEGE_3', label: 'College 3rd Year' },
  { value: 'COLLEGE_4', label: 'College 4th Year' },
  { value: 'GRADUATED', label: 'Graduated' },
];

const inputClass =
  'neo-input w-full px-4 py-3 pr-10 text-gray-900 placeholder:text-gray-400';
const inputStyle: React.CSSProperties = {
  fontFamily: "'Poppins', sans-serif",
  fontWeight: 600,
  fontSize: '14px',
  color: '#1a1a2e',
};
const labelStyle: React.CSSProperties = {
  fontFamily: "'Poppins', sans-serif",
  fontWeight: 700,
  color: '#1a1a2e',
};
const btnStyle: React.CSSProperties = {
  fontFamily: "'Poppins', sans-serif",
  fontWeight: 700,
  fontSize: '15px',
};

function parseApiError(data: any, httpStatus: number): { message: string; fields: FieldErrors } {
  const code: string = data?.error?.code ?? '';
  const message: string = data?.error?.message ?? data?.message ?? 'Something went wrong. Please try again.';
  const details = data?.error?.details ?? data?.details ?? {};
  const fieldErrors: FieldErrors = details?.errors ?? {};

  const friendlyMessages: Record<string, string> = {
    AUTH_INVALID_CREDENTIALS: 'Invalid email or password. Please try again.',
    AUTH_EMAIL_EXISTS: 'An account with this email already exists.',
    AUTH_PHONE_EXISTS: 'An account with this phone number already exists.',
    AUTH_ACCOUNT_DISABLED: 'Your account has been disabled. Please contact support.',
    AUTH_SESSION_EXPIRED: 'Your session has expired. Please log in again.',
    RATE_LIMITED: 'Too many attempts. Please wait a moment and try again.',
    SERVICE_UNAVAILABLE: 'Service is temporarily unavailable. Please try again shortly.',
    VALIDATION_ERROR: httpStatus === 409
      ? 'An account with this email already exists.'
      : message,
  };

  return {
    message: friendlyMessages[code] ?? message,
    fields: fieldErrors,
  };
}

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [view, setView] = useState<View>('login');

  const [authedUser, setAuthedUser] = useState<AuthedUser | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [studyLevel, setStudyLevel] = useState('');
  const [referralCode, setReferralCode] = useState('');

  // Google OAuth state
  const [googleUser, setGoogleUser] = useState<{ idToken?: string; email?: string; name?: string } | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch('/api/auth/session', { credentials: 'include' });
        const data = await res.json().catch(() => null);
        if (data?.success && data?.data?.user) {
          setAuthedUser(data.data.user);
        }
      } catch (err) {
        console.error('Failed to fetch session:', err);
      }
    };
    fetchSession();
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const resetForm = () => {
    setEmail(''); setPassword(''); setName(''); setPhone('');
    setDob(''); setStudyLevel(''); setReferralCode('');
    setGoogleUser(null);
    setError(''); setFieldErrors({}); setSuccessMessage(''); setIsLoading(false);
  };

  const openModal = (v: View) => { resetForm(); setView(v); setShowModal(true); };
  const closeModal = () => { setShowModal(false); resetForm(); };
  const switchView = (v: View) => { resetForm(); setView(v); };

  const handleSignUp = async () => {
    setError(''); setFieldErrors({});

    if (!name.trim()) { setError('Please enter your full name.'); return; }
    if (!email.trim()) { setError('Please enter your email address.'); return; }

    // For Google signup, password is not required
    const isGoogleSignup = !!googleUser?.idToken;
    if (!isGoogleSignup && !password) { setError('Please enter a password.'); return; }

    setIsLoading(true);
    try {
      if (isGoogleSignup) {
        // Google signup - use OAuth API
        const res = await fetch('/api/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            idToken: googleUser.idToken,
            referralCode: referralCode.trim() || undefined,
            profileData: {
              phone: phone.trim() || undefined,
              dob: dob || undefined,
              studyLevel: studyLevel || undefined,
            },
          }),
          credentials: 'include',
        });

        const data = await res.json().catch(() => ({}));

        if (res.ok) {
          window.location.replace('/dashboard');
        } else {
          const parsed = parseApiError(data, res.status);
          setError(parsed.message);
          setIsLoading(false);
        }
      } else {
        // Regular signup - use register API
        const body: Record<string, unknown> = { name, email, password };
        if (referralCode.trim()) body.referralCode = referralCode.trim();
        if (phone.trim()) body.phone = phone.trim();
        if (dob) body.dob = dob;
        if (studyLevel) body.studyLevel = studyLevel;

        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          credentials: 'include',
        });

        const data = await res.json().catch(() => ({}));

        if (res.ok) {
          setSuccessMessage('Account created! Redirecting to your dashboard.');
          setTimeout(() => {
            window.location.replace('/dashboard');
          }, 1000);
        } else {
          const parsed = parseApiError(data, res.status);
          setError(parsed.message);
          setFieldErrors(parsed.fields);
          setIsLoading(false);
        }
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    setError(''); setFieldErrors({});

    if (!email.trim()) { setError('Please enter your email address.'); return; }
    if (!password) { setError('Please enter a password.'); return; }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setSuccessMessage('Logged in successfully!');
        setTimeout(() => {
          closeModal();
          // Use replace instead of href to avoid history issues
          window.location.replace('/dashboard');
        }, 800);
      } else {
        const parsed = parseApiError(data, res.status);
        setError(parsed.message);
        setIsLoading(false);
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setError(''); setFieldErrors({});

    if (!email.trim()) { setError('Please enter your email address.'); return; }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setSuccessMessage('If that email exists, a reset link has been sent. Check your inbox.');
      } else {
        const parsed = parseApiError(data, res.status);
        setError(parsed.message);
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setUserMenuOpen(false);
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => { });
    setAuthedUser(null);
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setIsLoading(true);
    try {
      const auth = getFirebaseAuth();
      const provider = getGoogleProvider();
      const result = await import('firebase/auth').then(m => m.signInWithPopup(auth, provider));
      const idToken = await result.user.getIdToken();
      const email = result.user.email || '';
      const name = result.user.displayName || '';

      if (view === 'login') {
        // For login view: check if user exists first
        const res = await fetch('/api/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken }),
          credentials: 'include',
        });

        const data = await res.json().catch(() => ({}));

        if (res.ok) {
          // User exists - log them in and redirect to dashboard
          window.location.replace('/dashboard');
        } else {
          // User doesn't exist - pre-fill signup form with Google data
          setName(name);
          setEmail(email);
          setGoogleUser({ idToken, email, name });
          setView('signup');
          setIsLoading(false);
        }
      } else {
        // For signup view: pre-fill form with Google data
        setName(name);
        setEmail(email);
        setGoogleUser({ idToken, email, name });
        setView('signup');
        setIsLoading(false);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Google sign-in failed. Please try again.';
      if (message.includes('popup-closed-by-user') || message.includes('Firebase: Error (auth/popup-closed-by-user)')) {
        setError('');
        setIsLoading(false);
        return;
      }
      setError(message);
      setIsLoading(false);
    }
  };

  const FieldError = ({ name }: { name: keyof FieldErrors }) =>
    fieldErrors[name]?.length ? (
      <p className="text-red-500 text-xs mt-1" style={inputStyle}>
        {fieldErrors[name]!.join(' ')}
      </p>
    ) : null;

  const StatusBlock = () => (
    <>
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-red-600 text-sm" style={inputStyle}>{error}</p>
        </div>
      )}
      {successMessage && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3">
          <p className="text-green-700 text-sm font-semibold" style={inputStyle}>{successMessage}</p>
        </div>
      )}
    </>
  );

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#FFF8E7] border-b-3 border-[#1a1a2e]' : 'bg-transparent'
          }`}
        style={{ animation: 'slideDown 0.6s ease-out', boxShadow: scrolled ? '0 4px 0 #1a1a2e' : 'none' }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
           <Link href="/" className="flex items-center gap-2 transition-transform duration-200 hover:scale-105">
              <Image
                src="/images/logo1.png"
                alt="Sprintern logo"
                width={460}
                height={300}
                className="h-14 w-52 object-cover -mt-3"
                priority
              />
            </Link>

            <div className="hidden md:flex items-center gap-8">
              {([
                { label: 'Home', href: '/' },
                { label: 'Courses', href: '/#courses' },
                { label: 'How It Works', href: '/#roadmap' },
              ] as { label: string; href: string }[]).map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="text-gray-900 hover:text-[#FF6B9D] transition-all duration-200 relative group hover:-translate-y-0.5"
                  style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: '15px' }}
                >
                  {item.label}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#1a1a2e] group-hover:w-full transition-all duration-300" />
                </Link>
              ))}
              <Link
                href="/verify"
                className="text-gray-900 hover:text-[#FF6B9D] transition-all duration-200 relative group hover:-translate-y-0.5"
                style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: '15px' }}
              >
                Verify Certificate
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#1a1a2e] group-hover:w-full transition-all duration-300" />
              </Link>
            </div>

            <div className="flex items-center gap-4">
              {authedUser ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen((o) => !o)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all duration-200 group border-2 border-transparent hover:border-[#1a1a2e] hover:bg-[#FFE156]"
                    style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700 }}
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#FF6B9D] border-2 border-[#1a1a2e] flex items-center justify-center text-[#1a1a2e] text-sm font-extrabold shrink-0">
                      {authedUser.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="hidden sm:block text-[#1a1a2e] transition-colors text-sm max-w-[120px] truncate">
                      {authedUser.name}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl py-1 z-50 animate-scale-up origin-top-right border-3 border-[#1a1a2e]" style={{ boxShadow: '5px 5px 0 #1a1a2e' }}>
                      <div className="px-4 py-3 border-b-2 border-[#1a1a2e]">
                        <p className="text-sm font-extrabold text-[#1a1a2e] truncate" style={{ fontFamily: "'Poppins', sans-serif" }}>
                          {authedUser.name}
                        </p>
                        <p className="text-xs font-bold text-gray-500 truncate" style={{ fontFamily: "'Poppins', sans-serif" }}>
                          {authedUser.email}
                        </p>
                        {!authedUser.emailVerified && (
                          <span className="inline-block mt-1 text-xs font-bold text-[#1a1a2e] bg-[#FFB347] border border-[#1a1a2e] px-2 py-0.5 rounded-md">
                            Email not verified
                          </span>
                        )}
                      </div>
                      <Link
                        href="/dashboard"
                        onClick={() => setUserMenuOpen(false)}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-[#1a1a2e] hover:bg-[#FFE156] transition-colors"
                        style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700 }}
                      >
                        My Dashboard
                      </Link>
                      <Link
                        href="/dashboard/wallet"
                        onClick={() => setUserMenuOpen(false)}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-[#1a1a2e] hover:bg-[#A8E6FF] transition-colors"
                        style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700 }}
                      >
                        Wallet &amp; Referrals
                      </Link>
                      <div className="border-t-2 border-[#1a1a2e] my-1" />
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-[#1a1a2e] hover:bg-[#FF6B9D] transition-colors"
                        style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700 }}
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <button
                    onClick={() => openModal('login')}
                    className="text-[#1a1a2e] hover:text-[#FF6B9D] transition-all duration-200 hover:scale-105"
                    style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: '15px' }}
                  >
                    LOGIN
                  </button>
                  <button
                    onClick={() => openModal('signup')}
                    className="neo-btn neo-btn-primary px-6 py-3"
                  >
                    START FREE TRIAL
                  </button>

                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {showModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-[#FFF8E7] rounded-2xl border-3 border-[#1a1a2e] max-w-md w-full mx-4 overflow-hidden animate-scale-up max-h-[92vh] overflow-y-auto" style={{ boxShadow: '8px 8px 0 #1a1a2e' }}>
            <div className="flex justify-end p-6 pb-0">
              <button onClick={closeModal} className="w-8 h-8 rounded-lg flex items-center justify-center transition-all bg-[#FF6B6B] border-2 border-[#1a1a2e] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-none" style={{ boxShadow: '2px 2px 0 #1a1a2e' }}>
                <X className="w-5 h-5 text-[#1a1a2e]" />
              </button>
            </div>

            <div className="px-6 pb-8 pt-4">

              {view === 'login' && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-2xl font-extrabold text-[#1a1a2e] mb-1" style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800 }}>
                      WELCOME BACK, ENGINEER.
                    </h2>
                    <p className="text-[#1a1a2e] font-semibold" style={{ ...inputStyle, fontSize: '14px', opacity: 0.8 }}>
                      Continue your sprint exactly where you left off.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 bg-white border-3 border-[#1a1a2e] text-[#1a1a2e] font-bold py-3 rounded-xl hover:translate-y-0.5 active:scale-95 disabled:opacity-60"
                    style={{ fontFamily: "'Poppins', sans-serif", fontSize: '15px', boxShadow: '4px 4px 0 #1a1a2e' }}
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                    )}
                    Continue with Google
                  </button>

                  <div className="flex items-center gap-4 -my-1">
                    <div className="flex-1 border-t-2 border-[#1a1a2e]"></div>
                    <span className="text-xs text-[#1a1a2e] font-bold tracking-wider" style={{ fontFamily: "'Poppins', sans-serif" }}>OR</span>
                    <div className="flex-1 border-t-2 border-[#1a1a2e]"></div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm text-[#1a1a2e]" style={labelStyle}>Enter Registered Email</label>
                    <div className="relative">
                      <input
                        type="email"
                        placeholder="e.g. anujdubey19@gmail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isLoading}
                        className={inputClass}
                        style={inputStyle}
                      />
                      <Mail className="absolute right-3 top-3.5 w-5 h-5 text-[#1a1a2e] opacity-50 pointer-events-none" />
                    </div>
                    <FieldError name="email" />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm text-[#1a1a2e]" style={labelStyle}>Password</label>
                    <div className="relative">
                      <input
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleLogin()}
                        disabled={isLoading}
                        className={inputClass}
                        style={inputStyle}
                      />
                      <Lock className="absolute right-3 top-3.5 w-5 h-5 text-[#1a1a2e] opacity-50 pointer-events-none" />
                    </div>
                    <FieldError name="password" />
                  </div>

                  <div className="text-right -mt-2">
                    <button
                      onClick={() => switchView('forgot')}
                      className="text-[#FF6B9D] font-bold text-sm hover:underline transition-all"
                      style={{ fontFamily: "'Poppins', sans-serif" }}
                    >
                      Forgot password?
                    </button>
                  </div>

                  <StatusBlock />

                  <button
                    onClick={handleLogin}
                    disabled={isLoading}
                    className="w-full neo-btn neo-btn-primary py-3 disabled:opacity-60"
                  >
                    {isLoading ? 'LOGGING IN...' : 'LOGIN'}
                  </button>

                  <div className="text-center">
                    <p className="text-[#1a1a2e] font-semibold" style={{ ...inputStyle, fontSize: '14px' }}>
                      First time here?{' '}
                      <button onClick={() => switchView('signup')} className="text-[#4ECDC4] font-extrabold hover:underline transition-all" style={{ fontFamily: "'Poppins', sans-serif" }}>
                        START 14-DAY SPRINT →
                      </button>
                    </p>
                  </div>
                </div>
              )}

              {view === 'signup' && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-2xl font-extrabold text-[#1a1a2e] mb-1" style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800 }}>
                      {googleUser?.idToken ? 'CONFIRM SIGNUP' : 'SETUP YOUR PROFILE'}
                    </h2>
                    <p className="text-[#1a1a2e] font-semibold" style={{ ...inputStyle, fontSize: '14px', opacity: 0.8 }}>
                      {googleUser?.idToken
                        ? 'Your Google account will be linked to complete signup.'
                        : 'Join 500+ core engineers mastering industry tools.'}
                    </p>
                  </div>

                  {googleUser?.idToken ? (
                    <div className="p-3 bg-[#FFE156] border-2 border-[#1a1a2e] rounded-xl flex items-center gap-3" style={{ boxShadow: '3px 3px 0 #1a1a2e' }}>
                      <div className="w-10 h-10 rounded-lg bg-white border-2 border-[#1a1a2e] flex items-center justify-center">
                        <User className="w-5 h-5 text-[#1a1a2e]" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#1a1a2e]" style={inputStyle}>{googleUser.name}</p>
                        <p className="text-xs font-semibold text-[#1a1a2e]" style={inputStyle}>{googleUser.email}</p>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleGoogleSignIn}
                      disabled={isLoading}
                      className="w-full flex items-center justify-center gap-2 bg-white border-3 border-[#1a1a2e] text-[#1a1a2e] font-bold py-3 rounded-xl hover:translate-y-0.5 active:scale-95 disabled:opacity-60"
                      style={{ fontFamily: "'Poppins', sans-serif", fontSize: '15px', boxShadow: '4px 4px 0 #1a1a2e' }}
                    >
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                      )}
                      Continue with Google
                    </button>
                  )}

                  <div className="flex items-center gap-4 -my-1">
                    <div className="flex-1 border-t-2 border-[#1a1a2e]"></div>
                    <span className="text-xs text-[#1a1a2e] font-bold tracking-wider" style={{ fontFamily: "'Poppins', sans-serif" }}>OR EMAIL</span>
                    <div className="flex-1 border-t-2 border-[#1a1a2e]"></div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm" style={labelStyle}>Full Name</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="John Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={isLoading}
                        className={inputClass}
                        style={inputStyle}
                      />
                      <User className="absolute right-3 top-3.5 w-5 h-5 text-[#1a1a2e] opacity-50 pointer-events-none" />
                    </div>
                    <FieldError name="name" />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm" style={labelStyle}>College Email Address</label>
                    <div className="relative">
                      <input
                        type="email"
                        placeholder="yourname@college.edu"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isLoading}
                        className={inputClass}
                        style={inputStyle}
                      />
                      <Mail className="absolute right-3 top-3.5 w-5 h-5 text-[#1a1a2e] opacity-50 pointer-events-none" />
                    </div>
                    <FieldError name="email" />
                  </div>

                  {!googleUser?.idToken && (
                    <div className="space-y-1">
                      <label className="block text-sm" style={labelStyle}>Password</label>
                      <div className="relative">
                        <input
                          type="password"
                          placeholder="Min 8 chars · 1 uppercase · 1 number"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          disabled={isLoading}
                          className={inputClass}
                          style={inputStyle}
                        />
                        <Lock className="absolute right-3 top-3.5 w-5 h-5 text-[#1a1a2e] opacity-50 pointer-events-none" />
                      </div>
                      <FieldError name="password" />
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="block text-sm" style={labelStyle}>
                      Phone Number <span className="opacity-60 font-semibold">(Optional)</span>
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        placeholder="+91 9876543210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        disabled={isLoading}
                        className={inputClass}
                        style={inputStyle}
                      />
                      <Phone className="absolute right-3 top-3.5 w-5 h-5 text-[#1a1a2e] opacity-50 pointer-events-none" />
                    </div>
                    <FieldError name="phone" />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm" style={labelStyle}>
                      Date of Birth <span className="opacity-60 font-semibold">(Optional)</span>
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        disabled={isLoading}
                        className={inputClass}
                        style={inputStyle}
                        max="2010-01-01"
                      />
                      <Calendar className="absolute right-3 top-3.5 w-5 h-5 text-[#1a1a2e] opacity-50 pointer-events-none" />
                    </div>
                    <FieldError name="dob" />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm" style={labelStyle}>
                      Study Level <span className="opacity-60 font-semibold">(Optional)</span>
                    </label>
                    <div className="relative">
                      <select
                        value={studyLevel}
                        onChange={(e) => setStudyLevel(e.target.value)}
                        disabled={isLoading}
                        className={`${inputClass} appearance-none bg-white`}
                        style={inputStyle}
                      >
                        <option value="">Select your study level</option>
                        {STUDY_LEVEL_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-3.5 w-5 h-5 text-[#1a1a2e] opacity-50 pointer-events-none" />
                    </div>
                    <FieldError name="studyLevel" />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm" style={labelStyle}>
                      Referral Code <span className="opacity-60 font-semibold">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="FRIEND2025"
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value)}
                      disabled={isLoading}
                      className={inputClass}
                      style={inputStyle}
                    />
                    <p className="text-[#1a1a2e] font-semibold opacity-70 text-xs" style={inputStyle}>
                      Have a code? Enter to get ₹50 cashback later.
                    </p>
                    <FieldError name="referralCode" />
                  </div>

                  <StatusBlock />

                  <button
                    onClick={handleSignUp}
                    disabled={isLoading}
                    className="w-full neo-btn neo-btn-primary py-3 disabled:opacity-60"
                  >
                    {isLoading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
                  </button>

                  <div className="text-center">
                    <p className="text-[#1a1a2e] font-semibold" style={{ ...inputStyle, fontSize: '14px' }}>
                      Already have an account?{' '}
                      <button onClick={() => switchView('login')} className="text-[#FF6B9D] font-extrabold hover:underline transition-all" style={{ fontFamily: "'Poppins', sans-serif" }}>
                        LOGIN HERE
                      </button>
                    </p>
                  </div>
                </div>
              )}

              {view === 'forgot' && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-2xl font-extrabold text-[#1a1a2e] mb-1" style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800 }}>
                      RESET PASSWORD
                    </h2>
                    <p className="text-[#1a1a2e] font-semibold" style={{ ...inputStyle, fontSize: '14px', opacity: 0.8 }}>
                      Enter your registered email and we&apos;ll send you a reset link.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm" style={labelStyle}>Registered Email</label>
                    <div className="relative">
                      <input
                        type="email"
                        placeholder="e.g. anujdubey19@gmail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleForgotPassword()}
                        disabled={isLoading}
                        className={inputClass}
                        style={inputStyle}
                      />
                      <Mail className="absolute right-3 top-3.5 w-5 h-5 text-[#1a1a2e] opacity-50 pointer-events-none" />
                    </div>
                    <FieldError name="email" />
                  </div>

                  <StatusBlock />

                  <button
                    onClick={handleForgotPassword}
                    disabled={isLoading || !!successMessage}
                    className="w-full neo-btn neo-btn-pink py-3 disabled:opacity-60"
                  >
                    {isLoading ? 'SENDING...' : 'SEND RESET LINK'}
                  </button>

                  <div className="text-center">
                    <button onClick={() => switchView('login')} className="text-[#1a1a2e] font-extrabold hover:underline transition-all text-sm" style={{ fontFamily: "'Poppins', sans-serif" }}>
                      ← Back to Login
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </>
  );
}
