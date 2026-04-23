'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Loader2,
  Eye,
  FileCheck,
} from 'lucide-react';
import { getAdminSubmissions, getAdminSubmissionStats, AdminSubmission, SubmissionStats } from '@/lib/api';

const poppins: React.CSSProperties = { fontFamily: "'Poppins', sans-serif" };
const outfit: React.CSSProperties = { fontFamily: "'Outfit', sans-serif" };

export default function AdminSubmissionsPage() {
  const [submissions, setSubmissions] = useState<AdminSubmission[]>([]);
  const [stats, setStats] = useState<SubmissionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'pending' | 'under_review' | 'approved' | 'rejected' | ''>('');

  useEffect(() => {
    void fetchData();
  }, [statusFilter]);

  async function fetchData() {
    setLoading(true);
    try {
      const [submissionsResponse, statsResponse] = await Promise.all([
        getAdminSubmissions({ status: statusFilter || undefined, limit: 50 }),
        getAdminSubmissionStats(),
      ]);

      if (submissionsResponse.success && submissionsResponse.data) {
        setSubmissions(submissionsResponse.data.submissions);
      }
      if (statsResponse.success && statsResponse.data) {
        setStats(statsResponse.data.stats);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  const statusTabs = [
    { value: '', label: 'All', count: (stats?.pending || 0) + (stats?.underReview || 0) + (stats?.approvedToday || 0) },
    { value: 'pending', label: 'Pending', count: stats?.pending || 0 },
    { value: 'under_review', label: 'Under Review', count: stats?.underReview || 0 },
    { value: 'approved', label: 'Approved', count: stats?.approvedToday || 0 },
    { value: 'rejected', label: 'Rejected', count: stats?.rejectedToday || 0 },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900" style={{ ...outfit, fontWeight: 800 }}>Submissions</h1>
        <p className="mt-1 text-gray-500" style={{ ...poppins, fontSize: '14px' }}>Review and manage project submissions</p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {statusTabs.slice(1).map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value as typeof statusFilter)}
            className={`rounded-xl border bg-white p-4 shadow-sm transition-all ${
              statusFilter === tab.value ? 'border-purple-500 ring-2 ring-purple-100' : 'border-gray-100'
            }`}
          >
            <p className="text-2xl font-bold text-gray-900" style={{ ...outfit, fontWeight: 800 }}>{tab.count}</p>
            <p className="text-sm text-gray-500" style={poppins}>{tab.label}</p>
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          </div>
        ) : submissions.length === 0 ? (
          <div className="py-12 text-center">
            <FileCheck className="mx-auto mb-4 h-12 w-12 text-gray-300" />
            <p className="text-gray-400" style={poppins}>No submissions found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {submissions.map((submission) => (
              <div key={submission.id} className="flex items-center justify-between p-6 hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                    submission.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-600'
                      : submission.status === 'approved'
                        ? 'bg-green-100 text-green-600'
                        : submission.status === 'rejected'
                          ? 'bg-red-100 text-red-600'
                          : 'bg-blue-100 text-blue-600'
                  }`}>
                    <FileCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900" style={poppins}>{submission.userName}</p>
                    <p className="text-sm text-gray-500" style={poppins}>{submission.courseName}</p>
                    <p className="text-xs text-gray-400" style={poppins}>{submission.userEmail}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      submission.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-700'
                        : submission.status === 'approved'
                          ? 'bg-green-100 text-green-700'
                          : submission.status === 'rejected'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-blue-100 text-blue-700'
                    }`}
                    style={poppins}
                  >
                    {submission.status.replace('_', ' ')}
                  </span>
                  <Link
                    href={`/admin/submissions/${submission.id}`}
                    className="inline-flex items-center gap-2 rounded-lg bg-purple-50 px-3 py-2 text-sm text-purple-700 hover:bg-purple-100"
                    style={{ ...poppins, fontWeight: 600 }}
                  >
                    <Eye className="h-4 w-4" />
                    {submission.status === 'approved' || submission.status === 'rejected' ? 'View Record' : 'Process Submission'}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
