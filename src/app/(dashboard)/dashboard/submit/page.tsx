'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Upload, FileText, CheckCircle2, Loader2, AlertCircle, ArrowLeft,
  Clock, Award, X, User, GraduationCap, ChevronDown, Link as LinkIcon,
} from 'lucide-react';
import { getSubmissions, Submission } from '@/lib/api';

const poppins: React.CSSProperties = { fontFamily: "'Poppins', sans-serif" };
const outfit: React.CSSProperties = { fontFamily: "'Outfit', sans-serif" };

const statusColors: Record<string, { bg: string; label: string }> = {
  pending: { bg: '#FFB347', label: 'Pending Review' },
  under_review: { bg: '#A8E6FF', label: 'Under Review' },
  approved: { bg: '#95E77E', label: 'Approved' },
  rejected: { bg: '#FF6B6B', label: 'Needs Resubmission' },
  resubmitted: { bg: '#B084FF', label: 'Resubmitted' },
};

const BRANCH_OPTIONS = [
  'Chemical Engineering', 'Civil Engineering', 'Mechanical Engineering',
  'Electrical Engineering', 'Electronics & Communication', 'Computer Science / IT',
  'Other',
];

interface IdentityData {
  fullName: string;
  collegeName: string;
  graduationYear: string;
  branch: string;
  collegeIdLink: string;
}

function isValidUrl(str: string): boolean {
  try { const url = new URL(str); return url.protocol === 'http:' || url.protocol === 'https:'; } catch { return false; }
}

function isDriveLink(str: string): boolean {
  return isValidUrl(str) && (str.includes('drive.google.com') || str.includes('docs.google.com'));
}

function IdentityModal({ onClose, onConfirm, loading }: { onClose: () => void; onConfirm: (data: IdentityData) => void; loading: boolean }) {
  const [form, setForm] = useState<IdentityData>({ fullName: '', collegeName: '', graduationYear: '', branch: '', collegeIdLink: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (key: keyof IdentityData, value: string) => setForm(prev => ({ ...prev, [key]: value }));
  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.fullName.trim()) errs.fullName = 'Full name is required';
    if (!form.collegeName.trim()) errs.collegeName = 'College name is required';
    if (!form.graduationYear) errs.graduationYear = 'Graduation year is required';
    if (!form.branch) errs.branch = 'Branch / stream is required';
    if (!form.collegeIdLink.trim()) errs.collegeIdLink = 'College ID Drive link is required';
    else if (!isDriveLink(form.collegeIdLink)) errs.collegeIdLink = 'Must be a Google Drive or Google Docs link';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (validate()) onConfirm(form); };
  const years = Array.from({ length: 10 }, (_, i) => String(new Date().getFullYear() + 2 - i));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl" style={{ background: '#fff', border: '3px solid #1a1a2e', boxShadow: '8px 8px 0 #1a1a2e' }}>
        <div className="sticky top-0 bg-white px-6 pt-6 pb-4 z-10" style={{ borderBottom: '3px solid #1a1a2e' }}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl" style={{ ...outfit, fontWeight: 800, color: '#1a1a2e' }}>Identity Verification</h2>
              <p className="text-sm mt-0.5" style={{ ...poppins, color: '#666' }}>Required for certificate generation</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#FF6B6B', border: '2px solid #1a1a2e' }}>
              <X className="w-4 h-4" style={{ color: '#1a1a2e' }} />
            </button>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="px-6 pb-6 pt-4 space-y-4">
          {[
            { key: 'fullName' as const, label: 'Full Name', icon: User, placeholder: 'As it should appear on certificate' },
            { key: 'collegeName' as const, label: 'College / School Name', icon: GraduationCap, placeholder: 'Your institution name' },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-sm mb-1.5" style={{ ...poppins, fontWeight: 700, color: '#1a1a2e' }}>{f.label} <span style={{ color: '#FF6B6B' }}>*</span></label>
              <div className="relative">
                <f.icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#999' }} />
                <input type="text" value={form[f.key]} onChange={e => set(f.key, e.target.value)} placeholder={f.placeholder}
                  className="neo-input pl-9" style={{ ...poppins, borderColor: errors[f.key] ? '#FF6B6B' : '#1a1a2e' }} />
              </div>
              {errors[f.key] && <p className="text-xs mt-1" style={{ ...poppins, color: '#FF6B6B', fontWeight: 600 }}>{errors[f.key]}</p>}
            </div>
          ))}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1.5" style={{ ...poppins, fontWeight: 700, color: '#1a1a2e' }}>Branch / Stream <span style={{ color: '#FF6B6B' }}>*</span></label>
              <div className="relative">
                <select value={form.branch} onChange={e => set('branch', e.target.value)} className="neo-input appearance-none" style={{ ...poppins, borderColor: errors.branch ? '#FF6B6B' : '#1a1a2e' }}>
                  <option value="">Select…</option>
                  {BRANCH_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: '#999' }} />
              </div>
              {errors.branch && <p className="text-xs mt-1" style={{ ...poppins, color: '#FF6B6B', fontWeight: 600 }}>{errors.branch}</p>}
            </div>
            <div>
              <label className="block text-sm mb-1.5" style={{ ...poppins, fontWeight: 700, color: '#1a1a2e' }}>Graduation Year <span style={{ color: '#FF6B6B' }}>*</span></label>
              <div className="relative">
                <select value={form.graduationYear} onChange={e => set('graduationYear', e.target.value)} className="neo-input appearance-none" style={{ ...poppins, borderColor: errors.graduationYear ? '#FF6B6B' : '#1a1a2e' }}>
                  <option value="">Year…</option>
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: '#999' }} />
              </div>
              {errors.graduationYear && <p className="text-xs mt-1" style={{ ...poppins, color: '#FF6B6B', fontWeight: 600 }}>{errors.graduationYear}</p>}
            </div>
          </div>
          <div>
            <label className="block text-sm mb-1.5" style={{ ...poppins, fontWeight: 700, color: '#1a1a2e' }}>College ID (Drive Link) <span style={{ color: '#FF6B6B' }}>*</span></label>
            <div className="relative">
              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#999' }} />
              <input type="url" value={form.collegeIdLink} onChange={e => set('collegeIdLink', e.target.value)} placeholder="https://drive.google.com/..."
                className="neo-input pl-9" style={{ ...poppins, borderColor: errors.collegeIdLink ? '#FF6B6B' : '#1a1a2e' }} />
            </div>
            {errors.collegeIdLink && <p className="text-xs mt-1" style={{ ...poppins, color: '#FF6B6B', fontWeight: 600 }}>{errors.collegeIdLink}</p>}
            <p className="text-xs mt-1" style={{ ...poppins, color: '#999' }}>Upload your college ID photo to Google Drive and paste the link here</p>
          </div>
          <div className="rounded-xl p-4" style={{ background: '#FFE156', border: '2px solid #1a1a2e' }}>
            <p className="text-xs leading-relaxed" style={{ ...poppins, color: '#1a1a2e', fontWeight: 600 }}>
              Upload your college ID photo to Google Drive (make it "Anyone with the link can view"), then paste the link above.
            </p>
          </div>
          <button type="submit" disabled={loading} className="w-full neo-btn neo-btn-pink py-3.5 flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ ...poppins, fontWeight: 700 }}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {loading ? 'Submitting…' : 'SUBMIT PROJECT'}
          </button>
        </form>
      </div>
    </div>
  );
}

function DriveLinkInput({ label, hint, value, onChange, error }: { label: string; hint: string; value: string; onChange: (v: string) => void; error?: string }) {
  const isInvalid = value.length > 0 && !isDriveLink(value);
  return (
    <div>
      <label className="block text-sm mb-1.5" style={{ ...poppins, fontWeight: 700, color: '#1a1a2e' }}>{label}</label>
      <div className="relative">
        <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#999' }} />
        <input type="url" value={value} onChange={e => onChange(e.target.value)} placeholder="https://drive.google.com/..."
          className="neo-input pl-9" style={{ ...poppins, borderColor: error ? '#FF6B6B' : isInvalid ? '#FFB347' : '#1a1a2e' }} />
      </div>
      {error && <p className="text-xs mt-1" style={{ ...poppins, color: '#FF6B6B', fontWeight: 600 }}>{error}</p>}
      {!error && isInvalid && <p className="text-xs mt-1" style={{ ...poppins, color: '#FFB347', fontWeight: 600 }}>Must be a Google Drive or Google Docs link</p>}
      {!error && !isInvalid && value && <p className="text-xs mt-1" style={{ ...poppins, color: '#999' }}>{hint}</p>}
    </div>
  );
}

export default function SubmitPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center pt-24"><div className="w-12 h-12 rounded-2xl flex items-center justify-center animate-neo-bounce" style={{ background: '#FFE156', border: '3px solid #1a1a2e', boxShadow: '3px 3px 0 #1a1a2e' }}><Loader2 className="w-6 h-6 animate-spin" style={{ color: '#1a1a2e' }} /></div></div>}>
      <SubmitPageContent />
    </Suspense>
  );
}

function SubmitPageContent() {
  const searchParams = useSearchParams();
  const enrollmentIdParam = searchParams.get('enrollmentId') || '';
  const [enrollmentId, setEnrollmentId] = useState(enrollmentIdParam);
  const [projectDriveLink, setProjectDriveLink] = useState('');
  const [linkErrors, setLinkErrors] = useState<{ project?: string; report?: string }>({});
  const [showIdentityModal, setShowIdentityModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(true);

  useEffect(() => { fetchSubmissions(); }, [submitSuccess]);

  const fetchSubmissions = async () => {
    setLoadingSubs(true);
    try { const r = await getSubmissions(1, 50); if (r.success && r.data) setSubmissions(r.data.submissions); } catch { } finally { setLoadingSubs(false); }
  };

  const validateLinks = () => {
    const errs: typeof linkErrors = {};
    if (!projectDriveLink.trim()) errs.project = 'Project Drive link is required';
    else if (!isDriveLink(projectDriveLink)) errs.project = 'Must be a Google Drive or Google Docs link';
    if (!enrollmentId.trim()) { setSubmitError('Please enter your Enrollment ID.'); return false; }
    setLinkErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleContinue = (e: React.FormEvent) => { e.preventDefault(); setSubmitError(null); if (validateLinks()) setShowIdentityModal(true); };

  const handleFinalSubmit = async (identity: IdentityData) => {
    setSubmitting(true); setSubmitError(null);
    try {
      const res = await fetch('/api/submissions', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enrollmentId, driveLink: projectDriveLink, fullName: identity.fullName, collegeName: identity.collegeName, collegeIdLink: identity.collegeIdLink, branch: identity.branch, graduationYear: parseInt(identity.graduationYear) }) });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error?.message || 'Submission failed');
      setShowIdentityModal(false); setSubmitSuccess(true); setProjectDriveLink('');
    } catch (err: any) { setShowIdentityModal(false); setSubmitError(err.message || 'Something went wrong.'); } finally { setSubmitting(false); }
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6" style={{ background: '#FFF8E7' }}>
      {showIdentityModal && <IdentityModal onClose={() => setShowIdentityModal(false)} onConfirm={handleFinalSubmit} loading={submitting} />}
      <div className="max-w-4xl mx-auto">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm mb-6" style={{ ...poppins, fontWeight: 700, color: '#1a1a2e', opacity: 0.6 }}>
          <ArrowLeft className="w-4 h-4" /> My Learning
        </Link>
        <h1 className="text-3xl md:text-4xl mb-2" style={{ ...outfit, fontWeight: 800, color: '#1a1a2e' }}>Project Submissions</h1>
        <p className="text-sm mb-8" style={{ ...poppins, color: '#1a1a2e', opacity: 0.6 }}>Complete all 7 days and pass every quiz before submitting your project.</p>

        <div className="grid md:grid-cols-2 gap-8">
          {/* New Submission */}
          <div className="rounded-2xl p-6 md:p-8" style={{ background: '#fff', border: '3px solid #1a1a2e', boxShadow: '5px 5px 0 #1a1a2e' }}>
            <h2 className="text-lg mb-6 flex items-center gap-2" style={{ ...outfit, fontWeight: 800, color: '#1a1a2e' }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#B084FF', border: '2px solid #1a1a2e' }}>
                <Upload className="w-4 h-4" style={{ color: '#1a1a2e' }} />
              </div>
              New Submission
            </h2>
            {submitSuccess ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: '#95E77E', border: '3px solid #1a1a2e', boxShadow: '3px 3px 0 #1a1a2e' }}>
                  <CheckCircle2 className="w-8 h-8" style={{ color: '#1a1a2e' }} />
                </div>
                <h3 className="text-xl mb-2" style={{ ...outfit, fontWeight: 800, color: '#1a1a2e' }}>Submitted Successfully!</h3>
                <p className="text-sm mb-5" style={{ ...poppins, color: '#666' }}>Your project is now under review.</p>
                <button onClick={() => { setSubmitSuccess(false); setEnrollmentId(enrollmentIdParam); }} style={{ ...poppins, fontWeight: 700, color: '#B084FF' }}>Submit another</button>
              </div>
            ) : (
              <form onSubmit={handleContinue} className="space-y-5">
                <div>
                  <label className="block text-sm mb-1.5" style={{ ...poppins, fontWeight: 700, color: '#1a1a2e' }}>Enrollment ID</label>
                  <input type="text" value={enrollmentId} onChange={e => setEnrollmentId(e.target.value)} required placeholder="Your enrollment ID" className="neo-input" style={poppins} />
                  <p className="text-xs mt-1" style={{ ...poppins, color: '#999' }}>Find this on your dashboard next to the course name.</p>
                </div>
                <DriveLinkInput label="Project Drive Link" hint="Upload your project files to Drive and paste the link" value={projectDriveLink}
                  onChange={v => { setProjectDriveLink(v); setLinkErrors(p => ({ ...p, project: undefined })); }} error={linkErrors.project} />
                <div className="rounded-xl p-4" style={{ background: '#A8E6FF', border: '2px solid #1a1a2e' }}>
                  <p className="text-xs leading-relaxed" style={{ ...poppins, fontWeight: 600, color: '#1a1a2e' }}>
                    <strong>How to share:</strong><br />1. Upload project to Google Drive<br />2. Click "Share" → "Anyone with the link"<br />3. Paste the link above
                  </p>
                </div>
                {submitError && (
                  <div className="px-4 py-3 rounded-xl text-sm flex gap-2" style={{ ...poppins, fontWeight: 600, background: '#FF6B6B', border: '2px solid #1a1a2e', color: '#1a1a2e' }}>
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{submitError}
                  </div>
                )}
                <button type="submit" className="w-full neo-btn neo-btn-primary py-3.5 flex items-center justify-center gap-2"
                  style={{ ...poppins, fontWeight: 700 }}>
                  <Upload className="w-4 h-4" /> CONTINUE TO SUBMIT
                </button>
                <p className="text-center text-xs" style={{ ...poppins, color: '#999' }}>You'll be asked for identity details before final submission</p>
              </form>
            )}
          </div>

          {/* Submissions List */}
          <div>
            <h2 className="text-lg mb-4 flex items-center gap-2" style={{ ...outfit, fontWeight: 800, color: '#1a1a2e' }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#4ECDC4', border: '2px solid #1a1a2e' }}>
                <FileText className="w-4 h-4" style={{ color: '#1a1a2e' }} />
              </div>
              Your Submissions
            </h2>
            {loadingSubs ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#FFE156', border: '2px solid #1a1a2e' }}>
                  <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#1a1a2e' }} />
                </div>
              </div>
            ) : submissions.length === 0 ? (
              <div className="rounded-2xl p-8 text-center" style={{ background: '#fff', border: '3px solid #1a1a2e', boxShadow: '5px 5px 0 #1a1a2e' }}>
                <FileText className="w-10 h-10 mx-auto mb-3" style={{ color: '#1a1a2e', opacity: 0.3 }} />
                <p className="text-sm" style={{ ...poppins, color: '#999', fontWeight: 600 }}>No submissions yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {submissions.map(sub => {
                  const status = statusColors[sub.reviewStatus] || statusColors.pending;
                  return (
                    <div key={sub.id} className="rounded-xl p-5" style={{ background: '#fff', border: '3px solid #1a1a2e', boxShadow: '3px 3px 0 #1a1a2e' }}>
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-sm" style={{ ...poppins, fontWeight: 700, color: '#1a1a2e' }}>{sub.courseName}</h3>
                        <span className="text-xs px-2.5 py-1 rounded-lg" style={{ ...poppins, fontWeight: 700, background: status.bg, border: '2px solid #1a1a2e', color: '#1a1a2e' }}>
                          {status.label}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs" style={{ ...poppins, fontWeight: 600, color: '#1a1a2e', opacity: 0.6 }}>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(sub.submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        {sub.finalGrade !== null && <span className="flex items-center gap-1"><Award className="w-3 h-3" />{sub.finalGrade} / 5 — {sub.gradeCategory}</span>}
                        {sub.resubmissionCount > 0 && <span>Resubmissions: {sub.resubmissionCount}/{sub.maxResubmissions}</span>}
                      </div>
                      {sub.adminNotes && (
                        <div className="mt-3 p-3 rounded-lg text-xs" style={{ ...poppins, background: '#FFF8E7', border: '2px solid #1a1a2e' }}>
                          <span style={{ fontWeight: 700, color: '#1a1a2e' }}>Admin feedback: </span>{sub.adminNotes}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}