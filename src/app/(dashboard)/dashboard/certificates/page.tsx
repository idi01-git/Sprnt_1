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
    return <div className="flex h-72 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-purple-600" /></div>
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900" style={{ ...outfit, fontWeight: 800 }}>My Certificates</h1>
        <p className="mt-2 text-sm text-gray-500" style={poppins}>
          Download your issued certificates and verify their current status.
        </p>
      </div>

      {certificates.length === 0 ? (
        <div className="rounded-3xl border border-gray-100 bg-white p-12 text-center shadow-sm">
          <Award className="mx-auto mb-4 h-10 w-10 text-gray-300" />
          <p className="text-sm text-gray-500" style={poppins}>No certificates issued yet.</p>
          <div className="mt-6">
            <Link
              href="/verify"
              className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 px-4 py-2.5 text-sm text-gray-700 transition hover:border-purple-200 hover:text-purple-600"
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
              <div key={certificate.id} className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-400" style={poppins}>Certificate ID</p>
                  <p className="mt-2 text-lg font-semibold text-gray-900" style={outfit}>{certificate.certificateId}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${certificate.isRevoked ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`} style={poppins}>
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
                <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" style={poppins}>
                  <div className="flex items-center gap-2 font-semibold">
                    <Ban className="h-4 w-4" />
                    Revoked
                  </div>
                  <p className="mt-2">{certificate.revocationReason}</p>
                </div>
              )}

              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href={`/verify/${certificate.certificateId}`}
                  className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 px-4 py-2.5 text-sm text-gray-700 transition hover:border-purple-200 hover:text-purple-600"
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
                    className="inline-flex items-center gap-2 rounded-2xl bg-linear-to-r from-purple-600 to-blue-600 px-4 py-2.5 text-sm text-white transition hover:shadow-lg"
                    style={{ ...poppins, fontWeight: 600 }}
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
              className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 px-4 py-2.5 text-sm text-gray-700 transition hover:border-purple-200 hover:text-purple-600"
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
    <div className="rounded-2xl bg-gray-50 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-gray-400" style={poppins}>{label}</p>
      <p className="mt-2 text-sm font-semibold text-gray-900" style={poppins}>{value}</p>
    </div>
  )
}
