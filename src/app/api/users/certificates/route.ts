import { prisma } from '@/lib/db'
import { requireAuth, AuthError } from '@/lib/auth/guards'
import { createSuccessResponse, unauthorized, serverError } from '@/lib/api-response'
import { formatCertificateGradeLabel, readCertificateApprovalSnapshot, readCertificatePdfUrl } from '@/lib/certificates'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const authUser = await requireAuth()

        const certificates = await prisma.certificate.findMany({
            where: { userId: authUser.id },
            include: {
                course: {
                    select: {
                        affiliatedBranch: true,
                    },
                },
                enrollment: {
                    select: {
                        submission: {
                            select: {
                                finalGrade: true,
                            },
                        },
                    },
                },
            },
            orderBy: { issuedAt: 'desc' },
        })

        const items = await Promise.all(certificates.map(async (certificate) => {
            const approvalSnapshot = await readCertificateApprovalSnapshot(prisma, certificate.id, { collegeName: certificate.collegeName })
            const certificatePdfUrl = await readCertificatePdfUrl(prisma, certificate.id)

            return {
                id: certificate.id,
                certificateId: certificate.certificateId,
                studentName: certificate.studentName,
                collegeName: certificate.collegeName,
                courseName: certificate.courseName,
                grade: formatCertificateGradeLabel(certificate.grade),
                branch: approvalSnapshot.branch || certificate.course.affiliatedBranch,
                dateOfBirth: approvalSnapshot.dob,
                finalScore: certificate.enrollment.submission?.finalGrade !== null && certificate.enrollment.submission?.finalGrade !== undefined
                    ? Number(certificate.enrollment.submission.finalGrade)
                    : null,
                issuedAt: certificate.issuedAt.toISOString(),
                certificateUrl: certificate.certificateUrl,
                certificatePdfUrl,
                isRevoked: certificate.isRevoked,
                revocationReason: certificate.revocationReason,
            }
        }))

        return createSuccessResponse({ certificates: items })
    } catch (error) {
        if (error instanceof AuthError) {
            return unauthorized()
        }

        console.error('[GET /api/users/certificates]', error)
        return serverError('Failed to fetch certificates')
    }
}
