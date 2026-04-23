'use client';

export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  AlertCircle, ArrowLeft, Ban, ExternalLink, FileDown, Loader2, Save, ShieldCheck,
} from 'lucide-react';
import {
  AdminCertificateDetail,
  getAdminCertificateDetail,
  revokeAdminCertificate,
  updateAdminCertificate,
} from '@/lib/api';

const poppins: React.CSSProperties = { fontFamily: "'Poppins', sans-serif" };
const outfit: React.CSSProperties = { fontFamily: "'Outfit', sans-serif" };

function formatDate(value: string | null | undefined) {
  if (!value) return 'Not available';
  return new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return 'Not available';
  return new Date(value).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminCertificateDetailPage() {
  const { certificateId } = useParams() as { certificateId: string };
  const [certificate, setCertificate] = useState<AdminCertificateDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pdfUrl, setPdfUrl] = useState('');
  const [revocationReason, setRevocationReason] = useState('');
  const [savingPdf, setSavingPdf] = useState(false);
  const [revoking, setRevoking] = useState(false);

  useEffect(() => {
    void loadCertificate();
  }, [certificateId]);

  async function loadCertificate() {
    setLoading(true);
    setError(null);
    try {
      const response = await getAdminCertificateDetail(certificateId);
      if (!response.success || !response.data) {
        setCertificate(null);
        setError(response.error?.message || 'Failed to load certificate');
        return;
      }

      const nextCertificate = response.data.certificate;
      setCertificate(nextCertificate);
      setPdfUrl(nextCertificate.certificatePdfUrl || '');
      setRevocationReason(nextCertificate.revocationReason || '');
    } catch (loadError) {
      console.error(loadError);
      setCertificate(null);
      setError('Failed to load certificate');
    } finally {
      setLoading(false);
    }
  }

  async function handleSavePdf() {
    if (!pdfUrl.trim()) {
      setMessage({ ok: false, text: 'Certificate PDF URL is required.' });
      return;
    }

    setSavingPdf(true);
    const response = await updateAdminCertificate(certificateId, pdfUrl.trim());
    if (!response.success) {
      setMessage({ ok: false, text: response.error?.message || 'Failed to save certificate PDF URL.' });
      setSavingPdf(false);
      return;
    }

    setMessage({ ok: true, text: 'Certificate PDF URL updated.' });
    await loadCertificate();
    setSavingPdf(false);
  }

  async function handleRevoke() {
    if (!revocationReason.trim()) {
      setMessage({ ok: false, text: 'Revocation note is required.' });
      return;
    }

    if (!confirm('Revoke this certificate permanently?')) {
      return;
    }

    setRevoking(true);
    const response = await revokeAdminCertificate(certificateId, revocationReason.trim());
    if (!response.success) {
      setMessage({ ok: false, text: response.error?.message || 'Failed to revoke certificate.' });
      setRevoking(false);
      return;
    }

    setMessage({ ok: true, text: 'Certificate revoked.' });
    await loadCertificate();
    setRevoking(false);
  }

  if (loading) {
    return <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-purple-600" /></div>;
  }

  if (!certificate || error) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3">
        <AlertCircle className="h-10 w-10 text-red-400" />
        <p className="text-sm text-gray-600" style={poppins}>{error || 'Certificate not found'}</p>
        <Link href="/admin/certificates" className="text-sm text-purple-600 hover:underline" style={poppins}>Back to certificates</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      <Link href="/admin/certificates" className="mb-4 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-purple-600" style={poppins}>
        <ArrowLeft className="h-4 w-4" />
        Back to certificates
      </Link>

      {message && (
        <div className={`mb-4 rounded-2xl px-4 py-3 text-sm ${message.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`} style={poppins}>
          {message.text}
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900" style={{ ...outfit, fontWeight: 800 }}>Certificate Record</h1>
          <p className="mt-1 text-sm text-gray-500" style={poppins}>Permanent certificate, approval snapshot, submission history, and verification audit trail.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className={`rounded-2xl px-4 py-3 ${certificate.isRevoked ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`} style={{ ...poppins, fontWeight: 600 }}>
            <div className="flex items-center gap-2">
              {certificate.isRevoked ? <Ban className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
              {certificate.isRevoked ? 'Revoked' : 'Valid'}
            </div>
            <div className="mt-1 font-mono text-xs">{certificate.certificateId}</div>
          </div>
        </div>
      </div>

      {certificate.isRevoked && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-semibold text-red-700" style={poppins}>This certificate has been revoked.</p>
          <p className="mt-1 text-sm text-red-600" style={poppins}>Reason: {certificate.revocationReason || 'No note provided'}</p>
          <p className="mt-1 text-xs text-red-500" style={poppins}>Revoked at: {formatDateTime(certificate.revokedAt)}</p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900" style={{ ...outfit, fontWeight: 700 }}>
            <ShieldCheck className="h-5 w-5 text-purple-600" />
            Issued Certificate
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Info label="Student name" value={certificate.studentName} />
            <Info label="College name" value={certificate.collegeName} />
            <Info label="Course" value={certificate.courseName} />
            <Info label="Stream / Branch" value={certificate.course.affiliatedBranch || 'Not available'} />
            <Info label="Grade" value={certificate.grade} />
            <Info label="Issue date" value={formatDateTime(certificate.issuedAt)} />
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            {certificate.certificateUrl && (
              <a href={certificate.certificateUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-gray-100 px-4 py-2 text-sm text-gray-700 hover:bg-gray-200" style={poppins}>
                <ExternalLink className="h-4 w-4" />
                Open certificate page
              </a>
            )}
            {certificate.certificatePdfUrl && (
              <a href={certificate.certificatePdfUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-2 text-sm text-blue-700 hover:bg-blue-100" style={poppins}>
                <FileDown className="h-4 w-4" />
                Open certificate PDF
              </a>
            )}
            {certificate.submission?.driveLink && (
              <a href={certificate.submission.driveLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-gray-100 px-4 py-2 text-sm text-gray-700 hover:bg-gray-200" style={poppins}>
                <ExternalLink className="h-4 w-4" />
                Open submission files
              </a>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-gray-900" style={{ ...outfit, fontWeight: 700 }}>PDF and Revocation Controls</h2>
          <div className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700" style={poppins}>Certificate PDF URL</label>
              <input
                type="url"
                value={pdfUrl}
                onChange={(event) => setPdfUrl(event.target.value)}
                placeholder="https://example.com/certificate.pdf"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-purple-500"
                style={poppins}
              />
              <p className="mt-1 text-xs text-gray-400" style={poppins}>This URL is used for student downloads and email attachment fetching.</p>
            </div>
            <button
              onClick={handleSavePdf}
              disabled={savingPdf}
              className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-purple-600 to-blue-600 px-4 py-2.5 text-sm text-white disabled:opacity-60"
              style={{ ...poppins, fontWeight: 600 }}
            >
              {savingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save PDF Link
            </button>

            <div className="border-t border-gray-100 pt-5">
              <label className="mb-1.5 block text-sm font-semibold text-gray-700" style={poppins}>Revocation Note</label>
              <textarea
                rows={4}
                value={revocationReason}
                onChange={(event) => setRevocationReason(event.target.value)}
                disabled={certificate.isRevoked}
                placeholder="Example: Revoked due to cheating during project review."
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-50"
                style={poppins}
              />
              {certificate.isRevoked ? (
                <p className="mt-2 text-xs text-red-500" style={poppins}>Revocation is already recorded for this certificate.</p>
              ) : (
                <button
                  onClick={handleRevoke}
                  disabled={revoking}
                  className="mt-3 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm text-white disabled:opacity-60"
                  style={{ ...poppins, fontWeight: 600 }}
                >
                  {revoking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />}
                  Revoke Certificate
                </button>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-gray-900" style={{ ...outfit, fontWeight: 700 }}>Approval Snapshot</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Info label="Confirmed full name" value={certificate.approvalSnapshot.fullName || 'Not available'} />
            <Info label="Confirmed date of birth" value={formatDate(certificate.approvalSnapshot.dob)} />
            <Info label="Confirmed college name" value={certificate.approvalSnapshot.collegeName} />
            <Info label="Confirmed branch" value={certificate.approvalSnapshot.branch || 'Not available'} />
            <Info label="Graduation year" value={certificate.approvalSnapshot.graduationYear ? String(certificate.approvalSnapshot.graduationYear) : 'Not available'} />
            <Info label="College ID link" value={certificate.approvalSnapshot.collegeIdLink || 'Not available'} breakAll />
          </div>
        </section>

        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-gray-900" style={{ ...outfit, fontWeight: 700 }}>Linked User and Course</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Info label="User name" value={certificate.user.name} />
            <Info label="User email" value={certificate.user.email} />
            <Info label="User phone" value={certificate.user.phone || 'Not available'} />
            <Info label="Course ID" value={certificate.course.courseId} />
            <Info label="Course name" value={certificate.course.courseName} />
            <Info label="Enrollment completed" value={formatDateTime(certificate.completedAt)} />
          </div>
        </section>

        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="mb-4 text-lg font-bold text-gray-900" style={{ ...outfit, fontWeight: 700 }}>Submission Snapshot</h2>
          {certificate.submission ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <Info label="Submission status" value={certificate.submission.reviewStatus} />
                <Info label="Submitted at" value={formatDateTime(certificate.submission.submittedAt)} />
                <Info label="Original full name" value={certificate.submission.fullName} />
                <Info label="Original date of birth" value={formatDate(certificate.submission.dob)} />
                <Info label="Original college name" value={certificate.submission.collegeName} />
                <Info label="Original branch" value={certificate.submission.branch} />
                <Info label="Original graduation year" value={String(certificate.submission.graduationYear)} />
                <Info label="Final score" value={certificate.submission.finalGrade != null ? String(certificate.submission.finalGrade) : 'Not available'} />
                <Info label="Grade band" value={certificate.submission.gradeCategory || 'Not available'} />
                <Info label="Review completed" value={formatDateTime(certificate.submission.reviewCompletedAt)} />
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <Info label="Simulation Accuracy" value={certificate.submission.metric1SimulationAccuracy != null ? String(certificate.submission.metric1SimulationAccuracy) : 'Not available'} />
                <Info label="Logic and Methodology" value={certificate.submission.metric2LogicMethodology != null ? String(certificate.submission.metric2LogicMethodology) : 'Not available'} />
                <Info label="Industrial Output" value={certificate.submission.metric3IndustrialOutput != null ? String(certificate.submission.metric3IndustrialOutput) : 'Not available'} />
                <Info label="Sensitivity Analysis" value={certificate.submission.metric4SensitivityAnalysis != null ? String(certificate.submission.metric4SensitivityAnalysis) : 'Not available'} />
                <Info label="Documentation" value={certificate.submission.metric5Documentation != null ? String(certificate.submission.metric5Documentation) : 'Not available'} />
                <Info label="College ID link" value={certificate.submission.collegeIdLink} breakAll />
              </div>

              {certificate.submission.adminNotes && (
                <div className="mt-4 rounded-xl bg-gray-50 p-4">
                  <p className="text-xs text-gray-500" style={poppins}>Admin notes</p>
                  <p className="mt-1 text-sm text-gray-700" style={poppins}>{certificate.submission.adminNotes}</p>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-gray-500" style={poppins}>Submission snapshot not found.</p>
          )}
        </section>

        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="mb-4 text-lg font-bold text-gray-900" style={{ ...outfit, fontWeight: 700 }}>Verification History</h2>
          {certificate.verificationHistory.length === 0 ? (
            <p className="text-sm text-gray-500" style={poppins}>No verification scans recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {certificate.verificationHistory.map((verification) => (
                <div key={verification.id} className="rounded-xl border border-gray-100 p-4">
                  <p className="text-sm font-semibold text-gray-900" style={poppins}>{formatDateTime(verification.scannedAt)}</p>
                  <p className="text-xs text-gray-500" style={poppins}>IP: {verification.ipAddress || 'Not available'}</p>
                  <p className="text-xs text-gray-500 break-all" style={poppins}>User agent: {verification.userAgent || 'Not available'}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Info({ label, value, breakAll = false }: { label: string; value: string; breakAll?: boolean }) {
  return (
    <div>
      <p className="text-xs text-gray-500" style={poppins}>{label}</p>
      <p className={`text-sm font-semibold text-gray-900 ${breakAll ? 'break-all' : ''}`} style={poppins}>{value}</p>
    </div>
  );
}
