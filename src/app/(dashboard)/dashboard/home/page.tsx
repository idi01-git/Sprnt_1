import HeroSection from '@/components/landing/HeroSection'
import ProblemSolution from '@/components/landing/ProblemSolution'
import ReferralSection from '@/components/landing/ReferralSection'
import { CourseCatalog } from '@/components/landing/CourseCatalog'
import { Timeline } from '@/components/landing/Timeline'
import { getBranches, getCourses } from '@/lib/api'
import { validateRequest } from '@/lib/auth/session'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function DashboardHomePage() {
  const [coursesRes, branchesRes] = await Promise.all([
    getCourses({ page: 1, limit: 12 }),
    getBranches(),
  ])

  const initialCourses = coursesRes.success ? coursesRes.data?.courses ?? [] : []
  const initialBranches = branchesRes.success ? branchesRes.data?.branches ?? [] : []

  let enrolledCourseIds: string[] = []
  const { user } = await validateRequest()
  if (user) {
    const enrollments = await prisma.enrollment.findMany({
      where: {
        userId: user.id,
        paymentStatus: 'success',
        deletedAt: null,
      },
      select: {
        course: {
          select: { courseId: true },
        },
      },
    })
    enrolledCourseIds = enrollments.map((enrollment) => enrollment.course.courseId)
  }

  return (
    <main className="min-h-screen bg-white">
      <HeroSection />
      <ProblemSolution />
      <CourseCatalog
        initialCourses={initialCourses}
        initialBranches={initialBranches}
        enrolledCourseIds={enrolledCourseIds}
      />
      <Timeline />
      <ReferralSection />
    </main>
  )
}
