import { prisma } from '@/lib/db'
import { requireAdminOrAbove, AuthError } from '@/lib/auth/guards'
import { badRequest, createErrorResponse, createSuccessResponse, HttpStatus, notFound, serverError } from '@/lib/api-response'
import { logAdminAction } from '@/lib/admin-logger'
import { adminUpdateCertificateSchema } from '@/lib/validations/admin'
import { formatCertificateGradeLabel, readCertificateApprovalSnapshot, readCertificatePdfUrl, writeCertificatePdfUrl } from '@/lib/certificates'

export const dynamic = 'force-dynamic'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ certificateId: string }> }
) {
    try {
        await requireAdminOrAbove()
        const { certificateId } = await params

        const certificate = await prisma.certificate.findUnique({
            where: { certificateId },
            include: {
                user: { select: { id: true, name: true, email: true, phone: true } },
                course: { select: { id: true, courseId: true, courseName: true, affiliatedBranch: true } },
                enrollment: {
                    select: {
                        id: true,
                        completedAt: true,
                        submission: {
                            select: {
                                id: true,
                                reviewStatus: true,
                                adminNotes: true,
                                submittedAt: true,
                                reviewStartedAt: true,
                                reviewCompletedAt: true,
                                fullName: true,
                                dob: true,
                                collegeName: true,
                                collegeIdLink: true,
                                branch: true,
                                graduationYear: true,
                                driveLink: true,
                                metric1SimulationAccuracy: true,
                                metric2LogicMethodology: true,
                                metric3IndustrialOutput: true,
                                metric4SensitivityAnalysis: true,
                                metric5Documentation: true,
                                finalGrade: true,
                                gradeCategory: true,
                            },
                        },
                    },
                },
                verifications: {
                    orderBy: { scannedAt: 'desc' },
                    take: 20,
                    select: {
                        id: true,
                        scannedAt: true,
                        ipAddress: true,
                        userAgent: true,
                    },
                },
            },
        })

        if (!certificate) {
            return notFound('Certificate')
        }

        const submission = certificate.enrollment.submission
        const approvalSnapshot = await readCertificateApprovalSnapshot(prisma, certificate.id, { collegeName: certificate.collegeName })
        const certificatePdfUrl = await readCertificatePdfUrl(prisma, certificate.id)

        return createSuccessResponse({
            certificate: {
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
                revocationReason: certificate.revocationReason,
                revokedAt: certificate.revokedAt?.toISOString() ?? null,
                revokedBy: certificate.revokedBy,
                user: certificate.user,
                course: certificate.course,
                enrollmentId: certificate.enrollment.id,
                completedAt: certificate.enrollment.completedAt?.toISOString() ?? null,
                approvalSnapshot: {
                    fullName: approvalSnapshot.fullName,
                    dob: approvalSnapshot.dob,
                    collegeName: approvalSnapshot.collegeName,
                    branch: approvalSnapshot.branch,
                    graduationYear: approvalSnapshot.graduationYear,
                    collegeIdLink: approvalSnapshot.collegeIdLink,
                },
                submission: submission ? {
                    id: submission.id,
                    reviewStatus: submission.reviewStatus,
                    adminNotes: submission.adminNotes,
                    submittedAt: submission.submittedAt.toISOString(),
                    reviewStartedAt: submission.reviewStartedAt?.toISOString() ?? null,
                    reviewCompletedAt: submission.reviewCompletedAt?.toISOString() ?? null,
                    fullName: submission.fullName,
                    dob: submission.dob?.toISOString() ?? null,
                    collegeName: submission.collegeName,
                    collegeIdLink: submission.collegeIdLink,
                    branch: submission.branch,
                    graduationYear: submission.graduationYear,
                    driveLink: submission.driveLink,
                    metric1SimulationAccuracy: submission.metric1SimulationAccuracy !== null ? Number(submission.metric1SimulationAccuracy) : null,
                    metric2LogicMethodology: submission.metric2LogicMethodology !== null ? Number(submission.metric2LogicMethodology) : null,
                    metric3IndustrialOutput: submission.metric3IndustrialOutput !== null ? Number(submission.metric3IndustrialOutput) : null,
                    metric4SensitivityAnalysis: submission.metric4SensitivityAnalysis !== null ? Number(submission.metric4SensitivityAnalysis) : null,
                    metric5Documentation: submission.metric5Documentation !== null ? Number(submission.metric5Documentation) : null,
                    finalGrade: submission.finalGrade !== null ? Number(submission.finalGrade) : null,
                    gradeCategory: submission.gradeCategory,
                } : null,
                verificationHistory: certificate.verifications.map((verification: {
                    id: string
                    scannedAt: Date
                    ipAddress: string | null
                    userAgent: string | null
                }) => ({
                    id: verification.id,
                    scannedAt: verification.scannedAt.toISOString(),
                    ipAddress: verification.ipAddress,
                    userAgent: verification.userAgent,
                })),
            },
        })
    } catch (error) {
        if (error instanceof AuthError) {
            return createErrorResponse('ADMIN_AUTH_REQUIRED', 'Admin authentication required', HttpStatus.UNAUTHORIZED)
        }

        console.error('[GET /api/admin/certificates/[certificateId]]', error)
        return serverError('Failed to load certificate')
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ certificateId: string }> }
) {
    try {
        const { adminId } = await requireAdminOrAbove()
        const { certificateId } = await params
        const body = await request.json().catch(() => null)
        if (!body) {
            return badRequest('Request body is required')
        }

        const parsed = adminUpdateCertificateSchema.safeParse(body)
        if (!parsed.success) {
            return badRequest('Validation failed', { errors: parsed.error.flatten().fieldErrors })
        }

        const certificate = await prisma.certificate.findUnique({
            where: { certificateId },
            select: { id: true, certificateId: true },
        })

        if (!certificate) {
            return notFound('Certificate')
        }

        await writeCertificatePdfUrl(prisma, certificate.id, parsed.data.certificatePdfUrl)
        await logAdminAction(adminId, 'certificate_updated', 'certificate', certificate.id)

        return createSuccessResponse({
            certificateId: certificate.certificateId,
            certificatePdfUrl: parsed.data.certificatePdfUrl,
        })
    } catch (error) {
        if (error instanceof AuthError) {
            return createErrorResponse('ADMIN_AUTH_REQUIRED', 'Admin authentication required', HttpStatus.UNAUTHORIZED)
        }

        console.error('[PATCH /api/admin/certificates/[certificateId]]', error)
        return serverError('Failed to update certificate')
    }
}
