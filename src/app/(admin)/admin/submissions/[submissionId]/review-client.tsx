'use client'

export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, ArrowLeft, CheckCircle2, ExternalLink, FileText, GraduationCap, Loader2, Save, ShieldCheck, User, XCircle } from 'lucide-react'
import { approveSubmission, fetchApi, getAdminSubmissionDetail, rejectSubmission } from '@/lib/api'

const poppins: React.CSSProperties = { fontFamily: "'Poppins', sans-serif" }
const outfit: React.CSSProperties = { fontFamily: "'Outfit', sans-serif" }

const METRICS = [
    ['simulationAccuracy', 'Simulation Accuracy', 'Technical correctness and result quality', 25],
    ['logicMethodology', 'Logic and Methodology', 'Approach, structure, and engineering reasoning', 25],
    ['industrialOutput', 'Industrial Output', 'Industry relevance and practical usefulness', 20],
    ['sensitivityAnalysis', 'Sensitivity Analysis', 'Testing of assumptions and edge cases', 15],
    ['documentation', 'Documentation', 'Clarity and completeness of the submission', 15],
] as const

const EMPTY_METRICS = {
    simulationAccuracy: '',
    logicMethodology: '',
    industrialOutput: '',
    sensitivityAnalysis: '',
    documentation: '',
} as Record<(typeof METRICS)[number][0], number | ''>

type CertificateFormState = {
    certificateStudentName: string
    certificateCollegeName: string
    fullName: string
    dob: string
    collegeName: string
    branch: string
    graduationYear: string
    collegeIdLink: string
    certificateLink: string
}

function formatDateTime(value: string | null | undefined) {
    if (!value) return 'Not available'
    return new Date(value).toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}

function getStatusClass(status: string) {
    if (status === 'approved') return 'bg-green-100 text-green-700'
    if (status === 'rejected') return 'bg-red-100 text-red-700'
    if (status === 'under_review') return 'bg-blue-100 text-blue-700'
    return 'bg-amber-100 text-amber-700'
}

function calculateFinalGrade(metrics: typeof EMPTY_METRICS) {
    if (Object.values(metrics).some((value) => value === '')) return null
    return (
        (Number(metrics.simulationAccuracy) / 2) * 0.25 +
        (Number(metrics.logicMethodology) / 2) * 0.25 +
        (Number(metrics.industrialOutput) / 2) * 0.2 +
        (Number(metrics.sensitivityAnalysis) / 2) * 0.15 +
        (Number(metrics.documentation) / 2) * 0.15
    )
}

function getGradeBand(finalGrade: number | null) {
    if (finalGrade === null) return 'Incomplete'
    if (finalGrade >= 4.5) return 'Distinction'
    if (finalGrade >= 3) return 'First Class'
    if (finalGrade >= 2) return 'Pass'
    return 'Fail'
}

function initialCertificateForm(submission: any): CertificateFormState {
    const snapshot = submission.certificate?.approvalSnapshot

    return {
        certificateStudentName: submission.certificate?.studentName || snapshot?.fullName || submission.identity?.fullName || submission.enrollment.user.name,
        certificateCollegeName: submission.certificate?.collegeName || snapshot?.collegeName || submission.identity?.collegeName || '',
        fullName: snapshot?.fullName || submission.identity?.fullName || submission.enrollment.user.name,
        dob: snapshot?.dob || submission.identity?.dob || '',
        collegeName: snapshot?.collegeName || submission.identity?.collegeName || '',
        branch: snapshot?.branch || submission.identity?.branch || '',
        graduationYear: snapshot?.graduationYear ? String(snapshot.graduationYear) : submission.identity?.graduationYear ? String(submission.identity.graduationYear) : '',
        collegeIdLink: snapshot?.collegeIdLink || submission.identity?.collegeIdUrl || '',
        certificateLink: submission.certificate?.certificatePdfUrl || '',
    }
}

export default function SubmissionReviewClientPage() {
    const { submissionId } = useParams() as { submissionId: string }
    const [submission, setSubmission] = useState<any>(null)
    const [metrics, setMetrics] = useState(EMPTY_METRICS)
    const [adminNotes, setAdminNotes] = useState('')
    const [certificateForm, setCertificateForm] = useState<CertificateFormState>({
        certificateStudentName: '',
        certificateCollegeName: '',
        fullName: '',
        dob: '',
        collegeName: '',
        branch: '',
        graduationYear: '',
        collegeIdLink: '',
        certificateLink: '',
    })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [approving, setApproving] = useState(false)
    const [rejecting, setRejecting] = useState(false)
    const [showCertificateModal, setShowCertificateModal] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

    const finalGrade = useMemo(() => calculateFinalGrade(metrics), [metrics])
    const rubricComplete = Object.values(metrics).every((value) => value !== '')
    const reviewLocked = submission?.reviewStatus === 'approved' || submission?.reviewStatus === 'rejected'
    const approvalFormComplete =
        certificateForm.certificateStudentName.trim() &&
        certificateForm.certificateCollegeName.trim() &&
        certificateForm.fullName.trim() &&
        certificateForm.collegeName.trim() &&
        certificateForm.branch.trim() &&
        certificateForm.graduationYear.trim() &&
        certificateForm.collegeIdLink.trim() &&
        certificateForm.certificateLink.trim()

    async function loadSubmission() {
        setLoading(true)
        setError(null)
        try {
            const response = await getAdminSubmissionDetail(submissionId)
            if (!response.success || !response.data || !response.data.submission) {
                setError(response.error?.message || 'Failed to load submission')
                return
            }

            const nextSubmission = response.data.submission
            setSubmission(nextSubmission)
            setAdminNotes(nextSubmission.adminNotes || '')
            setMetrics(nextSubmission.gradeMetrics ? {
                simulationAccuracy: nextSubmission.gradeMetrics.simulationAccuracy,
                logicMethodology: nextSubmission.gradeMetrics.logicMethodology,
                industrialOutput: nextSubmission.gradeMetrics.industrialOutput,
                sensitivityAnalysis: nextSubmission.gradeMetrics.sensitivityAnalysis,
                documentation: nextSubmission.gradeMetrics.documentation,
            } : EMPTY_METRICS)
            setCertificateForm(initialCertificateForm(nextSubmission))
        } catch (loadError) {
            console.error(loadError)
            setError('Failed to load submission')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        void loadSubmission()
    }, [submissionId])

    async function saveRubricDraft(options?: { refreshAfterSave?: boolean }) {
        if (!rubricComplete) {
            setMessage({ type: 'error', text: 'Fill all five metrics before saving the rubric.' })
            return false
        }

        setSaving(true)
        setMessage(null)

        try {
            const response = await fetchApi(`/api/admin/submissions/${submissionId}/grade`, {
                method: 'PUT',
                body: JSON.stringify({
                    metric1: Number(metrics.simulationAccuracy),
                    metric2: Number(metrics.logicMethodology),
                    metric3: Number(metrics.industrialOutput),
                    metric4: Number(metrics.sensitivityAnalysis),
                    metric5: Number(metrics.documentation),
                    adminNotes,
                }),
            })

            if (!response.success) {
                setMessage({ type: 'error', text: response.error?.message || 'Failed to save rubric.' })
                return false
            }

            setMessage({ type: 'success', text: 'Rubric saved.' })
            if (options?.refreshAfterSave !== false) {
                await loadSubmission()
            }
            return true
        } catch (saveError) {
            console.error(saveError)
            setMessage({ type: 'error', text: 'Failed to save rubric.' })
            return false
        } finally {
            setSaving(false)
        }
    }

    async function handleApprove() {
        const saved = await saveRubricDraft({ refreshAfterSave: false })
        if (!saved) return

        setApproving(true)
        setMessage(null)

        try {
            const response = await approveSubmission(submissionId, {
                certificateStudentName: certificateForm.certificateStudentName.trim(),
                certificateCollegeName: certificateForm.certificateCollegeName.trim(),
                fullName: certificateForm.fullName.trim(),
                dob: certificateForm.dob || null,
                collegeName: certificateForm.collegeName.trim(),
                branch: certificateForm.branch.trim(),
                graduationYear: Number(certificateForm.graduationYear),
                collegeIdLink: certificateForm.collegeIdLink.trim(),
                certificatePdfUrl: certificateForm.certificateLink.trim(),
            })

            if (!response.success) {
                setMessage({ type: 'error', text: response.error?.message || 'Failed to approve submission.' })
                return
            }

            setShowCertificateModal(false)
            setMessage({ type: 'success', text: `Certificate ${response.data?.certificateId || ''} generated successfully.` })
            await loadSubmission()
        } catch (approveError) {
            console.error(approveError)
            setMessage({ type: 'error', text: 'Failed to approve submission.' })
        } finally {
            setApproving(false)
        }
    }

    async function handleReject() {
        if (!adminNotes.trim()) {
            setMessage({ type: 'error', text: 'Add review notes before rejecting this submission.' })
            return
        }

        setRejecting(true)
        setMessage(null)

        try {
            const response = await rejectSubmission(submissionId, adminNotes.trim())
            if (!response.success) {
                setMessage({ type: 'error', text: response.error?.message || 'Failed to reject submission.' })
                return
            }

            setMessage({ type: 'success', text: 'Submission rejected and feedback recorded.' })
            await loadSubmission()
        } catch (rejectError) {
            console.error(rejectError)
            setMessage({ type: 'error', text: 'Failed to reject submission.' })
        } finally {
            setRejecting(false)
        }
    }

    if (loading) {
        return <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-purple-600" /></div>
    }

    if (!submission || error) {
        return (
            <div className="flex h-96 flex-col items-center justify-center gap-3">
                <AlertCircle className="h-10 w-10 text-red-400" />
                <p className="text-sm text-gray-600" style={poppins}>{error || 'Submission not found'}</p>
                <Link href="/admin/submissions" className="text-sm text-purple-600 hover:underline" style={poppins}>Back to submissions</Link>
            </div>
        )
    }

    return (
        <div className="mx-auto max-w-7xl p-6">
            {showCertificateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
                        <h2 className="text-xl font-bold text-gray-900" style={{ ...outfit, fontWeight: 800 }}>Confirm Certificate Details</h2>
                        <p className="mt-1 text-sm text-gray-500" style={poppins}>These fields are prefilled from the submission. Edits here are stored as the approval snapshot for this certificate record.</p>
                        <div className="mt-5 grid gap-4 sm:grid-cols-2">
                            <input
                                value={certificateForm.certificateStudentName}
                                onChange={(event) => setCertificateForm((current) => ({ ...current, certificateStudentName: event.target.value }))}
                                placeholder="Certificate name"
                                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none focus:border-transparent focus:ring-2 focus:ring-purple-500"
                                style={poppins}
                            />
                            <input
                                value={certificateForm.certificateCollegeName}
                                onChange={(event) => setCertificateForm((current) => ({
                                    ...current,
                                    certificateCollegeName: event.target.value,
                                    collegeName: event.target.value,
                                }))}
                                placeholder="Certificate college name"
                                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none focus:border-transparent focus:ring-2 focus:ring-purple-500"
                                style={poppins}
                            />
                            <input
                                value={certificateForm.fullName}
                                onChange={(event) => setCertificateForm((current) => ({ ...current, fullName: event.target.value }))}
                                placeholder="Confirmed full name"
                                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none focus:border-transparent focus:ring-2 focus:ring-purple-500"
                                style={poppins}
                            />
                            <input
                                type="date"
                                value={certificateForm.dob ? certificateForm.dob.slice(0, 10) : ''}
                                onChange={(event) => setCertificateForm((current) => ({ ...current, dob: event.target.value }))}
                                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none focus:border-transparent focus:ring-2 focus:ring-purple-500"
                                style={poppins}
                            />
                            <input
                                value={certificateForm.collegeName}
                                onChange={(event) => setCertificateForm((current) => ({
                                    ...current,
                                    collegeName: event.target.value,
                                    certificateCollegeName: event.target.value,
                                }))}
                                placeholder="Confirmed college name"
                                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none focus:border-transparent focus:ring-2 focus:ring-purple-500"
                                style={poppins}
                            />
                            <input
                                value={certificateForm.branch}
                                onChange={(event) => setCertificateForm((current) => ({ ...current, branch: event.target.value }))}
                                placeholder="Confirmed branch"
                                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none focus:border-transparent focus:ring-2 focus:ring-purple-500"
                                style={poppins}
                            />
                            <input
                                type="number"
                                value={certificateForm.graduationYear}
                                onChange={(event) => setCertificateForm((current) => ({ ...current, graduationYear: event.target.value }))}
                                placeholder="Graduation year"
                                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none focus:border-transparent focus:ring-2 focus:ring-purple-500"
                                style={poppins}
                            />
                            <input
                                value={certificateForm.collegeIdLink}
                                onChange={(event) => setCertificateForm((current) => ({ ...current, collegeIdLink: event.target.value }))}
                                placeholder="College ID link"
                                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none focus:border-transparent focus:ring-2 focus:ring-purple-500"
                                style={poppins}
                            />
                            <input
                                value={certificateForm.certificateLink}
                                onChange={(event) => setCertificateForm((current) => ({ ...current, certificateLink: event.target.value }))}
                                placeholder="Certificate link"
                                className="sm:col-span-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none focus:border-transparent focus:ring-2 focus:ring-purple-500"
                                style={poppins}
                            />
                        </div>
                        <p className="mt-3 text-xs text-gray-400" style={poppins}>Add the public certificate PDF link here. Approval stays blocked until this link is provided.</p>
                        <div className="mt-6 flex gap-3">
                            <button onClick={() => setShowCertificateModal(false)} className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700" style={{ ...poppins, fontWeight: 600 }}>Cancel</button>
                            <button
                                onClick={() => void handleApprove()}
                                disabled={approving || !approvalFormComplete}
                                className="flex-1 rounded-xl bg-green-600 px-4 py-3 text-sm text-white disabled:opacity-60"
                                style={{ ...poppins, fontWeight: 600 }}
                            >
                                {approving ? 'Approving...' : 'Confirm and Generate'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <Link href="/admin/submissions" className="mb-3 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-purple-600" style={poppins}>
                        <ArrowLeft className="h-4 w-4" />
                        Back to submissions
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900" style={{ ...outfit, fontWeight: 800 }}>Process Submission</h1>
                    <p className="mt-1 text-sm text-gray-500" style={poppins}>Review submission data, score the rubric, and confirm the certificate snapshot.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(submission.reviewStatus)}`} style={poppins}>
                        {submission.reviewStatus.replace('_', ' ')}
                    </span>
                    {submission.certificate && (
                        <Link href={`/admin/certificates/${submission.certificate.certificateId}`} className="inline-flex items-center gap-2 rounded-xl bg-purple-50 px-4 py-2 text-sm text-purple-700 hover:bg-purple-100" style={{ ...poppins, fontWeight: 600 }}>
                            <ShieldCheck className="h-4 w-4" />
                            View Certificate Record
                        </Link>
                    )}
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-5">
                <div className="space-y-6 lg:col-span-3">
                    <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900" style={{ ...outfit, fontWeight: 700 }}>
                            <User className="h-5 w-5 text-purple-600" />
                            Student and Submission Details
                        </h2>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div><p className="text-xs text-gray-500" style={poppins}>Student account name</p><p className="text-sm font-semibold text-gray-900" style={poppins}>{submission.enrollment.user.name}</p></div>
                            <div><p className="text-xs text-gray-500" style={poppins}>Email</p><p className="text-sm font-semibold text-gray-900" style={poppins}>{submission.enrollment.user.email}</p></div>
                            <div><p className="text-xs text-gray-500" style={poppins}>Phone</p><p className="text-sm font-semibold text-gray-900" style={poppins}>{submission.enrollment.user.phone || 'Not provided'}</p></div>
                            <div><p className="text-xs text-gray-500" style={poppins}>Course</p><p className="text-sm font-semibold text-gray-900" style={poppins}>{submission.enrollment.course.courseName} ({submission.enrollment.course.courseId})</p></div>
                            <div><p className="text-xs text-gray-500" style={poppins}>Submitted at</p><p className="text-sm font-semibold text-gray-900" style={poppins}>{formatDateTime(submission.submittedAt)}</p></div>
                            <div><p className="text-xs text-gray-500" style={poppins}>Review completed</p><p className="text-sm font-semibold text-gray-900" style={poppins}>{formatDateTime(submission.reviewCompletedAt)}</p></div>
                        </div>
                    </section>

                    <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900" style={{ ...outfit, fontWeight: 700 }}>
                            <GraduationCap className="h-5 w-5 text-purple-600" />
                            Submitted Identity Data
                        </h2>
                        {submission.identity ? (
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div><p className="text-xs text-gray-500" style={poppins}>Full name</p><p className="text-sm font-semibold text-gray-900" style={poppins}>{submission.identity.fullName}</p></div>
                                <div><p className="text-xs text-gray-500" style={poppins}>Date of birth</p><p className="text-sm font-semibold text-gray-900" style={poppins}>{formatDateTime(submission.identity.dob)}</p></div>
                                <div><p className="text-xs text-gray-500" style={poppins}>College name</p><p className="text-sm font-semibold text-gray-900" style={poppins}>{submission.identity.collegeName}</p></div>
                                <div><p className="text-xs text-gray-500" style={poppins}>Branch</p><p className="text-sm font-semibold text-gray-900" style={poppins}>{submission.identity.branch}</p></div>
                                <div><p className="text-xs text-gray-500" style={poppins}>Graduation year</p><p className="text-sm font-semibold text-gray-900" style={poppins}>{submission.identity.graduationYear}</p></div>
                                <div><p className="text-xs text-gray-500" style={poppins}>Resubmissions used</p><p className="text-sm font-semibold text-gray-900" style={poppins}>{submission.resubmissionCount} / {submission.maxResubmissions}</p></div>
                                {submission.identity.collegeIdUrl && (
                                    <div className="sm:col-span-2">
                                        <a href={submission.identity.collegeIdUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-purple-600 hover:underline" style={poppins}>
                                            <ExternalLink className="h-4 w-4" />
                                            Open college ID proof
                                        </a>
                                    </div>
                                )}
                            </div>
                        ) : <p className="text-sm text-gray-500" style={poppins}>Identity details were not found for this submission.</p>}
                    </section>

                    <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900" style={{ ...outfit, fontWeight: 700 }}>
                            <FileText className="h-5 w-5 text-purple-600" />
                            Project Assets
                        </h2>
                        {submission.projectFileUrl ? (
                            <a href={submission.projectFileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-4 hover:bg-gray-50">
                                <div>
                                    <p className="text-sm font-semibold text-gray-900" style={poppins}>Project drive link</p>
                                    <p className="text-xs text-gray-500" style={poppins}>Open the submitted project files</p>
                                </div>
                                <ExternalLink className="h-4 w-4 text-gray-400" />
                            </a>
                        ) : <p className="text-sm text-gray-500" style={poppins}>No project link available.</p>}
                    </section>

                    {submission.certificate && (
                        <section className="rounded-2xl border border-green-100 bg-green-50 p-6 shadow-sm">
                            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900" style={{ ...outfit, fontWeight: 700 }}>
                                <ShieldCheck className="h-5 w-5 text-green-600" />
                                Issued Certificate Snapshot
                            </h2>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div><p className="text-xs text-gray-500" style={poppins}>Certificate ID</p><p className="text-sm font-semibold text-gray-900" style={poppins}>{submission.certificate.certificateId}</p></div>
                                <div><p className="text-xs text-gray-500" style={poppins}>Issued at</p><p className="text-sm font-semibold text-gray-900" style={poppins}>{formatDateTime(submission.certificate.issuedAt)}</p></div>
                                <div><p className="text-xs text-gray-500" style={poppins}>Certificate name</p><p className="text-sm font-semibold text-gray-900" style={poppins}>{submission.certificate.studentName}</p></div>
                                <div><p className="text-xs text-gray-500" style={poppins}>Certificate college</p><p className="text-sm font-semibold text-gray-900" style={poppins}>{submission.certificate.collegeName}</p></div>
                                <div className="sm:col-span-2"><p className="text-xs text-gray-500" style={poppins}>Certificate link</p><p className="text-sm font-semibold text-gray-900 break-all" style={poppins}>{submission.certificate.certificatePdfUrl || 'Not available'}</p></div>
                            </div>
                            <div className="mt-4 rounded-xl bg-white/70 p-4">
                                <p className="text-xs text-gray-500" style={poppins}>Approval snapshot</p>
                                <div className="mt-2 grid gap-3 sm:grid-cols-2">
                                    <div><p className="text-xs text-gray-500" style={poppins}>Full name</p><p className="text-sm font-semibold text-gray-900" style={poppins}>{submission.certificate.approvalSnapshot.fullName || 'Not available'}</p></div>
                                    <div><p className="text-xs text-gray-500" style={poppins}>Date of birth</p><p className="text-sm font-semibold text-gray-900" style={poppins}>{formatDateTime(submission.certificate.approvalSnapshot.dob)}</p></div>
                                    <div><p className="text-xs text-gray-500" style={poppins}>Branch</p><p className="text-sm font-semibold text-gray-900" style={poppins}>{submission.certificate.approvalSnapshot.branch || 'Not available'}</p></div>
                                    <div><p className="text-xs text-gray-500" style={poppins}>Graduation year</p><p className="text-sm font-semibold text-gray-900" style={poppins}>{submission.certificate.approvalSnapshot.graduationYear || 'Not available'}</p></div>
                                </div>
                            </div>
                        </section>
                    )}
                </div>

                <div className="space-y-6 lg:col-span-2">
                    <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                        <h2 className="mb-4 text-lg font-bold text-gray-900" style={{ ...outfit, fontWeight: 700 }}>Metric Rubric</h2>
                        <p className="mb-4 text-sm text-gray-500" style={poppins}>Score each metric out of 10. The weighted result is calculated automatically.</p>
                        <div className="space-y-4">
                            {METRICS.map(([key, label, description, weight]) => (
                                <div key={key} className="rounded-xl border border-gray-100 p-4">
                                    <div className="mb-2 flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900" style={poppins}>{label}</p>
                                            <p className="text-xs text-gray-500" style={poppins}>{description}</p>
                                        </div>
                                        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-600" style={poppins}>{weight}%</span>
                                    </div>
                                    <select
                                        value={metrics[key]}
                                        disabled={reviewLocked}
                                        onChange={(event) => setMetrics((current) => ({ ...current, [key]: event.target.value === '' ? '' : Number(event.target.value) }))}
                                        className="w-full rounded-xl border border-gray-200 px-3 py-3 text-sm text-gray-900 outline-none focus:border-transparent focus:ring-2 focus:ring-purple-500 disabled:bg-gray-50"
                                        style={poppins}
                                    >
                                        <option value="">Select score</option>
                                        {Array.from({ length: 11 }, (_, score) => <option key={score} value={score}>{score} / 10</option>)}
                                    </select>
                                </div>
                            ))}
                        </div>
                        <div className="mt-5 rounded-xl bg-gray-50 p-4">
                            <p className="text-xs text-gray-500" style={poppins}>Weighted result</p>
                            <p className="mt-1 text-3xl font-bold text-gray-900" style={{ ...outfit, fontWeight: 800 }}>
                                {finalGrade === null ? '--' : finalGrade.toFixed(2)}
                                <span className="ml-1 text-lg text-gray-400">/ 5</span>
                            </p>
                            <p className="mt-1 text-sm text-gray-500" style={poppins}>Grade band: {getGradeBand(finalGrade)}</p>
                        </div>
                    </section>

                    <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                        <h2 className="mb-4 text-lg font-bold text-gray-900" style={{ ...outfit, fontWeight: 700 }}>Admin Notes</h2>
                        <textarea
                            rows={6}
                            value={adminNotes}
                            disabled={reviewLocked}
                            onChange={(event) => setAdminNotes(event.target.value)}
                            placeholder="Write the review notes or rejection feedback here."
                            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none focus:border-transparent focus:ring-2 focus:ring-purple-500 disabled:bg-gray-50"
                            style={poppins}
                        />
                    </section>

                    {message && (
                        <div className={`rounded-xl px-4 py-3 text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`} style={poppins}>
                            {message.text}
                        </div>
                    )}

                    {!reviewLocked && (
                        <section className="space-y-3">
                            <button onClick={() => void saveRubricDraft()} disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60" style={{ ...poppins, fontWeight: 600 }}>
                                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                Save Rubric Draft
                            </button>
                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={() => void handleReject()} disabled={rejecting || !adminNotes.trim()} className="flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 hover:bg-red-100 disabled:opacity-60" style={{ ...poppins, fontWeight: 600 }}>
                                    {rejecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                                    Reject
                                </button>
                                <button onClick={() => setShowCertificateModal(true)} disabled={!rubricComplete} className="flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm text-white hover:bg-green-700 disabled:opacity-60" style={{ ...poppins, fontWeight: 600 }}>
                                    <CheckCircle2 className="h-4 w-4" />
                                    Confirm Approval
                                </button>
                            </div>
                            {!rubricComplete && <p className="text-center text-xs text-gray-400" style={poppins}>Complete all five metric scores before approval.</p>}
                        </section>
                    )}
                </div>
            </div>
        </div>
    )
}
