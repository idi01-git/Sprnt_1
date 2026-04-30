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

const branchColors: Record<string, { bg: string; border: string }> = {
  Chemical: { bg: 'bg-neo-pink', border: 'border-neo-pink' },
  Civil: { bg: 'bg-neo-green', border: 'border-neo-green' },
  Mechanical: { bg: 'bg-neo-purple', border: 'border-neo-purple' },
  Electrical: { bg: 'bg-neo-blue', border: 'border-neo-blue' },
  ECE: { bg: 'bg-neo-coral', border: 'border-neo-coral' },
  CS_IT: { bg: 'bg-neo-yellow', border: 'border-neo-yellow' },
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
              <div className="mb-2 h-9 w-52 rounded-lg bg-neo-yellow/50 border-2 border-neo-black" />
              <div className="h-4 w-36 rounded bg-neo-peach/50 border-2 border-neo-black" />
            </div>
            <div className="flex gap-2">
              {[...Array(3)].map((_, index) => <div key={index} className="h-9 w-24 rounded-xl bg-neo-mint/50 border-2 border-neo-black" />)}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="rounded-2xl border-3 border-neo-black bg-white p-5" style={{boxShadow:'5px 5px 0 #1a1a2e'}}>
                <div className="mb-4 h-12 w-12 rounded-xl bg-neo-yellow/50 border-2 border-neo-black" />
                <div className="mb-2 h-5 w-3/4 rounded bg-neo-lavender/50" />
                <div className="mb-4 h-3.5 w-1/2 rounded bg-neo-sky/50" />
                <div className="mb-2 h-4 rounded-full bg-neo-cream border-2 border-neo-black" />
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
        <div className="neo-card-static flex max-w-md flex-col items-center gap-4 text-center p-8">
          <div className="w-16 h-16 rounded-2xl bg-neo-coral border-3 border-neo-black flex items-center justify-center" style={{boxShadow:'3px 3px 0 #1a1a2e'}}>
            <AlertCircle className="h-8 w-8 text-neo-black" />
          </div>
          <h2 className="text-2xl font-extrabold text-neo-black" style={{ ...outfit, fontWeight: 800 }}>
            {error.includes('log in') ? 'Login Required' : 'Error'}
          </h2>
          <p className="text-neo-black/70 font-medium" style={{ ...poppins, fontSize: '15px' }}>{error}</p>
          <Link
            href="/dashboard"
            className="neo-btn neo-btn-primary px-6 py-3"
            style={{ ...poppins, fontWeight: 700 }}
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
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-neo-lavender border-3 border-neo-black" style={{boxShadow:'5px 5px 0 #1a1a2e'}}>
            <BookOpen className="h-10 w-10 text-neo-black" />
          </div>
          <h2 className="mb-3 text-3xl font-extrabold text-neo-black" style={{ ...outfit, fontWeight: 800 }}>
            No courses yet
          </h2>
          <p className="mb-8 text-neo-black/70 font-medium" style={{ ...poppins, fontSize: '16px' }}>
            Browse the catalog and enroll in your first course to get started.
          </p>
          <Link
            href="/dashboard"
            className="neo-btn neo-btn-primary inline-flex items-center gap-2 px-8 py-4"
            style={{ ...poppins, fontWeight: 700 }}
          >
            <Sparkles className="h-5 w-5" /> EXPLORE COURSES
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-6 pb-16 pt-24">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-extrabold text-neo-black md:text-4xl" style={{ ...outfit, fontWeight: 800 }}>
            My Learning
          </h1>
          <p className="text-neo-black/70 font-medium" style={{ ...poppins, fontSize: '15px' }}>
            Track your progress across all enrolled courses.
          </p>
        </div>

        <div className="mb-8 flex gap-3">
          {(['all', 'in_progress', 'completed'] as const).map((nextTab) => {
            const isActive = tab === nextTab
            const colors = nextTab === 'all' ? 'bg-neo-yellow' : nextTab === 'in_progress' ? 'bg-neo-blue' : 'bg-neo-green'
            return (
              <button
                key={nextTab}
                onClick={() => setTab(nextTab)}
                className={`neo-tab ${isActive ? `neo-tab-active ${colors}` : 'bg-white'}`}
                style={{ ...poppins, fontWeight: 700 }}
              >
                {nextTab === 'all' ? 'All Courses' : nextTab === 'in_progress' ? 'In Progress' : 'Completed'}
              </button>
            )
          })}
        </div>

        <div className="grid gap-6">
          {filtered.map((enrollment) => {
            const colors = branchColors[enrollment.affiliatedBranch] || { bg: 'bg-neo-orange', border: 'border-neo-orange' }
            const progress = Math.round((enrollment.daysCompleted / enrollment.totalDays) * 100)

            return (
              <div
                key={enrollment.id}
                className="neo-card overflow-hidden"
              >
                <div className="flex flex-col md:flex-row">
                  <div className={`w-full shrink-0 md:w-3 ${colors.bg}`} />

                  <div className="flex-1 p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex-1">
                        <span
                          className={`neo-badge mb-2 ${colors.bg}`}
                          style={{ ...poppins }}
                        >
                          {enrollment.affiliatedBranch}
                        </span>

                        <h3 className="mb-2 text-xl font-extrabold text-neo-black" style={{ ...outfit, fontWeight: 800 }}>
                          {enrollment.courseName}
                        </h3>

                        <div className="mb-4 flex flex-wrap gap-4 text-sm text-neo-black/70 font-semibold" style={poppins}>
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

                        <div className="neo-progress mb-1 w-full max-w-md">
                          <div className={`neo-progress-bar ${colors.bg}`} style={{ width: `${progress}%` }} />
                        </div>
                        <p className="text-xs text-neo-black/60 font-bold" style={poppins}>{progress}% complete</p>
                      </div>

                      <div className="flex flex-col gap-2">
                        <div className="rounded-xl border-2 border-neo-black bg-neo-cream px-4 py-2.5">
                          <p className="mb-0.5 text-xs text-neo-black/60 font-bold" style={poppins}>Enrollment ID</p>
                          <p className="truncate text-sm font-extrabold text-neo-black" style={poppins} title={enrollment.id}>
                            {enrollment.id}
                          </p>
                        </div>

                        {enrollment.certificateIssued ? (
                          <span className="neo-badge bg-neo-green gap-1.5 px-4 py-2.5 text-sm" style={{ ...poppins, fontWeight: 700 }}>
                            <Award className="h-4 w-4" /> Certified
                          </span>
                        ) : enrollment.status === 'completed' ? (
                          <span className="neo-badge bg-neo-sky gap-1.5 px-4 py-2.5 text-sm" style={{ ...poppins, fontWeight: 700 }}>
                            <CheckCircle2 className="h-4 w-4" /> Completed
                          </span>
                        ) : null}

                        {enrollment.certificateIssued && enrollment.certificateId && (
                          <div className="rounded-xl border-2 border-neo-black bg-neo-cream px-4 py-2.5">
                            <p className="mb-0.5 text-xs text-neo-black/60 font-bold" style={poppins}>Certificate ID</p>
                            <p className="truncate text-sm font-extrabold text-neo-black" style={poppins} title={enrollment.certificateId}>
                              {enrollment.certificateId}
                            </p>
                          </div>
                        )}

                        <Link
                          href={`/learn/${enrollment.id}/day/${enrollment.currentDay}`}
                          className="neo-btn neo-btn-primary inline-flex items-center gap-2 px-5 py-2.5 text-sm"
                          style={{ ...poppins, fontWeight: 700 }}
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
