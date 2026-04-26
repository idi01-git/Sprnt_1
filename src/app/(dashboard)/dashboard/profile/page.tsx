'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  User, Shield, CreditCard, Loader2, Link as LinkIcon,
  CheckCircle2, XCircle, AlertCircle, Save, LogOut, Mail, Phone, Calendar
} from 'lucide-react';
import {
  getUserProfile, updateUserProfile,
  updateUpi, getUserSessions, revokeSession,
  UserProfile, UserSession
} from '@/lib/api';

const poppins: React.CSSProperties = { fontFamily: "'Poppins', sans-serif" };
const outfit: React.CSSProperties = { fontFamily: "'Outfit', sans-serif" };

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

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'payment'>('profile');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Forms
  const [profileForm, setProfileForm] = useState({ name: '', phone: '', dob: '', studyLevel: '' });
  const [upiForm, setUpiForm] = useState({ upiId: '' });
  
  // States
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingUpi, setSavingUpi] = useState(false);
  const [revokingSession, setRevokingSession] = useState<string | null>(null);
  
  // Feedback
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });
  const [upiMsg, setUpiMsg] = useState({ type: '', text: '' });
  
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [profileRes, sessionRes] = await Promise.all([
        getUserProfile(),
        getUserSessions()
      ]);
      
      if (profileRes.success && profileRes.data) {
        const p = profileRes.data.profile;
        setProfile(p);
        setProfileForm({
          name: p.name || '',
          phone: p.phone || '',
          dob: p.dob || '',
          studyLevel: p.studyLevel || ''
        });
        setUpiForm({ upiId: p.upiId || '' });
      }
      
      if (sessionRes.success && sessionRes.data) {
        setSessions(sessionRes.data.sessions);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg({ type: '', text: '' });
    
    try {
      const res = await updateUserProfile(profileForm);
      if (res.success && res.data) {
        setProfile(res.data.profile);
        setProfileMsg({ type: 'success', text: 'Profile updated successfully!' });
      } else {
        setProfileMsg({ type: 'error', text: res.error?.message || 'Failed to update profile' });
      }
    } catch (err: any) {
      setProfileMsg({ type: 'error', text: 'An unexpected error occurred' });
    } finally {
      setSavingProfile(false);
      setTimeout(() => setProfileMsg({ type: '', text: '' }), 5000);
    }
  };

  const handleUpiSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingUpi(true);
    setUpiMsg({ type: '', text: '' });
    
    try {
      const res = await updateUpi(upiForm.upiId);
      if (res.success) {
        setProfile(prev => prev ? { ...prev, upiId: upiForm.upiId } : null);
        setUpiMsg({ type: 'success', text: 'UPI Settings updated successfully!' });
      } else {
        setUpiMsg({ type: 'error', text: res.error?.message || 'Failed to update UPI' });
      }
    } catch (err: any) {
      setUpiMsg({ type: 'error', text: 'An unexpected error occurred' });
    } finally {
      setSavingUpi(false);
      setTimeout(() => setUpiMsg({ type: '', text: '' }), 5000);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to sign out from this device?')) return;
    setRevokingSession(sessionId);
    try {
      const res = await revokeSession(sessionId);
      if (res.success) {
        setSessions(prev => prev.filter(s => s.id !== sessionId));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRevokingSession(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-12 md:pt-24 pb-16 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto animate-pulse">
          <div className="h-9 w-56 bg-neo-yellow/50 rounded-lg mb-2 border-2 border-neo-black" />
          <div className="h-4 w-72 bg-neo-peach/50 rounded mb-8 border-2 border-neo-black" />
          <div className="bg-white rounded-2xl border-3 border-neo-black overflow-hidden" style={{boxShadow:'5px 5px 0 #1a1a2e'}}>
            <div className="flex border-b-3 border-neo-black px-2 pt-2 gap-2">
              {[...Array(3)].map((_, i) => <div key={i} className="h-10 w-32 bg-neo-cream rounded-t-lg border-2 border-neo-black" />)}
            </div>
            <div className="p-6 md:p-8 space-y-6">
              <div className="grid sm:grid-cols-2 gap-5">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-3.5 w-24 bg-neo-mint/50 rounded" />
                    <div className="h-11 bg-neo-cream rounded-xl border-2 border-neo-black" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const inputClass = "neo-input";
  const labelClass = "block text-sm mb-1.5 font-bold text-neo-black";

  const tabItems = [
    { key: 'profile' as const, icon: User, label: 'Personal Info', color: 'bg-neo-yellow' },
    { key: 'security' as const, icon: Shield, label: 'Security', color: 'bg-neo-blue' },
    { key: 'payment' as const, icon: CreditCard, label: 'Payment', color: 'bg-neo-green' },
  ];

  return (
    <div className="min-h-screen pt-12 md:pt-24 pb-16 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-extrabold text-neo-black mb-2" style={{ ...outfit, fontWeight: 800 }}>
          Profile & Settings
        </h1>
        <p className="text-neo-black/60 mb-8 text-sm font-semibold" style={poppins}>
          Manage your personal information, security preferences, and payment details.
        </p>

        <div className="mb-8 rounded-2xl bg-neo-sky p-5 border-3 border-neo-black" style={{boxShadow:'5px 5px 0 #1a1a2e'}}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-neo-black" style={{ ...outfit }}>Certificate Verification</h2>
              <p className="mt-1 text-sm text-neo-black/70 font-semibold" style={poppins}>
                Verify any certificate ID using the public verification page.
              </p>
            </div>
            <Link
              href="/verify"
              className="neo-btn neo-btn-primary inline-flex items-center justify-center px-4 py-2.5 text-sm"
              style={poppins}
            >
              Verify Certificate
            </Link>
          </div>
        </div>

        <div className="neo-card-static overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b-3 border-neo-black overflow-x-auto">
            {tabItems.map((item) => (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-bold transition-colors whitespace-nowrap border-r-2 border-neo-black last:border-r-0 ${
                  activeTab === item.key ? `${item.color} text-neo-black` : 'text-neo-black/50 hover:bg-neo-cream'
                }`}
                style={poppins}
              >
                <item.icon className="w-4 h-4" /> {item.label}
              </button>
            ))}
          </div>

          <div className="p-6 md:p-8">
            {/* 1. PERSONAL INFO TAB */}
            {activeTab === 'profile' && profile && (
              <div className="animate-neo-slide-in">
                <form onSubmit={handleProfileSave} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-5 mb-2">
                    <div>
                      <label className={labelClass} style={poppins}>Full Name</label>
                      <input 
                        type="text" 
                        value={profileForm.name} 
                        onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))}
                        className={inputClass} style={poppins} 
                        required 
                      />
                    </div>
                    
                    <div>
                      <label className={labelClass} style={poppins}>Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neo-black/40" />
                        <input 
                          type="text" 
                          value={profile.email} 
                          readOnly 
                          className="neo-input pl-9 pr-24 bg-neo-cream cursor-not-allowed opacity-70" style={poppins} 
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          {profile.emailVerified ? (
                            <span className="neo-badge bg-neo-green text-[10px]">
                              <CheckCircle2 className="w-3 h-3" /> Verified
                            </span>
                          ) : (
                            <span className="neo-badge bg-neo-orange text-[10px]">
                              <AlertCircle className="w-3 h-3" /> Unverified
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className={labelClass} style={poppins}>Phone Number</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neo-black/40" />
                        <input 
                          type="text" 
                          placeholder="Your contact number"
                          value={profileForm.phone} 
                          onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))}
                          className={`${inputClass} pl-9`} style={poppins} 
                        />
                      </div>
                    </div>

                    <div>
                      <label className={labelClass} style={poppins}>Date of Birth</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neo-black/40" />
                        <input 
                          type="date" 
                          value={profileForm.dob ? profileForm.dob.split('T')[0] : ''} 
                          onChange={e => setProfileForm(p => ({ ...p, dob: e.target.value ? new Date(e.target.value).toISOString() : '' }))}
                          className={`${inputClass} pl-9`} style={poppins} 
                        />
                      </div>
                    </div>

                     <div className="sm:col-span-2">
                       <label className={labelClass} style={poppins}>Current Study Level</label>
                       <select 
                         value={profileForm.studyLevel}
                         onChange={e => setProfileForm(p => ({ ...p, studyLevel: e.target.value }))}
                         className={`${inputClass} appearance-none`} style={poppins}
                       >
                         <option value="">Select your education level...</option>
                         {STUDY_LEVEL_OPTIONS.map(opt => (
                           <option key={opt.value} value={opt.value}>{opt.label}</option>
                         ))}
                       </select>
                     </div>
                  </div>

                  {profileMsg.text && (
                    <div className={`px-4 py-3 rounded-xl text-sm flex items-center gap-2 font-bold border-2 border-neo-black ${profileMsg.type === 'success' ? 'bg-neo-green' : 'bg-neo-coral'}`} style={poppins}>
                      {profileMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                      {profileMsg.text}
                    </div>
                  )}

                  <div className="flex justify-end pt-2">
                    <button 
                      type="submit" 
                      disabled={savingProfile}
                      className="neo-btn neo-btn-primary px-6 py-3 flex items-center justify-center gap-2 disabled:opacity-60"
                      style={poppins}
                    >
                      {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      SAVE CHANGES
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* 2. SECURITY TAB */}
            {activeTab === 'security' && (
              <div className="animate-neo-slide-in space-y-8">
                <div>
                  <h3 className="text-lg font-extrabold text-neo-black mb-1" style={outfit}>Active Sessions</h3>
                  <p className="text-sm text-neo-black/60 mb-5 font-semibold" style={poppins}>
                    These are the devices that have logged into your account.
                  </p>

                  {sessions.length === 0 ? (
                    <div className="neo-card-static p-8 text-center">
                      <p className="text-neo-black/50 text-sm font-bold" style={poppins}>No active sessions found.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {sessions.map(s => (
                        <div key={s.id} className="flex items-center justify-between p-4 rounded-xl border-3 border-neo-black hover:bg-neo-cream transition-colors bg-white" style={{boxShadow:'3px 3px 0 #1a1a2e'}}>
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-neo-lavender flex items-center justify-center border-2 border-neo-black">
                              <Shield className="w-5 h-5 text-neo-black" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-extrabold text-neo-black" style={poppins}>{s.device || 'Unknown Device'}</p>
                                {s.isCurrent && (
                                  <span className="neo-badge bg-neo-green text-[10px]" style={outfit}>This Device</span>
                                )}
                              </div>
                              <p className="text-xs text-neo-black/50 font-semibold" style={poppins}>
                                IP: {s.ip} • Last active: {new Date(s.lastActive).toLocaleDateString()} {new Date(s.lastActive).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                          {!s.isCurrent && (
                            <button
                              onClick={() => handleRevokeSession(s.id)}
                              disabled={revokingSession === s.id}
                              className="neo-btn bg-neo-coral px-3 py-1.5 text-sm flex items-center gap-1.5 disabled:opacity-50"
                              style={{ ...poppins, fontWeight: 700 }}
                            >
                              {revokingSession === s.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
                              Revoke
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 3. PAYMENT TAB */}
            {activeTab === 'payment' && (
              <div className="animate-neo-slide-in">
                <div className="bg-neo-lavender border-3 border-neo-black p-5 rounded-2xl mb-8 flex items-start gap-3" style={{boxShadow:'3px 3px 0 #1a1a2e'}}>
                  <AlertCircle className="w-5 h-5 text-neo-black flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-extrabold text-neo-black mb-1" style={outfit}>Why do we need this?</h4>
                    <p className="text-xs text-neo-black/70 leading-relaxed font-semibold" style={poppins}>
                      Your UPI ID is required so we can transfer your wallet balance directly to your bank account when you request a withdrawal.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleUpiSave} className="space-y-5 max-w-xl">
                  <div>
                    <label className={labelClass} style={poppins}>UPI Virtual Payment Address (VPA)</label>
                    <div className="relative mb-2">
                      <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neo-black/40" />
                      <input 
                        type="text" 
                        placeholder="e.g. yourname@okicici, mobile@paytm"
                        value={upiForm.upiId} 
                        onChange={e => setUpiForm({ upiId: e.target.value })}
                        className={`${inputClass} pl-9`} style={poppins} 
                        required 
                      />
                    </div>
                  </div>

                  {upiMsg.text && (
                    <div className={`px-4 py-3 rounded-xl text-sm flex items-center gap-2 font-bold border-2 border-neo-black ${upiMsg.type === 'success' ? 'bg-neo-green' : 'bg-neo-coral'}`} style={poppins}>
                      {upiMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      {upiMsg.text}
                    </div>
                  )}

                  <div className="flex">
                    <button 
                      type="submit" 
                      disabled={savingUpi}
                      className="neo-btn neo-btn-primary px-6 py-3 flex items-center gap-2 disabled:opacity-60"
                      style={poppins}
                    >
                      {savingUpi ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      SAVE UPI DETAILS
                    </button>
                  </div>
                </form>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
