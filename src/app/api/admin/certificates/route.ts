import { prisma } from '@/lib/db'
import { requireAdminOrAbove, AuthError } from '@/lib/auth/guards'
import { createSuccessResponse, createErrorResponse, badRequest, serverError, HttpStatus } from '@/lib/api-response'
import { adminCertificateListQuerySchema } from '@/lib/validations/admin'
import { formatCertificateGradeLabel } from '@/lib/certificates'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    try {
        await requireAdminOrAbove()
        const { searchParams } = new URL(request.url)
        const queryParams = Object.fromEntries(searchParams.entries())
        const parsed = adminCertificateListQuerySchema.safeParse(queryParams)

        if (!parsed.success) {
            return badRequest('Invalid query parameters', { errors: parsed.error.flatten().fieldErrors })
        }

        const { search, status, courseId, sort } = parsed.data

        const where: Record<string, unknown> = {}

        if (status === 'valid') where.isRevoked = false
        if (status === 'revoked') where.isRevoked = true
        if (courseId) where.course = { is: { courseId } }
        if (search) {
            where.OR = [
                { certificateId: { contains: search, mode: 'insensitive' } },
                { studentName: { contains: search, mode: 'insensitive' } },
                { collegeName: { contains: search, mode: 'insensitive' } },
                { courseName: { contains: search, mode: 'insensitive' } },
                { user: { is: { email: { contains: search, mode: 'insensitive' } } } },
            ]
        }

        const orderBy = sort === 'oldest'
            ? { issuedAt: 'asc' as const }
            : sort === 'name'
                ? { studentName: 'asc' as const }
                : { issuedAt: 'desc' as const }

        const certificates = await prisma.certificate.findMany({
            where,
            select: {
                id: true,
                certificateId: true,
                studentName: true,
                collegeName: true,
                courseName: true,
                grade: true,
                issuedAt: true,
                isRevoked: true,
                revocationReason: true,
                revokedAt: true,
                certificateUrl: true,
                user: { select: { id: true, email: true } },
                course: { select: { courseId: true, affiliatedBranch: true } },
                enrollment: { select: { id: true } },
            },
            orderBy,
        })

        const items = certificates.map((certificate: {
            id: string
            certificateId: string
            studentName: string
            collegeName: string
            courseName: string
            grade: Parameters<typeof formatCertificateGradeLabel>[0]
            issuedAt: Date
            isRevoked: boolean
            revocationReason: string | null
            revokedAt: Date | null
            certificateUrl: string
            user: { id: string, email: string }
            course: { courseId: string, affiliatedBranch: string | null }
            enrollment: { id: string }
        }) => ({
            id: certificate.id,
            enrollmentId: certificate.enrollment.id,
            certificateId: certificate.certificateId,
            studentName: certificate.studentName,
            studentEmail: certificate.user.email,
            collegeName: certificate.collegeName,
            courseName: certificate.courseName,
            courseId: certificate.course.courseId,
            branch: certificate.course.affiliatedBranch,
            grade: formatCertificateGradeLabel(certificate.grade),
            issueDate: certificate.issuedAt.toISOString(),
            isRevoked: certificate.isRevoked,
            revocationReason: certificate.revocationReason,
            revokedAt: certificate.revokedAt?.toISOString() ?? null,
            certificateUrl: certificate.certificateUrl,
        }))

        return createSuccessResponse({ certificates: items })
    } catch (error) {
        if (error instanceof AuthError) {
            return createErrorResponse('ADMIN_AUTH_REQUIRED', 'Admin authentication required', HttpStatus.UNAUTHORIZED)
        }
        console.error('[GET /api/admin/certificates]', error)
        return serverError('Failed to fetch certificates')
    }
}
