'use client'

import { FormEvent, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertCircle, BadgeCheck, Ban, Loader2, Search, ArrowLeft, ShieldCheck } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'

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
        setError(payload?.error?.message || 'Certificate not found. Please check the ID and try again.')
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
    ? 'border-[#1a1a2e] bg-[#FF6B6B] text-[#1a1a2e]'
    : 'border-[#1a1a2e] bg-[#95E77E] text-[#1a1a2e]'

  return (
    <div className="min-h-screen bg-[#E0F7FF]">
      <Navbar />
      <div className="px-4 py-32 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <div 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl mb-6 bg-[#B084FF] border-[3px] border-[#1a1a2e]"
              style={{ boxShadow: '4px 4px 0 #1a1a2e' }}
            >
              <ShieldCheck className="w-5 h-5 text-[#1a1a2e]" />
              <span style={{ ...poppins, fontWeight: 800, fontSize: '12px', letterSpacing: '0.1em', color: '#1a1a2e' }}>
                TRUST & VERIFICATION
              </span>
            </div>
            
            <h1 className="text-4xl font-black text-[#1a1a2e] sm:text-6xl mb-4" style={{ ...outfit, lineHeight: '1' }}>
              Verify Credentials
            </h1>
            <p className="mx-auto max-w-2xl text-lg font-bold text-[#1a1a2e] opacity-70" style={poppins}>
              Enter a certificate ID (e.g. <span className="text-[#FF6B9D]">CERT-ABCD-XYZA</span>) to confirm its authenticity.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mx-auto mb-12 max-w-2xl">
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="relative flex-1 group">
                <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-[60%] text-[#1a1a2e]" strokeWidth={3} />
                <input
                  value={certificateId}
                  onChange={(event) => setCertificateId(event.target.value.toUpperCase())}
                  placeholder="ENTER CERTIFICATE ID"
                  className="neo-input w-full py-4 !pl-14 pr-4 bg-white font-extrabold uppercase"
                  style={poppins}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="neo-btn neo-btn-primary px-10 py-4 flex items-center justify-center gap-2 min-w-[140px]"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'VERIFY'}
              </button>
            </div>
          </form>

          {loading && (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-[#1a1a2e]" />
              <p className="font-bold text-[#1a1a2e]" style={poppins}>SCRUTINIZING RECORDS...</p>
            </div>
          )}

          {!loading && error && (
            <div className="rounded-3xl border-[3px] border-[#1a1a2e] bg-[#FF6B6B] p-8 text-center animate-scale-up" style={{ boxShadow: '8px 8px 0 #1a1a2e' }}>
              <AlertCircle className="mx-auto mb-4 h-12 w-12 text-[#1a1a2e]" />
              <p className="text-xl font-black text-[#1a1a2e]" style={outfit}>{error}</p>
            </div>
          )}

          {!loading && result && (
            <div className="space-y-8 animate-scale-up">
              <div className={`rounded-3xl border-[3px] p-6 ${statusTone}`} style={{ boxShadow: '8px 8px 0 #1a1a2e' }}>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-white border-[3px] border-[#1a1a2e] flex items-center justify-center shrink-0">
                     {result.status === 'revoked' ? <Ban className="h-8 w-8 text-[#FF6B6B]" /> : <BadgeCheck className="h-8 w-8 text-[#95E77E]" />}
                  </div>
                  <div>
                    <p className="text-2xl font-black uppercase tracking-tight" style={outfit}>
                      {result.status === 'revoked' ? 'CERTIFICATE REVOKED' : 'CERTIFICATE VALIDATED'}
                    </p>
                    <p className="font-bold opacity-80" style={poppins}>
                      {result.status === 'revoked' 
                        ? (result.certificate.revocationReason || 'This record has been officially withdrawn.') 
                        : 'This document is authentic and issued by Sprintern.'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border-[3px] border-[#1a1a2e] bg-white p-8 overflow-hidden relative" style={{ boxShadow: '12px 12px 0 #1a1a2e' }}>
                {/* Decorative watermark */}
                <ShieldCheck className="absolute -right-8 -bottom-8 w-48 h-48 text-[#1a1a2e] opacity-[0.03] rotate-12" />

                <div className="mb-8 flex flex-wrap items-center justify-between gap-6 relative z-10">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-[#1a1a2e] opacity-40" style={poppins}>REGISTRATION ID</p>
                    <p className="mt-1 text-3xl font-black text-[#1a1a2e]" style={outfit}>{result.certificate.certificateId}</p>
                  </div>
                  <div className="bg-[#A8E6FF] border-[3px] border-[#1a1a2e] px-6 py-2 rounded-xl font-black text-[#1a1a2e]" style={{ boxShadow: '4px 4px 0 #1a1a2e', ...poppins }}>
                    ISSUED: {new Date(result.certificate.issuedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase()}
                  </div>
                </div>

                <div className="grid gap-6 sm:grid-cols-2 relative z-10">
                  <DetailCard label="Full Name" value={result.certificate.studentName} bg="#A8E6FF" />
                  <DetailCard label="Institution" value={result.certificate.collegeName} bg="#A8E6FF" />
                  <DetailCard
                    label="Learning Track"
                    value={result.certificate.stream || result.certificate.branch
                      ? `${result.certificate.courseName} (${result.certificate.stream || result.certificate.branch})`
                      : result.certificate.courseName}
                    bg="#FFD4B8"
                  />
                  <DetailCard label="Branch/Stream" value={result.certificate.stream || result.certificate.branch || 'GENERAL'} bg="#B8F0D8" />
                  <DetailCard label="Date of Birth" value={result.certificate.dateOfBirth ? new Date(result.certificate.dateOfBirth).toLocaleDateString('en-IN') : 'N/A'} bg="#FFB347" />
                  <DetailCard label="Performance Score" value={result.certificate.finalScore !== null ? `${result.certificate.finalScore.toFixed(2)} / 5.0` : 'N/A'} bg="#95E77E" />
                  <DetailCard label="Awarded Grade" value={result.certificate.grade} bg="#FF6B9D" />
                  <DetailCard label="Grade Category" value={result.certificate.gradeCategory || 'N/A'} bg="#B084FF" />
                </div>
              </div>
            </div>
          )}

          <div className="mt-12 text-center">
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 font-black text-[#1a1a2e] hover:text-[#FF6B9D] transition-colors uppercase tracking-widest text-sm" 
              style={poppins}
            >
              <ArrowLeft className="w-4 h-4" />
              Return to HQ
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function DetailCard({ label, value, bg }: { label: string; value: string; bg: string }) {
  return (
    <div className="rounded-2xl border-[3px] border-[#1a1a2e] p-5 group transition-all hover:translate-x-[-2px] hover:translate-y-[-2px]" style={{ background: bg, boxShadow: '4px 4px 0 #1a1a2e' }}>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1a1a2e] opacity-50 mb-1" style={poppins}>{label}</p>
      <p className="text-base font-black text-[#1a1a2e] truncate" style={poppins}>{value.toUpperCase()}</p>
    </div>
  )
}
