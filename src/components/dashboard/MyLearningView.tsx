'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  AlertCircle,
  ArrowRight,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import { Enrollment, getEnrollments } from '@/lib/api'

const poppins: React.CSSProperties = { fontFamily: "'Poppins', sans-serif" }
const outfit: React.CSSProperties = { fontFamily: "'Outfit', sans-serif" }

const branchGradients: Record<string, string> = {
  Chemical: 'from-pink-500 to-rose-500',
  Civil: 'from-emerald-500 to-teal-500',
  Mechanical: 'from-purple-500 to-indigo-500',
  Electrical: 'from-blue-500 to-cyan-500',
  ECE: 'from-red-500 to-pink-500',
  CS_IT: 'from-green-500 to-emerald-500',
}

export function MyLearningView() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<'all' | 'in_progress' | 'completed'>('all')

  useEffect(() => {
    async function fetchEnrollments() {
      setLoading(true)
      setError(null)
      try {
        const response = await getEnrollments({ limit: 50 })
        if (response.success && response.data) {
          setEnrollments(response.data.enrollments)
          return
        }

        if (response.error?.message?.includes('log in') || response.error?.code === 'AUTH_SESSION_EXPIRED') {
          setError('Please log in to view your dashboard.')
        } else {
          setError(response.error?.message || 'Failed to load enrollments')
        }
      } catch (loadError: any) {
        setError(loadError.message || 'Something went wrong')
      } finally {
        setLoading(false)
      }
    }

    void fetchEnrollments()
  }, [])

  const filtered = tab === 'all' ? enrollments : enrollments.filter((enrollment) => enrollment.status === tab)

  if (loading) {
    return (
      <div className="min-h-screen px-6 pb-16 pt-24">
        <div className="mx-auto max-w-6xl animate-pulse">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-2 h-9 w-52 rounded-lg bg-gray-200" />
              <div className="h-4 w-36 rounded bg-gray-100" />
            </div>
            <div className="flex gap-2">
              {[...Array(3)].map((_, index) => <div key={index} className="h-9 w-24 rounded-xl bg-gray-100" />)}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="mb-4 h-12 w-12 rounded-xl bg-gray-200" />
                <div className="mb-2 h-5 w-3/4 rounded bg-gray-200" />
                <div className="mb-4 h-3.5 w-1/2 rounded bg-gray-100" />
                <div className="mb-2 h-2 rounded-full bg-gray-100" />
                <div className="flex justify-between">
                  <div className="h-3 w-16 rounded bg-gray-100" />
                  <div className="h-3 w-20 rounded bg-gray-100" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center pt-24">
        <div className="flex max-w-md flex-col items-center gap-4 text-center">
          <AlertCircle className="h-12 w-12 text-red-400" />
          <h2 className="text-2xl font-bold text-gray-900" style={{ ...outfit, fontWeight: 800 }}>
            {error.includes('log in') ? 'Login Required' : 'Error'}
          </h2>
          <p className="text-gray-500" style={{ ...poppins, fontSize: '15px' }}>{error}</p>
          <Link
            href="/dashboard"
            className="rounded-xl bg-linear-to-r from-purple-600 to-blue-600 px-6 py-3 text-white transition-all hover:shadow-lg"
            style={{ ...poppins, fontWeight: 600 }}
          >
            Back to Explore
          </Link>
        </div>
      </div>
    )
  }

  if (enrollments.length === 0) {
    return (
      <div className="min-h-screen px-6 pt-24">
        <div className="mx-auto max-w-4xl py-20 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-purple-100">
            <BookOpen className="h-10 w-10 text-purple-600" />
          </div>
          <h2 className="mb-3 text-3xl font-bold text-gray-900" style={{ ...outfit, fontWeight: 800 }}>
            No courses yet
          </h2>
          <p className="mb-8 text-gray-500" style={{ ...poppins, fontSize: '16px' }}>
            Browse the catalog and enroll in your first course to get started.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-purple-600 to-blue-600 px-8 py-4 text-white transition-all hover:shadow-lg"
            style={{ ...poppins, fontWeight: 600 }}
          >
            <Sparkles className="h-5 w-5" /> Explore Courses
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-6 pb-16 pt-24">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-gray-900 md:text-4xl" style={{ ...outfit, fontWeight: 800 }}>
            My Learning
          </h1>
          <p className="text-gray-500" style={{ ...poppins, fontSize: '15px' }}>
            Track your progress across all enrolled courses.
          </p>
        </div>

        <div className="mb-8 flex gap-2">
          {(['all', 'in_progress', 'completed'] as const).map((nextTab) => (
            <button
              key={nextTab}
              onClick={() => setTab(nextTab)}
              className={`rounded-xl px-5 py-2.5 text-sm transition-all ${
                tab === nextTab
                  ? 'bg-linear-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/30'
                  : 'border border-gray-200 bg-white text-gray-600 hover:border-purple-200'
              }`}
              style={{ ...poppins, fontWeight: 600 }}
            >
              {nextTab === 'all' ? 'All Courses' : nextTab === 'in_progress' ? 'In Progress' : 'Completed'}
            </button>
          ))}
        </div>

        <div className="grid gap-6">
          {filtered.map((enrollment) => {
            const gradient = branchGradients[enrollment.affiliatedBranch] || 'from-gray-500 to-slate-500'
            const progress = Math.round((enrollment.daysCompleted / enrollment.totalDays) * 100)

            return (
              <div
                key={enrollment.id}
                className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all hover:shadow-md"
              >
                <div className="flex flex-col md:flex-row">
                  <div className={`w-full shrink-0 bg-linear-to-b md:w-2 ${gradient}`} />

                  <div className="flex-1 p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex-1">
                        <span
                          className="mb-2 inline-block rounded-full bg-purple-50 px-3 py-1 text-xs text-purple-700"
                          style={{ ...poppins, fontWeight: 600 }}
                        >
                          {enrollment.affiliatedBranch}
                        </span>

                        <h3 className="mb-2 text-xl font-bold text-gray-900" style={{ ...outfit, fontWeight: 700 }}>
                          {enrollment.courseName}
                        </h3>

                        <div className="mb-4 flex flex-wrap gap-4 text-sm text-gray-500" style={poppins}>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Enrolled {new Date(enrollment.enrolledAt).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            Day {enrollment.currentDay} of {enrollment.totalDays}
                          </span>
                          <span className="flex items-center gap-1">
                            <TrendingUp className="h-4 w-4" />
                            {enrollment.daysCompleted}/{enrollment.totalDays} quizzes passed
                          </span>
                        </div>

                        <div className="mb-1 h-2.5 w-full max-w-md rounded-full bg-gray-100">
                          <div className={`h-full rounded-full bg-linear-to-r ${gradient}`} style={{ width: `${progress}%` }} />
                        </div>
                        <p className="text-xs text-gray-400" style={poppins}>{progress}% complete</p>
                      </div>

                      <div className="flex flex-col gap-2">
                        <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5">
                          <p className="mb-0.5 text-xs text-gray-500" style={poppins}>Enrollment ID</p>
                          <p className="truncate text-sm font-bold text-gray-800" style={poppins} title={enrollment.id}>
                            {enrollment.id}
                          </p>
                        </div>

                        {enrollment.certificateIssued ? (
                          <span className="inline-flex items-center gap-1.5 rounded-xl bg-green-50 px-4 py-2.5 text-sm text-green-700" style={{ ...poppins, fontWeight: 600 }}>
                            <Award className="h-4 w-4" /> Certified
                          </span>
                        ) : enrollment.status === 'completed' ? (
                          <span className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 px-4 py-2.5 text-sm text-blue-700" style={{ ...poppins, fontWeight: 600 }}>
                            <CheckCircle2 className="h-4 w-4" /> Completed
                          </span>
                        ) : null}

                        {enrollment.certificateIssued && enrollment.certificateId && (
                          <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5">
                            <p className="mb-0.5 text-xs text-gray-500" style={poppins}>Certificate ID</p>
                            <p className="truncate text-sm font-bold text-gray-800" style={poppins} title={enrollment.certificateId}>
                              {enrollment.certificateId}
                            </p>
                          </div>
                        )}

                        <Link
                          href={`/learn/${enrollment.id}/day/${enrollment.currentDay}`}
                          className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-purple-600 to-blue-600 px-5 py-2.5 text-sm text-white transition-all hover:shadow-lg"
                          style={{ ...poppins, fontWeight: 600 }}
                        >
                          Continue <ArrowRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
