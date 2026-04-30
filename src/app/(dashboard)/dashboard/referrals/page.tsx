'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users, Wallet, Gift, Copy, Check, Loader2, AlertCircle, ArrowLeft,
  TrendingUp, Share2, MessageCircle, Lock, BookOpen, Clock,
} from 'lucide-react';
import { getReferralStats, getReferrals, getReferralCode, ReferralStats, Referral, fetchApi } from '@/lib/api';

const poppins: React.CSSProperties = { fontFamily: "'Poppins', sans-serif" };
const outfit: React.CSSProperties = { fontFamily: "'Outfit', sans-serif" };

function getDaysUntilApproval(autoApproveAt: string): number {
  const now = new Date();
  const approvalDate = new Date(autoApproveAt);
  const diffTime = approvalDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays);
}

export default function ReferralsPage() {
  const [code, setCode] = useState<string | null>(null);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [shareMessage, setShareMessage] = useState('');
  const [isEligible, setIsEligible] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const codeRes = await getReferralCode();
        if (codeRes.error?.code === 'AUTH_SESSION_EXPIRED' || codeRes.error?.code === 'AUTH_INVALID_CREDENTIALS') {
          setError('Please log in to view your referrals.');
          setLoading(false);
          return;
        }
        if (!codeRes.success && codeRes.error) {
          setError(codeRes.error.message || 'Failed to load referral data');
          setLoading(false);
          return;
        }
        const refCode = codeRes.data?.code;
        const hasEnrollment = codeRes.data?.isActive === true && refCode;
        if (hasEnrollment && refCode) {
          setIsEligible(true);
          setCode(refCode);
          const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
          const url = `${baseUrl}?ref=${refCode}`;
          setShareUrl(url);
          setShareMessage(`🎓 I'm learning industry skills at Sprintern! Use my referral code ${refCode} and get ₹50 off.\n\nEnroll here: ${url}`);
          const [statsRes, listRes] = await Promise.all([getReferralStats(), getReferrals(1, 20)]);
          if (statsRes.success && statsRes.data) setStats(statsRes.data.stats);
          if (listRes.success && listRes.data) setReferrals(listRes.data.referrals ?? []);
        } else {
          setIsEligible(false);
          setCode(null);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load referral data');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-6">
        <div className="max-w-5xl mx-auto animate-pulse">
          <div className="h-4 w-24 bg-neo-peach/50 rounded mb-6 border-2 border-neo-black" />
          <div className="h-9 w-56 bg-neo-yellow/50 rounded-lg mb-2 border-2 border-neo-black" />
          <div className="h-4 w-72 bg-neo-mint/50 rounded mb-8 border-2 border-neo-black" />
          <div className="h-40 bg-neo-purple/30 rounded-2xl mb-8 border-3 border-neo-black" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 border-3 border-neo-black" style={{boxShadow:'5px 5px 0 #1a1a2e'}}>
                <div className="w-10 h-10 rounded-xl bg-neo-blue/30 border-2 border-neo-black mb-3" />
                <div className="h-7 w-16 bg-neo-yellow/30 rounded mb-2" />
                <div className="h-3 w-24 bg-neo-cream rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24">
        <div className="neo-card-static flex flex-col items-center gap-4 text-center max-w-md p-8">
          <div className="w-14 h-14 rounded-2xl bg-neo-coral border-3 border-neo-black flex items-center justify-center" style={{boxShadow:'3px 3px 0 #1a1a2e'}}>
            <AlertCircle className="w-7 h-7 text-neo-black" />
          </div>
          <p className="text-neo-black/70 font-semibold" style={poppins}>{error}</p>
          <Link href="/" className="neo-btn neo-btn-primary px-6 py-3" style={{ ...poppins, fontWeight: 700 }}>Back to Home</Link>
        </div>
      </div>
    );
  }

  const statCards = [
    { icon: Users, label: 'Total Referred', value: stats?.totalReferred ?? 0, color: 'bg-neo-sky' },
    { icon: Check, label: 'Completed', value: stats?.completedReferrals ?? 0, color: 'bg-neo-green' },
    { icon: TrendingUp, label: 'Total Earned', value: `₹${stats?.totalEarnings ?? 0}`, color: 'bg-neo-pink' },
    { icon: Wallet, label: 'Conversion Rate', value: `${stats && stats.totalReferred > 0 ? Math.round((stats.completedReferrals / stats.totalReferred) * 100) : 0}%`, color: 'bg-neo-orange' },
  ];

  if (!isEligible) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-6">
        <div className="max-w-3xl mx-auto">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-neo-black/60 hover:text-neo-black text-sm mb-6 font-bold" style={poppins}>
            <ArrowLeft className="w-4 h-4" /> My Learning
          </Link>
          <h1 className="text-3xl md:text-4xl font-extrabold text-neo-black mb-2" style={{ ...outfit, fontWeight: 800 }}>Referral Program</h1>
          <p className="text-neo-black/60 mb-10 font-semibold" style={{ ...poppins, fontSize: '15px' }}>
            Earn ₹50 for every friend who enrolls using your referral code!
          </p>
          <div className="neo-card-static overflow-hidden">
            <div className="h-2 bg-neo-yellow" />
            <div className="p-10 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-neo-lavender border-3 border-neo-black flex items-center justify-center mb-5" style={{boxShadow:'3px 3px 0 #1a1a2e'}}>
                <Lock className="w-8 h-8 text-neo-black" />
              </div>
              <h2 className="text-xl font-extrabold text-neo-black mb-2" style={{ ...outfit, fontWeight: 800 }}>
                Enroll in a Course to Unlock
              </h2>
              <p className="text-neo-black/60 text-sm max-w-xs mb-6 font-semibold" style={poppins}>
                Your unique referral code will be generated after your first course purchase.
              </p>
              <div className="grid grid-cols-3 gap-4 w-full max-w-xs mb-8 text-center">
                {[
                  { value: '₹50', label: 'per referral', color: 'bg-neo-pink' },
                  { value: '₹100', label: 'min withdrawal', color: 'bg-neo-blue' },
                  { value: '∞', label: 'no limit', color: 'bg-neo-green' },
                ].map((item, i) => (
                  <div key={i} className={`${item.color} rounded-xl p-3 border-2 border-neo-black`}>
                    <p className="text-2xl font-extrabold text-neo-black" style={{ ...outfit, fontWeight: 800 }}>{item.value}</p>
                    <p className="text-xs text-neo-black/70 font-bold" style={poppins}>{item.label}</p>
                  </div>
                ))}
              </div>
              <Link href="/courses" className="neo-btn neo-btn-primary inline-flex items-center gap-2 px-6 py-3 text-sm" style={{ ...poppins, fontWeight: 700 }}>
                <BookOpen className="w-4 h-4" /> BROWSE COURSES
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-6">
      <div className="max-w-5xl mx-auto">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-neo-black/60 hover:text-neo-black text-sm mb-6 font-bold" style={poppins}>
          <ArrowLeft className="w-4 h-4" /> My Learning
        </Link>
        <h1 className="text-3xl md:text-4xl font-extrabold text-neo-black mb-2" style={{ ...outfit, fontWeight: 800 }}>Referral Program</h1>
        <p className="text-neo-black/60 mb-8 font-semibold" style={{ ...poppins, fontSize: '15px' }}>
          Earn ₹50 for every friend who enrolls using your referral code!
        </p>

        {/* Referral Code Card */}
        <div className="bg-neo-pink rounded-2xl p-6 md:p-8 text-neo-black mb-8 border-3 border-neo-black" style={{boxShadow:'8px 8px 0 #1a1a2e'}}>
          <p className="text-neo-black/60 text-sm mb-2 font-bold" style={poppins}>Your Referral Code</p>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl md:text-4xl tracking-widest bg-white px-4 py-2 rounded-xl border-3 border-neo-black" style={{ ...outfit, fontWeight: 800, boxShadow:'3px 3px 0 #1a1a2e' }}>
                {code}
              </span>
              <button onClick={() => handleCopy(code!)} className="neo-btn bg-neo-yellow p-2">
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => handleCopy(shareUrl)} className="neo-btn bg-white flex items-center gap-2 px-4 py-2.5 text-sm" style={{ ...poppins, fontWeight: 700 }}>
              <Share2 className="w-4 h-4" /> COPY LINK
            </button>
            <a href={`https://wa.me/?text=${encodeURIComponent(shareMessage)}`} target="_blank" rel="noopener noreferrer"
              className="neo-btn neo-btn-green flex items-center gap-2 px-4 py-2.5 text-sm" style={{ ...poppins, fontWeight: 700 }}>
              <MessageCircle className="w-4 h-4" /> SHARE ON WHATSAPP
            </a>
          </div>
          <p className="text-neo-black/40 text-xs mt-3 font-bold" style={poppins}>{shareUrl}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {statCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <div key={i} className="neo-card-static p-5">
                <div className={`w-10 h-10 rounded-xl ${card.color} border-2 border-neo-black flex items-center justify-center mb-3`}>
                  <Icon className="w-5 h-5 text-neo-black" />
                </div>
                <p className="text-2xl font-extrabold text-neo-black" style={{ ...outfit, fontWeight: 800 }}>{card.value}</p>
                <p className="text-xs text-neo-black/50 mt-0.5 font-bold" style={poppins}>{card.label}</p>
              </div>
            );
          })}
        </div>

        {/* How it works */}
        <div className="bg-neo-mint rounded-2xl p-6 mb-8 border-3 border-neo-black" style={{boxShadow:'5px 5px 0 #1a1a2e'}}>
          <h3 className="text-sm font-extrabold text-neo-black mb-3" style={outfit}>How it works</h3>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { step: '1', text: 'Share your unique referral code with friends' },
              { step: '2', text: 'Friend enrolls using your code and pays' },
              { step: '3', text: 'You earn ₹50 automatically in your wallet' },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-neo-yellow text-neo-black text-xs font-extrabold flex items-center justify-center shrink-0 mt-0.5 border-2 border-neo-black" style={poppins}>
                  {item.step}
                </div>
                <p className="text-sm text-neo-black/80 font-semibold" style={poppins}>{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Referral History */}
        <h2 className="text-lg font-extrabold text-neo-black mb-4" style={{ ...outfit, fontWeight: 800 }}>Referral History</h2>
        {(!referrals || referrals.length === 0) ? (
          <div className="neo-card-static p-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-neo-peach border-2 border-neo-black flex items-center justify-center mx-auto mb-3">
              <Gift className="w-7 h-7 text-neo-black" />
            </div>
            <p className="text-neo-black/40 text-sm font-bold" style={poppins}>No referrals yet. Share your code to get started!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {referrals.map(ref => (
              <div key={ref.id} className="neo-card-static p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-extrabold text-neo-black" style={poppins}>{ref.referredUserEmail}</p>
                  <p className="text-xs text-neo-black/40 font-semibold" style={poppins}>
                    {new Date(ref.createdAt).toLocaleDateString()}
                  </p>
                  {ref.status === 'pending' && ref.autoApproveAt && (
                    <p className="text-xs text-neo-orange mt-1 flex items-center gap-1 font-bold" style={poppins}>
                      <Clock className="w-3 h-3" />
                      ~{getDaysUntilApproval(ref.autoApproveAt)} days to confirm
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <span className={`neo-badge ${ref.status === 'completed' ? 'bg-neo-green' : ref.status === 'pending' ? 'bg-neo-orange' : 'bg-neo-cream'}`} style={{ ...poppins }}>
                    {ref.status}
                  </span>
                  {ref.bonusAmount > 0 && (
                    <p className="text-sm font-extrabold text-neo-black mt-1" style={poppins}>₹{ref.bonusAmount}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
