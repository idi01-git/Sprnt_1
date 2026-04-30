'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Award, Ban, Download, Loader2, ShieldCheck } from 'lucide-react'
import { UserCertificate, getUserCertificates } from '@/lib/api'

const poppins: React.CSSProperties = { fontFamily: "'Poppins', sans-serif" }
const outfit: React.CSSProperties = { fontFamily: "'Outfit', sans-serif" }

export default function DashboardCertificatesPage() {
  const [certificates, setCertificates] = useState<UserCertificate[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadCertificates() {
      setLoading(true)
      try {
        const response = await getUserCertificates()
        if (response.success && response.data) {
          setCertificates(response.data.certificates)
        }
      } finally {
        setLoading(false)
      }
    }

    void loadCertificates()
  }, [])

  if (loading) {
    return (
      <div className="flex h-72 items-center justify-center">
        <div className="w-12 h-12 rounded-2xl bg-neo-yellow border-3 border-neo-black flex items-center justify-center animate-neo-bounce" style={{boxShadow:'3px 3px 0 #1a1a2e'}}>
          <Loader2 className="h-6 w-6 animate-spin text-neo-black" />
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-neo-black" style={{ ...outfit, fontWeight: 800 }}>My Certificates</h1>
        <p className="mt-2 text-sm text-neo-black/60 font-semibold" style={poppins}>
          Download your issued certificates and verify their current status.
        </p>
      </div>

      {certificates.length === 0 ? (
        <div className="neo-card-static p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-neo-lavender border-3 border-neo-black flex items-center justify-center mx-auto mb-4" style={{boxShadow:'3px 3px 0 #1a1a2e'}}>
            <Award className="h-8 w-8 text-neo-black" />
          </div>
          <p className="text-sm text-neo-black/50 font-bold" style={poppins}>No certificates issued yet.</p>
          <div className="mt-6">
            <Link
              href="/verify"
              className="neo-btn neo-btn-blue inline-flex items-center gap-2 px-4 py-2.5 text-sm"
              style={poppins}
            >
              <ShieldCheck className="h-4 w-4" />
              Verify Certificate
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-5 lg:grid-cols-2">
            {certificates.map((certificate) => (
              <div key={certificate.id} className="neo-card-static p-6">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-neo-black/40 font-bold" style={poppins}>Certificate ID</p>
                  <p className="mt-2 text-lg font-extrabold text-neo-black" style={outfit}>{certificate.certificateId}</p>
                </div>
                <span className={`neo-badge ${certificate.isRevoked ? 'bg-neo-coral' : 'bg-neo-green'}`} style={poppins}>
                  {certificate.isRevoked ? 'Revoked' : 'Issued'}
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <InfoItem label="Name" value={certificate.studentName} />
                <InfoItem label="College" value={certificate.collegeName} />
                <InfoItem label="Course" value={certificate.courseName} />
                <InfoItem label="Stream" value={certificate.branch || 'Not available'} />
                <InfoItem label="Date of Birth" value={certificate.dateOfBirth ? new Date(certificate.dateOfBirth).toLocaleDateString('en-IN') : 'Not available'} />
                <InfoItem label="Final Score" value={certificate.finalScore !== null ? `${certificate.finalScore.toFixed(2)} / 5` : 'Not available'} />
                <InfoItem label="Grade" value={certificate.grade} />
                <InfoItem label="Issued On" value={new Date(certificate.issuedAt).toLocaleDateString('en-IN')} />
              </div>

              {certificate.isRevoked && certificate.revocationReason && (
                <div className="mt-4 rounded-2xl bg-neo-coral px-4 py-3 text-sm text-neo-black border-2 border-neo-black" style={poppins}>
                  <div className="flex items-center gap-2 font-extrabold">
                    <Ban className="h-4 w-4" />
                    Revoked
                  </div>
                  <p className="mt-2 font-semibold">{certificate.revocationReason}</p>
                </div>
              )}

              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href={`/verify/${certificate.certificateId}`}
                  className="neo-btn bg-neo-sky inline-flex items-center gap-2 px-4 py-2.5 text-sm"
                  style={poppins}
                >
                  <ShieldCheck className="h-4 w-4" />
                  Verify
                </Link>
                {certificate.certificatePdfUrl && (
                  <a
                    href={certificate.certificatePdfUrl}
                    download
                    target="_blank"
                    rel="noreferrer"
                    className="neo-btn neo-btn-primary inline-flex items-center gap-2 px-4 py-2.5 text-sm"
                    style={{ ...poppins, fontWeight: 700 }}
                  >
                    <Download className="h-4 w-4" />
                    Download PDF
                  </a>
                )}
              </div>
              </div>
            ))}
          </div>
          <div className="mt-8 flex justify-center">
            <Link
              href="/verify"
              className="neo-btn neo-btn-blue inline-flex items-center gap-2 px-4 py-2.5 text-sm"
              style={poppins}
            >
              <ShieldCheck className="h-4 w-4" />
              Verify Certificate
            </Link>
          </div>
        </>
      )}
    </div>
  )
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-neo-cream p-4 border-2 border-neo-black">
      <p className="text-xs uppercase tracking-[0.2em] text-neo-black/40 font-bold" style={poppins}>{label}</p>
      <p className="mt-2 text-sm font-extrabold text-neo-black" style={poppins}>{value}</p>
    </div>
  )
}
