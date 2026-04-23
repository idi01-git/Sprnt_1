import { prisma } from '@/lib/db'
import { requireReviewerOrAbove, AuthError } from '@/lib/auth/guards'
import { createSuccessResponse, createErrorResponse, notFound, serverError, HttpStatus } from '@/lib/api-response'
import { formatCertificateGradeLabel, readCertificateApprovalSnapshot, readCertificatePdfUrl } from '@/lib/certificates'

export const dynamic = 'force-dynamic'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ submissionId: string }> }
) {
    try {
        await requireReviewerOrAbove()
        const { submissionId } = await params

        const submission = await prisma.submission.findUnique({
            where: { id: submissionId },
            include: {
                user: { select: { id: true, name: true, email: true, phone: true, avatarUrl: true } },
                enrollment: {
                    include: {
                        course: { select: { id: true, courseName: true, courseId: true, affiliatedBranch: true } },
                    },
                },
                assignedAdmin: { select: { email: true } },
            },
        })

        if (!submission) {
            return notFound('Submission')
        }

        const certificate = await prisma.certificate.findUnique({
            where: { enrollmentId: submission.enrollmentId },
        })

        const [approvalSnapshot, certificatePdfUrl] = certificate
            ? await Promise.all([
                readCertificateApprovalSnapshot(prisma, certificate.id, { collegeName: certificate.collegeName }),
                readCertificatePdfUrl(prisma, certificate.id),
            ])
            : [null, null]

        return createSuccessResponse({
            submission: {
                id: submission.id,
                enrollment: {
                    id: submission.enrollment.id,
                    user: {
                        id: submission.user.id,
                        name: submission.user.name,
                        email: submission.user.email,
                        phone: submission.user.phone,
                        avatarUrl: submission.user.avatarUrl,
                    },
                    course: {
                        id: submission.enrollment.course.id,
                        courseId: submission.enrollment.course.courseId,
                        courseName: submission.enrollment.course.courseName,
                        affiliatedBranch: submission.enrollment.course.affiliatedBranch,
                    },
                },
                identity: submission.fullName ? {
                    fullName: submission.fullName,
                    dob: submission.dob?.toISOString() ?? null,
                    collegeName: submission.collegeName,
                    branch: submission.branch,
                    graduationYear: submission.graduationYear,
                    collegeIdUrl: submission.collegeIdLink || null,
                } : null,
                projectFileUrl: submission.driveLink || null,
                reportPdfUrl: null,
                reviewStatus: submission.reviewStatus,
                gradeMetrics:
                    submission.metric1SimulationAccuracy !== null ||
                    submission.metric2LogicMethodology !== null ||
                    submission.metric3IndustrialOutput !== null ||
                    submission.metric4SensitivityAnalysis !== null ||
                    submission.metric5Documentation !== null
                        ? {
                            simulationAccuracy: Number(submission.metric1SimulationAccuracy || 0) * 2,
                            logicMethodology: Number(submission.metric2LogicMethodology || 0) * 2,
                            industrialOutput: Number(submission.metric3IndustrialOutput || 0) * 2,
                            sensitivityAnalysis: Number(submission.metric4SensitivityAnalysis || 0) * 2,
                            documentation: Number(submission.metric5Documentation || 0) * 2,
                        }
                        : null,
                finalGrade: submission.finalGrade !== null ? Number(submission.finalGrade) : null,
                gradeCategory: submission.gradeCategory || null,
                adminNotes: submission.adminNotes || null,
                assignedAdminEmail: submission.assignedAdmin?.email || null,
                submittedAt: submission.submittedAt.toISOString(),
                reviewStartedAt: submission.reviewStartedAt?.toISOString() ?? null,
                reviewCompletedAt: submission.reviewCompletedAt?.toISOString() ?? null,
                resubmissionCount: submission.resubmissionCount,
                maxResubmissions: submission.maxResubmissions,
                certificate: certificate ? {
                    id: certificate.id,
                    certificateId: certificate.certificateId,
                    studentName: certificate.studentName,
                    collegeName: certificate.collegeName,
                    courseName: certificate.courseName,
                    grade: formatCertificateGradeLabel(certificate.grade),
                    certificateUrl: certificate.certificateUrl,
                    certificatePdfUrl,
                    qrCodeData: certificate.qrCodeData,
                    issuedAt: certificate.issuedAt.toISOString(),
                    isRevoked: certificate.isRevoked,
                    approvalSnapshot: {
                        fullName: approvalSnapshot?.fullName ?? null,
                        dob: approvalSnapshot?.dob ?? null,
                        collegeName: approvalSnapshot?.collegeName ?? certificate.collegeName,
                        branch: approvalSnapshot?.branch ?? null,
                        graduationYear: approvalSnapshot?.graduationYear ?? null,
                        collegeIdLink: approvalSnapshot?.collegeIdLink ?? null,
                    },
                } : null,
            },
        })
    } catch (error) {
        if (error instanceof AuthError) {
            return createErrorResponse('ADMIN_AUTH_REQUIRED', 'Admin authentication required', HttpStatus.UNAUTHORIZED)
        }
        console.error('[GET /api/admin/submissions/[submissionId]]', error)
        return serverError()
    }
}
