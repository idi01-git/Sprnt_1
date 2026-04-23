'use client';

export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Award, Ban, FileText, Loader2, Search, ShieldCheck } from 'lucide-react';
import { AdminCertificate, getAdminCertificates } from '@/lib/api';

const poppins: React.CSSProperties = { fontFamily: "'Poppins', sans-serif" };
const outfit: React.CSSProperties = { fontFamily: "'Outfit', sans-serif" };

type StatusFilter = 'all' | 'valid' | 'revoked';

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function AdminCertificatesPage() {
  const [certificates, setCertificates] = useState<AdminCertificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');

  useEffect(() => {
    const timeout = setTimeout(() => {
      void fetchCertificates();
    }, 250);

    return () => clearTimeout(timeout);
  }, [search, status]);

  async function fetchCertificates() {
    setLoading(true);
    setError(null);
    try {
      const response = await getAdminCertificates({ search: search || undefined, status });
      if (!response.success || !response.data) {
        setCertificates([]);
        setError(response.error?.message || 'Failed to load certificates');
        return;
      }
      setCertificates(Array.isArray(response.data.certificates) ? response.data.certificates : []);
    } catch (loadError) {
      console.error(loadError);
      setCertificates([]);
      setError('Failed to load certificates');
    } finally {
      setLoading(false);
    }
  }

  const counts = useMemo(() => ({
    total: certificates.length,
    valid: certificates.filter((certificate) => !certificate.isRevoked).length,
    revoked: certificates.filter((certificate) => certificate.isRevoked).length,
  }), [certificates]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900" style={{ ...outfit, fontWeight: 800 }}>Certificates</h1>
          <p className="mt-1 text-sm text-gray-500" style={poppins}>All certificate records, including revoked certificates and linked verification history.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="rounded-2xl bg-purple-50 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.18em] text-purple-500" style={poppins}>Total</p>
            <p className="mt-1 text-lg font-bold text-purple-700" style={{ ...outfit, fontWeight: 800 }}>{counts.total}</p>
          </div>
          <div className="rounded-2xl bg-green-50 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.18em] text-green-500" style={poppins}>Valid</p>
            <p className="mt-1 text-lg font-bold text-green-700" style={{ ...outfit, fontWeight: 800 }}>{counts.valid}</p>
          </div>
          <div className="rounded-2xl bg-red-50 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.18em] text-red-500" style={poppins}>Revoked</p>
            <p className="mt-1 text-lg font-bold text-red-700" style={{ ...outfit, fontWeight: 800 }}>{counts.revoked}</p>
          </div>
        </div>
      </div>

      <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by certificate ID, student, email, college, or course..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-4 outline-none focus:ring-2 focus:ring-purple-500"
              style={poppins}
            />
          </div>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as StatusFilter)}
            className="rounded-xl border border-gray-200 px-4 py-2.5 outline-none focus:ring-2 focus:ring-purple-500"
            style={poppins}
          >
            <option value="all">All certificates</option>
            <option value="valid">Valid only</option>
            <option value="revoked">Revoked only</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          </div>
        ) : error ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3 px-6 text-center">
            <AlertCircle className="h-10 w-10 text-red-400" />
            <p className="text-sm text-gray-600" style={poppins}>{error}</p>
          </div>
        ) : certificates.length === 0 ? (
          <div className="py-16 text-center">
            <FileText className="mx-auto mb-3 h-12 w-12 text-gray-300" />
            <p className="text-gray-400" style={poppins}>No certificates matched this filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-100 bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600" style={poppins}>Certificate ID</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600" style={poppins}>Student</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600" style={poppins}>Course</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600" style={poppins}>College</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600" style={poppins}>Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600" style={poppins}>Grade</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600" style={poppins}>Issue Date</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600" style={poppins}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {certificates.map((certificate) => (
                  <tr key={certificate.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm text-purple-600" style={poppins}>{certificate.certificateId}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-gray-900" style={poppins}>{certificate.studentName}</p>
                        <p className="text-xs text-gray-500" style={poppins}>{certificate.studentEmail}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-900" style={poppins}>{certificate.courseName}</p>
                      <p className="text-xs text-gray-400" style={poppins}>{certificate.courseId}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-600" style={poppins}>
                      <p>{certificate.collegeName}</p>
                      <p className="text-xs text-gray-400">{certificate.branch || 'No branch'}</p>
                    </td>
                    <td className="px-6 py-4">
                      {certificate.isRevoked ? (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700" style={poppins}>
                            <Ban className="h-3.5 w-3.5" /> Revoked
                          </span>
                          <p className="max-w-xs text-xs text-red-500" style={poppins}>{certificate.revocationReason || 'Revocation note not provided'}</p>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700" style={poppins}>
                          <ShieldCheck className="h-3.5 w-3.5" /> Valid
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-600" style={poppins}>{certificate.grade}</td>
                    <td className="px-6 py-4 text-gray-600" style={poppins}>{formatDate(certificate.issueDate)}</td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/certificates/${certificate.certificateId}`}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-purple-50 px-3 py-1.5 text-sm font-medium text-purple-700 transition-colors hover:bg-purple-100"
                        style={poppins}
                      >
                        {certificate.isRevoked ? <Ban className="h-3.5 w-3.5" /> : <Award className="h-3.5 w-3.5" />}
                        View Record
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
