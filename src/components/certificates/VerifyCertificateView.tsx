'use client'

import { FormEvent, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertCircle, BadgeCheck, Ban, Loader2, Search } from 'lucide-react'

const poppins: React.CSSProperties = { fontFamily: "'Poppins', sans-serif" }
const outfit: React.CSSProperties = { fontFamily: "'Outfit', sans-serif" }

type VerifyResult = {
  valid: boolean
  status: 'valid' | 'revoked'
  certificate: {
    certificateId: string
    studentName: string
    collegeName: string
    courseName: string
    branch: string | null
    stream: string | null
    dateOfBirth: string | null
    finalScore: number | null
    grade: string
    gradeCategory: string | null
    issuedAt: string
    revocationReason: string | null
  }
}

export function VerifyCertificateView({ initialCertificateId = '' }: { initialCertificateId?: string }) {
  const router = useRouter()
  const [certificateId, setCertificateId] = useState(initialCertificateId)
  const [loading, setLoading] = useState(Boolean(initialCertificateId))
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<VerifyResult | null>(null)

  async function loadCertificate(nextCertificateId: string) {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch(`/api/verify/${encodeURIComponent(nextCertificateId)}`, {
        credentials: 'include',
      })
      const payload = await response.json().catch(() => null)

      if (!response.ok || !payload?.success || !payload?.data) {
        setError(payload?.error?.message || 'Certificate not found.')
        return
      }

      setResult(payload.data as VerifyResult)
    } catch (loadError) {
      console.error(loadError)
      setError('Failed to verify certificate. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (initialCertificateId) {
      void loadCertificate(initialCertificateId)
    }
  }, [initialCertificateId])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const normalizedId = certificateId.trim().toUpperCase()
    if (!normalizedId) {
      setError('Enter a certificate ID to continue.')
      return
    }

    router.push(`/verify/${encodeURIComponent(normalizedId)}`)
  }

  const statusTone = result?.status === 'revoked'
    ? 'border-red-200 bg-red-50 text-red-700'
    : 'border-green-200 bg-green-50 text-green-700'

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-blue-50 px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-10 text-center">
          <p className="mb-3 text-sm uppercase tracking-[0.3em] text-purple-600" style={poppins}>Certificate Verification</p>
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl" style={{ ...outfit, fontWeight: 800 }}>
            Verify a Sprintern Certificate
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-gray-500 sm:text-base" style={poppins}>
            Enter a certificate ID like <span className="font-semibold text-gray-700">CERT-ABCD-XYZA</span> to confirm the issued record.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mx-auto mb-8 max-w-2xl rounded-3xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={certificateId}
                onChange={(event) => setCertificateId(event.target.value.toUpperCase())}
                placeholder="Enter certificate ID"
                className="w-full rounded-2xl border border-gray-200 py-3 pl-11 pr-4 text-sm text-gray-900 outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                style={poppins}
              />
            </div>
            <button
              type="submit"
              className="rounded-2xl bg-linear-to-r from-purple-600 to-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:shadow-lg"
              style={poppins}
            >
              Verify
            </button>
          </div>
        </form>

        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          </div>
        )}

        {!loading && error && (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-center">
            <AlertCircle className="mx-auto mb-3 h-8 w-8 text-red-500" />
            <p className="text-sm font-semibold text-red-700" style={poppins}>{error}</p>
          </div>
        )}

        {!loading && result && (
          <div className="space-y-6">
            <div className={`rounded-3xl border p-5 ${statusTone}`}>
              <div className="flex items-start gap-3">
                {result.status === 'revoked' ? <Ban className="mt-0.5 h-6 w-6" /> : <BadgeCheck className="mt-0.5 h-6 w-6" />}
                <div>
                  <p className="text-lg font-semibold" style={poppins}>
                    {result.status === 'revoked' ? 'This certificate has been revoked.' : 'This certificate is valid.'}
                  </p>
                  {result.status === 'revoked' && result.certificate.revocationReason && (
                    <p className="mt-2 text-sm" style={poppins}>
                      Revoked due to: {result.certificate.revocationReason}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-gray-400" style={poppins}>Certificate ID</p>
                  <p className="mt-2 text-xl font-semibold text-gray-900" style={outfit}>{result.certificate.certificateId}</p>
                </div>
                <div className="rounded-full bg-gray-100 px-4 py-2 text-sm text-gray-600" style={poppins}>
                  {new Date(result.certificate.issuedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <DetailCard label="Student Name" value={result.certificate.studentName} />
                <DetailCard label="College Name" value={result.certificate.collegeName} />
                <DetailCard
                  label="Course"
                  value={result.certificate.stream || result.certificate.branch
                    ? `${result.certificate.courseName} (${result.certificate.stream || result.certificate.branch})`
                    : result.certificate.courseName}
                />
                <DetailCard label="Stream" value={result.certificate.stream || result.certificate.branch || 'Not available'} />
                <DetailCard label="Date of Birth" value={result.certificate.dateOfBirth ? new Date(result.certificate.dateOfBirth).toLocaleDateString('en-IN') : 'Not available'} />
                <DetailCard label="Final Score" value={result.certificate.finalScore !== null ? `${result.certificate.finalScore.toFixed(2)} / 5` : 'Not available'} />
                <DetailCard label="Grade" value={result.certificate.grade} />
                <DetailCard label="Grade Category" value={result.certificate.gradeCategory || 'Not available'} />
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 text-center">
          <Link href="/" className="text-sm text-gray-500 transition hover:text-purple-600" style={poppins}>
            Back to Sprintern
          </Link>
        </div>
      </div>
    </div>
  )
}

function DetailCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-gray-50 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-gray-400" style={poppins}>{label}</p>
      <p className="mt-2 text-sm font-semibold text-gray-900" style={poppins}>{value}</p>
    </div>
  )
}
