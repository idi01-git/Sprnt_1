import { CourseCatalog } from '@/components/landing/CourseCatalog'
import { getBranches, getCourses } from '@/lib/api'
import { validateRequest } from '@/lib/auth/session'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function DashboardExplorePage() {
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
          select: {
            courseId: true,
          },
        },
      },
    })

    enrolledCourseIds = enrollments.map((enrollment) => enrollment.course.courseId).sort()
  }

  return (
    <div className="min-h-screen bg-neo-cream">
      <div className="bg-neo-purple border-b-[3px] border-neo-black px-6 py-16" style={{boxShadow:'0 3px 0 #1a1a2e'}}>
        <div className="mx-auto max-w-7xl">
          <h1
            className="mb-4 text-4xl font-extrabold text-neo-black"
            style={{ fontFamily: 'var(--font-outfit)' }}
          >
            Explore Courses
          </h1>
          <p
            className="max-w-2xl text-lg text-neo-black/80 font-semibold"
            style={{ fontFamily: 'var(--font-poppins)' }}
          >
            Browse every course available on Sprintern. Purchased courses stay visible here so you can jump back in anytime.
          </p>
        </div>
      </div>

      <CourseCatalog
        initialCourses={initialCourses}
        initialBranches={initialBranches}
        enrolledCourseIds={enrolledCourseIds}
      />
    </div>
  )
}
