'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Wallet as WalletIcon,
  ArrowUpRight,
  Loader2,
  ArrowLeft,
  CreditCard,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { getWalletBalance, getTransactions, requestWithdrawal, getUserWithdrawals, WalletBalance, Transaction, UserWithdrawal } from '@/lib/api';

const poppins: React.CSSProperties = { fontFamily: "'Poppins', sans-serif" };
const outfit: React.CSSProperties = { fontFamily: "'Outfit', sans-serif" };

const txTypeLabels: Record<string, string> = {
  referral_bonus: 'Referral Bonus',
  withdrawal: 'Withdrawal',
  earning: 'Earning',
};

export default function WalletPage() {
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<UserWithdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showWithdrawals, setShowWithdrawals] = useState(false);

  const [upiId, setUpiId] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawMsg, setWithdrawMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchWallet = async () => {
      setLoading(true);
      try {
        const [walletRes, txRes, withdrawRes] = await Promise.all([
          getWalletBalance(),
          getTransactions(1, 20),
          getUserWithdrawals(),
        ]);

        if (walletRes.error?.code === 'AUTH_SESSION_EXPIRED' || walletRes.error?.code === 'AUTH_INVALID_CREDENTIALS') {
          setError('Please log in to view your wallet.');
          setLoading(false);
          return;
        }

        if (!walletRes.success) {
          setError(walletRes.error?.message || 'Failed to load wallet');
          setLoading(false);
          return;
        }

        if (walletRes.success && walletRes.data) {
          setBalance(walletRes.data.wallet);
        }

        if (txRes.success && txRes.data) {
          setTransactions(Array.isArray(txRes.data.transactions) ? txRes.data.transactions : []);
        }

        if (withdrawRes.success && withdrawRes.data) {
          setWithdrawals(Array.isArray(withdrawRes.data.withdrawals) ? withdrawRes.data.withdrawals : []);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load wallet');
      } finally {
        setLoading(false);
      }
    };
    fetchWallet();
  }, []);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawing(true);
    setWithdrawMsg(null);

    try {
      const response = await requestWithdrawal({
        amount: parseFloat(withdrawAmount),
        upiId,
      });

      if (!response.success) {
        throw new Error(response.error?.message || 'Withdrawal failed');
      }

      setWithdrawMsg('Withdrawal request submitted! You\'ll receive the amount within 48 hours.');
      setUpiId('');
      setWithdrawAmount('');

      const walletRes = await getWalletBalance();
      if (walletRes.success && walletRes.data) {
        setBalance(walletRes.data.wallet);
      }
    } catch (err: any) {
      setWithdrawMsg(`Error: ${err.message}`);
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-6">
        <div className="max-w-4xl mx-auto animate-pulse">
          <div className="h-4 w-24 bg-neo-peach/50 border-2 border-neo-black rounded mb-6" />
          <div className="h-9 w-36 bg-neo-yellow/50 border-2 border-neo-black rounded-lg mb-8" />
          <div className="bg-neo-purple/30 rounded-2xl h-36 mb-8 border-3 border-neo-black" />
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl p-6 border-3 border-neo-black" style={{boxShadow:'5px 5px 0 #1a1a2e'}}>
              <div className="h-5 w-32 bg-neo-blue/30 rounded mb-4" />
              {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-2 mb-4">
                  <div className="h-3.5 w-20 bg-neo-cream rounded" />
                  <div className="h-11 bg-neo-cream rounded-xl border-2 border-neo-black" />
                </div>
              ))}
            </div>
            <div className="space-y-4">
              <div className="bg-neo-mint/30 rounded-2xl h-40 border-3 border-neo-black" />
            </div>
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
          <Link href="/" className="neo-btn neo-btn-primary px-6 py-3" style={{ ...poppins, fontWeight: 700 }}>Back</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-6">
      <div className="max-w-4xl mx-auto">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-neo-black/60 hover:text-neo-black text-sm mb-6 font-bold" style={{ ...poppins }}>
          <ArrowLeft className="w-4 h-4" /> My Learning
        </Link>

        <h1 className="text-3xl md:text-4xl font-extrabold text-neo-black mb-8" style={{ ...outfit, fontWeight: 800 }}>
          My Wallet
        </h1>

        {/* Balance Card */}
        <div className="bg-neo-purple rounded-2xl p-8 text-neo-black mb-8 border-3 border-neo-black" style={{boxShadow:'8px 8px 0 #1a1a2e'}}>
          <p className="text-neo-black/60 text-sm font-bold mb-1" style={poppins}>Available Balance</p>
          <p className="text-4xl md:text-5xl font-extrabold" style={{ ...outfit, fontWeight: 800 }}>₹{(balance?.totalBalance ?? 0).toFixed(2)}</p>
          <div className="flex gap-6 mt-4">
            <div className="bg-white/40 rounded-xl px-4 py-2 border-2 border-neo-black">
              <p className="text-neo-black/50 text-xs font-bold" style={poppins}>Available</p>
              <p className="text-neo-black font-extrabold" style={poppins}>₹{(balance?.availableBalance ?? 0).toFixed(2)}</p>
            </div>
            <div className="bg-white/40 rounded-xl px-4 py-2 border-2 border-neo-black">
              <p className="text-neo-black/50 text-xs font-bold" style={poppins}>Locked (Pending)</p>
              <p className="text-neo-black font-extrabold" style={poppins}>₹{(balance?.lockedAmount ?? 0).toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Pending Withdrawal Status Banner */}
        {balance?.hasPendingWithdrawal && balance.pendingWithdrawal && (
          <div className="mb-8 bg-neo-orange rounded-2xl p-5 flex items-start gap-4 border-3 border-neo-black" style={{boxShadow:'5px 5px 0 #1a1a2e'}}>
            <div className="w-10 h-10 rounded-xl bg-white border-2 border-neo-black flex items-center justify-center shrink-0 mt-0.5">
              <CreditCard className="w-5 h-5 text-neo-black" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-extrabold text-neo-black mb-0.5" style={{ ...poppins }}>
                Withdrawal Request Pending
              </p>
                <p className="text-sm text-neo-black/80 font-semibold" style={poppins}>
                  ₹{Number(balance.pendingWithdrawal?.amount ?? 0).toFixed(2)} — requested on{' '}
                  {balance.pendingWithdrawal?.requestedAt
                    ? new Date(balance.pendingWithdrawal.requestedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
                    : 'N/A'}
                </p>
              <p className="text-xs text-neo-black/60 mt-1 font-bold" style={poppins}>
                Processing time: 24–48 hours.
              </p>
            </div>
            <span className="neo-badge bg-neo-yellow shrink-0" style={poppins}>
              Processing
            </span>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          {/* Withdraw Form */}
          <div className="neo-card-static p-6">
            <h2 className="text-lg font-extrabold text-neo-black mb-6 flex items-center gap-2" style={{ ...outfit, fontWeight: 800 }}>
              <div className="w-8 h-8 rounded-lg bg-neo-pink border-2 border-neo-black flex items-center justify-center">
                <ArrowUpRight className="w-4 h-4 text-neo-black" />
              </div>
              Withdraw Funds
            </h2>

            {balance?.hasPendingWithdrawal ? (
              <div className="text-center py-8">
                <div className="w-14 h-14 rounded-2xl bg-neo-orange border-2 border-neo-black flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-7 h-7 text-neo-black" />
                </div>
                <p className="text-sm text-neo-black/70 font-semibold" style={poppins}>
                  A withdrawal request is already in progress.
                </p>
              </div>
            ) : (
              <form onSubmit={handleWithdraw} className="space-y-5">
                <div>
                  <label className="block text-sm text-neo-black mb-1.5" style={{ ...poppins, fontWeight: 700 }}>
                    UPI ID
                  </label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={e => setUpiId(e.target.value)}
                    required
                    placeholder="yourname@upi"
                    className="neo-input"
                    style={poppins}
                  />
                </div>

                <div>
                  <label className="block text-sm text-neo-black mb-1.5" style={{ ...poppins, fontWeight: 700 }}>
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={e => setWithdrawAmount(e.target.value)}
                    required
                    min="100"
                    max={balance?.availableBalance ?? undefined}
                    placeholder="Min ₹100"
                    className="neo-input"
                    style={poppins}
                  />
                </div>

                {withdrawMsg && (
                  <div className={`px-4 py-3 rounded-xl text-sm font-bold border-2 border-neo-black ${withdrawMsg.startsWith('Error') ? 'bg-neo-coral' : 'bg-neo-green'}`} style={poppins}>
                    {withdrawMsg}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={withdrawing || (balance?.availableBalance ?? 0) < 100}
                  className="w-full neo-btn neo-btn-blue py-3.5 flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ ...poppins, fontWeight: 700 }}
                >
                  {withdrawing ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
                  ) : (
                    <><CreditCard className="w-4 h-4" /> WITHDRAW TO UPI</>
                  )}
                </button>
              </form>
            )}
          </div>

          <div className="space-y-6">
            {/* How it works */}
            <div className="bg-neo-mint rounded-2xl p-6 border-3 border-neo-black" style={{boxShadow:'5px 5px 0 #1a1a2e'}}>
              <h3 className="text-sm font-extrabold text-neo-black mb-3" style={{ ...outfit }}>
                How it works
              </h3>
              <ul className="space-y-2.5 text-sm text-neo-black/80 font-semibold" style={poppins}>
                {['Earn ₹50 for each successful referral', 'Credits are added automatically when your friend enrolls', 'Minimum withdrawal: ₹100', 'Withdrawals processed within 48 hours'].map((text, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                    {text}
                  </li>
                ))}
              </ul>
            </div>

            <Link
              href="/dashboard/referrals"
              className="neo-card block p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-extrabold text-neo-black" style={poppins}>Earn more credits</p>
                  <p className="text-xs text-neo-black/60 mt-0.5 font-semibold" style={poppins}>Share your referral code with friends</p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-neo-yellow border-2 border-neo-black flex items-center justify-center">
                  <ArrowUpRight className="w-4 h-4 text-neo-black" />
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Activity Section */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-extrabold text-neo-black" style={{ ...outfit, fontWeight: 800 }}>
              Activity
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => setShowWithdrawals(false)}
                className={`neo-tab text-xs ${!showWithdrawals ? 'neo-tab-active bg-neo-yellow' : 'bg-white'}`}
                style={poppins}
              >
                Transactions
              </button>
              <button
                onClick={() => setShowWithdrawals(true)}
                className={`neo-tab text-xs ${showWithdrawals ? 'neo-tab-active bg-neo-blue' : 'bg-white'}`}
                style={poppins}
              >
                Withdrawals ({withdrawals?.length || 0})
              </button>
            </div>
          </div>

          {!showWithdrawals ? (
            <div className="neo-card-static overflow-hidden">
              {!transactions || transactions.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-neo-black/40 font-bold" style={poppins}>No transactions yet</p>
                </div>
              ) : (
                transactions.map((tx, i) => (
                  <div key={tx.id} className={`flex items-center justify-between p-4 ${i > 0 ? 'border-t-2 border-neo-black' : ''}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 border-neo-black ${tx.type === 'withdrawal' ? 'bg-neo-coral' : 'bg-neo-green'}`}>
                        <ArrowUpRight className="w-5 h-5 text-neo-black" />
                      </div>
                      <div>
                        <p className="text-sm font-extrabold text-neo-black" style={poppins}>
                          {txTypeLabels[tx.type] || tx.type}
                        </p>
                        <p className="text-xs text-neo-black/50 font-semibold" style={poppins}>
                          {new Date(tx.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-extrabold ${tx.type === 'withdrawal' ? 'text-neo-coral' : 'text-neo-black'}`} style={poppins}>
                        {tx.type === 'withdrawal' ? '-' : '+'}₹{Number(tx.amount).toFixed(2)}
                      </p>
                      <span className={`neo-badge text-[10px] ${tx.status === 'completed' ? 'bg-neo-green' : tx.status === 'pending' ? 'bg-neo-orange' : 'bg-neo-coral'}`} style={{ ...poppins }}>
                        {tx.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="neo-card-static overflow-hidden">
              {!withdrawals || withdrawals.length === 0 ? (
                <div className="text-center py-10">
                  <div className="w-12 h-12 rounded-2xl bg-neo-cream border-2 border-neo-black flex items-center justify-center mx-auto mb-3">
                    <CreditCard className="w-6 h-6 text-neo-black/30" />
                  </div>
                  <p className="text-neo-black/40 font-bold" style={poppins}>No withdrawal requests yet</p>
                </div>
              ) : (
                <div className="divide-y-2 divide-neo-black">
                  {withdrawals.map((w) => {
                    const statusConfig: Record<string, { bg: string; label: string }> = {
                      pending: { bg: 'bg-neo-orange', label: 'Pending' },
                      processing: { bg: 'bg-neo-sky', label: 'Processing' },
                      completed: { bg: 'bg-neo-green', label: 'Completed' },
                      rejected: { bg: 'bg-neo-coral', label: 'Rejected' },
                    };
                    const st = statusConfig[w.status] || statusConfig.pending;
                    return (
                      <div key={w.id} className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="text-lg font-extrabold text-neo-black" style={{ ...outfit, fontWeight: 800 }}>
                              ₹{Number(w.amount).toFixed(2)}
                            </p>
                            <p className="text-xs text-neo-black/50 font-semibold" style={poppins}>
                              Requested on {new Date(w.requestedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                          </div>
                          <span className={`neo-badge ${st.bg}`} style={poppins}>
                            {st.label}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="bg-neo-cream rounded-lg p-2.5 border-2 border-neo-black">
                            <p className="text-xs text-neo-black/50 mb-0.5 font-bold" style={poppins}>UPI ID</p>
                            <p className="font-mono text-neo-black text-xs font-bold" style={poppins}>{w.upiId || '—'}</p>
                          </div>
                          {w.transactionId && (
                            <div className="bg-neo-cream rounded-lg p-2.5 border-2 border-neo-black">
                              <p className="text-xs text-neo-black/50 mb-0.5 font-bold" style={poppins}>UTR / Transaction ID</p>
                              <p className="font-mono text-neo-black text-xs font-bold" style={poppins}>{w.transactionId}</p>
                            </div>
                          )}
                          {w.processedAt && (
                            <div className="bg-neo-cream rounded-lg p-2.5 border-2 border-neo-black">
                              <p className="text-xs text-neo-black/50 mb-0.5 font-bold" style={poppins}>Processed On</p>
                              <p className="text-neo-black text-xs font-bold" style={poppins}>{new Date(w.processedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                            </div>
                          )}
                        </div>
                        {w.rejectionReason && (
                          <div className="mt-2.5 bg-neo-coral rounded-lg p-2.5 border-2 border-neo-black">
                            <p className="text-xs text-neo-black font-bold" style={poppins}>Rejection Reason: {w.rejectionReason}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
