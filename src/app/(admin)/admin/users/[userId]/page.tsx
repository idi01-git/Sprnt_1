'use client';

import { use, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle, ArrowLeft, Award, BookOpen, Calendar, CheckCircle2, ChevronRight,
  Clock, Copy, FileCheck, Gift, Loader2, LogOut, Mail, Phone, RefreshCw,
  Shield, ShieldOff, User, UserPlus, Wallet,
} from 'lucide-react';
import {
  AdminUserDetail,
  adminManualEnroll,
  adminResetUserPassword,
  adminRevokeUserSessions,
  getAdminCourses,
  getAdminUserCertificates,
  getAdminUserDetail,
  getAdminUserEnrollments,
  getAdminUserReferrals,
  getAdminUserSubmissions,
  getAdminUserTransactions,
  updateAdminUser,
} from '@/lib/api';

const poppins: React.CSSProperties = { fontFamily: "'Poppins', sans-serif" };
const outfit: React.CSSProperties = { fontFamily: "'Outfit', sans-serif" };

const TABS = ['Overview', 'Enrollments', 'Submissions', 'Referrals', 'Transactions', 'Certificates', 'Sessions'] as const;
type Tab = typeof TABS[number];

type UserEditForm = {
  name: string;
  email: string;
  phone: string;
  dob: string;
  studyLevel: string;
  avatarUrl: string;
  upiId: string;
  referralCode: string;
  emailVerified: boolean;
  status: 'active' | 'suspended';
};

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    suspended: 'bg-red-100 text-red-700',
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    under_review: 'bg-blue-100 text-blue-700',
    resubmitted: 'bg-purple-100 text-purple-700',
    revoked: 'bg-red-100 text-red-700',
    completed: 'bg-green-100 text-green-700',
    in_progress: 'bg-blue-100 text-blue-700',
  };
  return map[status] || 'bg-gray-100 text-gray-700';
};

const fmt = (value?: string | null) => value ? new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';
const fmtAmount = (value?: number) => value != null ? `Rs ${value.toFixed(2)}` : '-';

function buildFormState(user: AdminUserDetail): UserEditForm {
  return {
    name: user.name,
    email: user.email,
    phone: user.phone || '',
    dob: user.dob ? user.dob.slice(0, 10) : '',
    studyLevel: user.studyLevel || '',
    avatarUrl: user.avatarUrl || '',
    upiId: user.upiId || '',
    referralCode: user.referralCode || '',
    emailVerified: user.emailVerified,
    status: user.status,
  };
}

export default function AdminUserDetailPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params);
  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [form, setForm] = useState<UserEditForm | null>(null);
  const [tab, setTab] = useState<Tab>('Overview');
  const [loading, setLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);
  const [tabData, setTabData] = useState<any[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [courses, setCourses] = useState<{ id: string; courseName: string }[]>([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [copiedPw, setCopiedPw] = useState<string | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    void fetchUser();
  }, [userId]);

  useEffect(() => {
    void fetchTabData(tab);
  }, [tab, userId, user]);

  async function fetchUser() {
    setLoading(true);
    const response = await getAdminUserDetail(userId);
    if (response.success && response.data) {
      setUser(response.data.user);
      setForm(buildFormState(response.data.user));
      setIsEditing(false);
    }
    setLoading(false);
  }

  async function fetchTabData(nextTab: Tab) {
    if (nextTab === 'Overview') return;
    if (nextTab === 'Sessions') {
      setTabData(Array.isArray(user?.sessions) ? user.sessions : []);
      return;
    }

    setTabLoading(true);
    try {
      if (nextTab === 'Enrollments') {
        const response = await getAdminUserEnrollments(userId);
        setTabData(response.success && response.data ? (response.data.enrollments || []) : []);
      } else if (nextTab === 'Submissions') {
        const response = await getAdminUserSubmissions(userId);
        setTabData(response.success && response.data ? (response.data.submissions || []) : []);
      } else if (nextTab === 'Referrals') {
        const response = await getAdminUserReferrals(userId);
        setTabData(response.success && response.data ? (response.data.referrals || []) : []);
      } else if (nextTab === 'Transactions') {
        const response = await getAdminUserTransactions(userId);
        setTabData(response.success && response.data ? (response.data.transactions || []) : []);
      } else if (nextTab === 'Certificates') {
        const response = await getAdminUserCertificates(userId);
        const data = response.success ? response.data : null;
        setTabData(Array.isArray(data) ? data : Array.isArray(data?.certificates) ? data.certificates : []);
      }
    } finally {
      setTabLoading(false);
    }
  }

  async function handleSave() {
    if (!form) return;
    setActionLoading('save');
    const response = await updateAdminUser(userId, {
      name: form.name,
      email: form.email,
      phone: form.phone || null,
      dob: form.dob || null,
      studyLevel: form.studyLevel || null,
      avatarUrl: form.avatarUrl || null,
      upiId: form.upiId || null,
      referralCode: form.referralCode || null,
      emailVerified: form.emailVerified,
      status: form.status,
    });

    if (response.success) {
      showToast('User details updated');
      setIsEditing(false);
      await fetchUser();
    } else {
      showToast(response.error?.message || 'Failed to update user', false);
    }
    setActionLoading(null);
  }

  function handleStartEditing() {
    if (!user) return;
    setForm(buildFormState(user));
    setIsEditing(true);
  }

  function handleCancelEditing() {
    if (!user) return;
    setForm(buildFormState(user));
    setIsEditing(false);
  }

  async function handleResetPassword() {
    setActionLoading('pw');
    const response = await adminResetUserPassword(userId);
    if (response.success) {
      const password = response.data?.temporaryPassword;
      if (password) {
        setCopiedPw(password);
        navigator.clipboard.writeText(password).catch(() => {});
      }
      showToast('Temporary password copied');
    } else {
      showToast('Reset failed', false);
    }
    setActionLoading(null);
  }

  async function handleRevokeSessions() {
    setActionLoading('sessions');
    const response = await adminRevokeUserSessions(userId);
    if (response.success) {
      showToast('All sessions revoked');
      await fetchUser();
      if (tab === 'Sessions') {
        setTabData([]);
      }
    } else {
      showToast('Failed to revoke sessions', false);
    }
    setActionLoading(null);
  }

  async function handleManualEnroll() {
    if (!selectedCourse) return;
    setActionLoading('enroll');
    const response = await adminManualEnroll(userId, selectedCourse);
    if (response.success) {
      showToast('User enrolled successfully');
      setSelectedCourse('');
      setShowEnrollModal(false);
      if (tab === 'Enrollments') {
        await fetchTabData('Enrollments');
      }
    } else {
      showToast('Enrollment failed', false);
    }
    setActionLoading(null);
  }

  async function openEnrollModal() {
    setShowEnrollModal(true);
    const response = await getAdminCourses({ status: 'active', limit: 50 });
    if (response.success && response.data) {
      setCourses(response.data.courses.map((course) => ({ id: course.id, courseName: course.courseName })));
    }
  }

  const statsCards = useMemo(() => {
    if (!user) return [];
    return [
      { label: 'Wallet Balance', value: fmtAmount(user.walletBalance) },
      { label: 'Enrollments', value: String(user.counts.enrollments) },
      { label: 'Submissions', value: String(user.counts.submissions) },
      { label: 'Certificates', value: String(user.counts.certificates) },
      { label: 'Referral Earnings', value: fmtAmount(user.referralStats.totalEarned) },
      { label: 'Active Sessions', value: String(user.counts.sessions) },
    ];
  }, [user]);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="mb-8 h-5 w-32 rounded bg-gray-200" />
        <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
          <div className="flex items-center gap-6">
            <div className="h-20 w-20 rounded-full bg-gray-200" />
            <div className="space-y-2">
              <div className="h-6 w-48 rounded bg-gray-200" />
              <div className="h-4 w-64 rounded bg-gray-100" />
              <div className="h-4 w-32 rounded bg-gray-100" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user || !form) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <AlertCircle className="h-12 w-12 text-red-400" />
        <p className="text-gray-500" style={poppins}>User not found</p>
        <Link href="/admin/users" className="text-sm text-purple-600 hover:underline" style={poppins}>Back to Users</Link>
      </div>
    );
  }

  return (
    <div>
      {toast && (
        <div className={`fixed right-4 top-4 z-50 flex items-center gap-2 rounded-xl px-5 py-3 text-sm text-white shadow-lg ${toast.ok ? 'bg-green-600' : 'bg-red-600'}`} style={poppins}>
          {toast.ok ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {toast.msg}
        </div>
      )}

      {showEnrollModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="mb-4 text-lg font-bold text-gray-900" style={{ ...outfit, fontWeight: 800 }}>Manual Enrollment</h2>
            <select
              value={selectedCourse}
              onChange={(event) => setSelectedCourse(event.target.value)}
              className="mb-4 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-purple-500"
              style={poppins}
            >
              <option value="">Select a course…</option>
              {courses.map((course) => <option key={course.id} value={course.id}>{course.courseName}</option>)}
            </select>
            <div className="flex gap-3">
              <button onClick={() => setShowEnrollModal(false)} className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm text-gray-600 hover:bg-gray-50" style={poppins}>Cancel</button>
              <button
                onClick={handleManualEnroll}
                disabled={!selectedCourse || actionLoading === 'enroll'}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-linear-to-r from-purple-600 to-blue-600 py-2.5 text-sm text-white disabled:opacity-60"
                style={{ ...poppins, fontWeight: 600 }}
              >
                {actionLoading === 'enroll' ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Enroll
              </button>
            </div>
          </div>
        </div>
      )}

      <Link href="/admin/users" className="mb-6 inline-flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-purple-600" style={poppins}>
        <ArrowLeft className="h-4 w-4" /> Back to Users
      </Link>

      <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-linear-to-br from-purple-600 to-blue-600 text-3xl font-bold text-white" style={{ ...outfit, fontWeight: 800 }}>
            {user.name.charAt(0).toUpperCase()}
          </div>

          <div className="flex-1">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900" style={{ ...outfit, fontWeight: 800 }}>{user.name}</h1>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadge(user.status)}`} style={poppins}>{user.status}</span>
              {user.emailVerified ? (
                <span className="flex items-center gap-1 text-xs text-green-600" style={poppins}><Shield className="h-3.5 w-3.5" /> Verified</span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-gray-400" style={poppins}><ShieldOff className="h-3.5 w-3.5" /> Unverified</span>
              )}
            </div>

            <div className="mb-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500" style={poppins}>
              <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />{user.email}</span>
              {user.phone && <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{user.phone}</span>}
              {user.dob && <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />{fmt(user.dob)}</span>}
              <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5" />{user.studyLevel?.replace(/_/g, ' ') || 'No study level'}</span>
              <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />Joined {fmt(user.createdAt)}</span>
            </div>

            {copiedPw && (
              <div className="mb-4 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                <p className="text-sm text-amber-800" style={poppins}>Temp password: <strong className="font-mono">{copiedPw}</strong></p>
                <button onClick={() => { navigator.clipboard.writeText(copiedPw); }} className="rounded p-1 hover:bg-amber-200">
                  <Copy className="h-3.5 w-3.5 text-amber-700" />
                </button>
                <button onClick={() => setCopiedPw(null)} className="ml-auto text-xs text-amber-600 hover:text-amber-800" style={poppins}>Dismiss</button>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <button
                onClick={isEditing ? handleSave : handleStartEditing}
                disabled={actionLoading === 'save'}
                className="rounded-xl bg-linear-to-r from-purple-600 to-blue-600 px-4 py-2 text-sm text-white transition-all hover:shadow-md disabled:opacity-60"
                style={{ ...poppins, fontWeight: 600 }}
              >
                {actionLoading === 'save' ? 'Saving…' : isEditing ? 'Save Changes' : 'Edit User'}
              </button>
              {isEditing && (
                <button
                  onClick={handleCancelEditing}
                  className="rounded-xl bg-white px-4 py-2 text-sm text-gray-700 ring-1 ring-gray-200 transition-all hover:bg-gray-50"
                  style={{ ...poppins, fontWeight: 600 }}
                >
                  Cancel
                </button>
              )}
              <button
                onClick={handleResetPassword}
                disabled={actionLoading === 'pw'}
                className="flex items-center gap-1.5 rounded-xl bg-amber-100 px-4 py-2 text-sm text-amber-700 transition-all hover:bg-amber-200 disabled:opacity-60"
                style={{ ...poppins, fontWeight: 600 }}
              >
                {actionLoading === 'pw' ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Reset Password
              </button>
              <button
                onClick={handleRevokeSessions}
                disabled={actionLoading === 'sessions'}
                className="flex items-center gap-1.5 rounded-xl bg-gray-100 px-4 py-2 text-sm text-gray-700 transition-all hover:bg-gray-200 disabled:opacity-60"
                style={{ ...poppins, fontWeight: 600 }}
              >
                {actionLoading === 'sessions' ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
                Revoke Sessions
              </button>
              <button
                onClick={openEnrollModal}
                className="flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-sm text-purple-700 ring-1 ring-purple-200 transition-all hover:bg-purple-50"
                style={{ ...poppins, fontWeight: 600 }}
              >
                <UserPlus className="h-4 w-4" /> Manual Enroll
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {statsCards.map((card) => (
          <div key={card.label} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-gray-400" style={poppins}>{card.label}</p>
            <p className="mt-2 text-2xl font-bold text-gray-900" style={{ ...outfit, fontWeight: 800 }}>{card.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="flex overflow-x-auto border-b border-gray-100">
          {TABS.map((nextTab) => {
            const icons: Record<Tab, React.ElementType> = {
              Overview: User,
              Enrollments: BookOpen,
              Submissions: FileCheck,
              Referrals: Gift,
              Transactions: Wallet,
              Certificates: Award,
              Sessions: LogOut,
            };
            const Icon = icons[nextTab];
            return (
              <button
                key={nextTab}
                onClick={() => setTab(nextTab)}
                className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-5 py-4 text-sm transition-all ${tab === nextTab ? 'border-purple-600 bg-purple-50/50 text-purple-700' : 'border-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-700'}`}
                style={{ ...poppins, fontWeight: tab === nextTab ? 600 : 400 }}
              >
                <Icon className="h-4 w-4" />
                {nextTab}
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {tab === 'Overview' && (
            <div className="grid gap-5 lg:grid-cols-2">
              <div className="space-y-4 rounded-2xl bg-gray-50 p-5">
                <h2 className="text-lg font-bold text-gray-900" style={{ ...outfit, fontWeight: 700 }}>Profile Details</h2>
                <FormField label="Full Name">
                  <input disabled={!isEditing} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100 disabled:text-gray-500" style={poppins} />
                </FormField>
                <FormField label="Email">
                  <input disabled={!isEditing} value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100 disabled:text-gray-500" style={poppins} />
                </FormField>
                <FormField label="Phone">
                  <input disabled={!isEditing} value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100 disabled:text-gray-500" style={poppins} />
                </FormField>
                <FormField label="Date of Birth">
                  <input disabled={!isEditing} type="date" value={form.dob} onChange={(event) => setForm({ ...form, dob: event.target.value })} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100 disabled:text-gray-500" style={poppins} />
                </FormField>
                <FormField label="Study Level">
                  <input disabled={!isEditing} value={form.studyLevel} onChange={(event) => setForm({ ...form, studyLevel: event.target.value })} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100 disabled:text-gray-500" style={poppins} />
                </FormField>
              </div>

              <div className="space-y-4 rounded-2xl bg-gray-50 p-5">
                <h2 className="text-lg font-bold text-gray-900" style={{ ...outfit, fontWeight: 700 }}>Account Controls</h2>
                <FormField label="Avatar URL">
                  <input disabled={!isEditing} value={form.avatarUrl} onChange={(event) => setForm({ ...form, avatarUrl: event.target.value })} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100 disabled:text-gray-500" style={poppins} />
                </FormField>
                <FormField label="UPI ID">
                  <input disabled={!isEditing} value={form.upiId} onChange={(event) => setForm({ ...form, upiId: event.target.value })} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100 disabled:text-gray-500" style={poppins} />
                </FormField>
                <FormField label="Referral Code">
                  <input disabled={!isEditing} value={form.referralCode} onChange={(event) => setForm({ ...form, referralCode: event.target.value.toUpperCase() })} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm uppercase text-gray-900 outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100 disabled:text-gray-500" style={poppins} />
                </FormField>
                <FormField label="Status">
                  <select disabled={!isEditing} value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as 'active' | 'suspended' })} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100 disabled:text-gray-500" style={poppins}>
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </FormField>
                <label className={`flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 text-sm ${isEditing ? 'bg-white text-gray-700' : 'bg-gray-100 text-gray-500'}`} style={poppins}>
                  <input disabled={!isEditing} type="checkbox" checked={form.emailVerified} onChange={(event) => setForm({ ...form, emailVerified: event.target.checked })} />
                  Email Verified
                </label>
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-400" style={poppins}>Read Only</p>
                  <div className="mt-3 space-y-2 text-sm text-gray-600" style={poppins}>
                    <p>User ID: <span className="font-mono text-gray-800">{user.id}</span></p>
                    <p>Referred By: {user.referredBy || 'Not available'}</p>
                    <p>Created: {fmt(user.createdAt)}</p>
                    <p>Updated: {fmt(user.updatedAt)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab !== 'Overview' && (
            tabLoading ? (
              <div className="space-y-3 animate-pulse">
                {[...Array(4)].map((_, index) => <div key={index} className="h-14 rounded-xl bg-gray-100" />)}
              </div>
            ) : tabData.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-gray-400" style={poppins}>No {tab.toLowerCase()} found for this user.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                {tab === 'Enrollments' && (
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-gray-100">{['Course', 'Progress', 'Status', 'Enrolled'].map((heading) => <th key={heading} className="px-4 py-3 text-left font-semibold text-gray-500" style={poppins}>{heading}</th>)}</tr></thead>
                    <tbody>
                      {tabData.map((enrollment: any, index) => (
                        <tr key={index} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="px-4 py-3 font-semibold text-gray-900" style={poppins}>{enrollment.courseName}</td>
                          <td className="px-4 py-3 text-gray-600" style={poppins}>Day {enrollment.currentDay} / {enrollment.totalDays || 7}</td>
                          <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusBadge(enrollment.status)}`} style={poppins}>{enrollment.status?.replace(/_/g, ' ')}</span></td>
                          <td className="px-4 py-3 text-gray-500" style={poppins}>{fmt(enrollment.enrolledAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {tab === 'Submissions' && (
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-gray-100">{['Course', 'Status', 'Grade', 'Submitted', 'Action'].map((heading) => <th key={heading} className="px-4 py-3 text-left font-semibold text-gray-500" style={poppins}>{heading}</th>)}</tr></thead>
                    <tbody>
                      {tabData.map((submission: any, index) => (
                        <tr key={index} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="px-4 py-3 font-semibold text-gray-900" style={poppins}>{submission.enrollment?.course?.courseName || submission.courseName}</td>
                          <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusBadge(submission.reviewStatus || submission.status)}`} style={poppins}>{(submission.reviewStatus || submission.status || '').replace(/_/g, ' ')}</span></td>
                          <td className="px-4 py-3 text-gray-600" style={poppins}>{submission.gradeCategory || '-'}</td>
                          <td className="px-4 py-3 text-gray-500" style={poppins}>{fmt(submission.submittedAt)}</td>
                          <td className="px-4 py-3">
                            <Link href={`/admin/submissions/${submission.id}`} className="flex items-center gap-1 text-xs text-purple-600 hover:underline" style={poppins}>View <ChevronRight className="h-3 w-3" /></Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {tab === 'Referrals' && (
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-gray-100">{['Referred User', 'Email', 'Bonus', 'Status', 'Date'].map((heading) => <th key={heading} className="px-4 py-3 text-left font-semibold text-gray-500" style={poppins}>{heading}</th>)}</tr></thead>
                    <tbody>
                      {tabData.map((referral: any, index) => (
                        <tr key={index} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="px-4 py-3 font-semibold text-gray-900" style={poppins}>{referral.referee?.name || '-'}</td>
                          <td className="px-4 py-3 text-gray-500" style={poppins}>{referral.referee?.email || '-'}</td>
                          <td className="px-4 py-3 font-bold text-green-600" style={poppins}>{fmtAmount(Number(referral.amount || 0))}</td>
                          <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusBadge(referral.status)}`} style={poppins}>{referral.status}</span></td>
                          <td className="px-4 py-3 text-gray-500" style={poppins}>{fmt(referral.registeredAt || referral.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {tab === 'Transactions' && (
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-gray-100">{['Type', 'Description', 'Amount', 'Status', 'Date'].map((heading) => <th key={heading} className="px-4 py-3 text-left font-semibold text-gray-500" style={poppins}>{heading}</th>)}</tr></thead>
                    <tbody>
                      {tabData.map((transaction: any, index) => (
                        <tr key={index} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="px-4 py-3 capitalize text-gray-600" style={poppins}>{(transaction.transactionType || transaction.type || '').replace(/_/g, ' ')}</td>
                          <td className="max-w-xs truncate px-4 py-3 text-gray-600" style={poppins}>{transaction.description || '-'}</td>
                          <td className={`px-4 py-3 font-bold ${Number(transaction.amount) >= 0 ? 'text-green-600' : 'text-red-600'}`} style={poppins}>{fmtAmount(Number(transaction.amount))}</td>
                          <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusBadge(transaction.status)}`} style={poppins}>{transaction.status}</span></td>
                          <td className="px-4 py-3 text-gray-500" style={poppins}>{fmt(transaction.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {tab === 'Certificates' && (
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-gray-100">{['Certificate ID', 'Course', 'Status', 'Issued', 'Action'].map((heading) => <th key={heading} className="px-4 py-3 text-left font-semibold text-gray-500" style={poppins}>{heading}</th>)}</tr></thead>
                    <tbody>
                      {tabData.map((certificate: any, index) => (
                        <tr key={index} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="px-4 py-3 font-mono text-purple-700" style={poppins}>{certificate.certificateId}</td>
                          <td className="px-4 py-3 font-semibold text-gray-900" style={poppins}>{certificate.courseName}</td>
                          <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusBadge(certificate.isRevoked ? 'revoked' : 'active')}`} style={poppins}>{certificate.isRevoked ? 'revoked' : 'valid'}</span></td>
                          <td className="px-4 py-3 text-gray-500" style={poppins}>{fmt(certificate.issuedAt)}</td>
                          <td className="px-4 py-3">
                            <Link href={`/admin/certificates/${certificate.certificateId}`} className="flex items-center gap-1 text-xs text-purple-600 hover:underline" style={poppins}>View <ChevronRight className="h-3 w-3" /></Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {tab === 'Sessions' && (
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-gray-100">{['Session ID', 'Expires At', 'Status'].map((heading) => <th key={heading} className="px-4 py-3 text-left font-semibold text-gray-500" style={poppins}>{heading}</th>)}</tr></thead>
                    <tbody>
                      {tabData.map((session: any, index) => (
                        <tr key={index} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="px-4 py-3 font-mono text-xs text-gray-700" style={poppins}>{session.id}</td>
                          <td className="px-4 py-3 text-gray-500" style={poppins}>{fmt(session.expiresAt)}</td>
                          <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusBadge(session.isExpired ? 'suspended' : 'active')}`} style={poppins}>{session.isExpired ? 'expired' : 'active'}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-gray-700" style={poppins}>{label}</label>
      {children}
    </div>
  );
}
