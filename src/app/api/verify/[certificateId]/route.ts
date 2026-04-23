import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import {
    createSuccessResponse,
    createErrorResponse,
    serverError,
    HttpStatus,
    ErrorCode,
} from '@/lib/api-response'
import { formatCertificateGradeLabel, readCertificateApprovalSnapshot } from '@/lib/certificates'

/**
 * GET /api/verify/{certificateId}
 * Public endpoint: Verify a certificate by its ID (from QR scan).
 * No auth required.
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ certificateId: string }> }
) {
    try {
        const { certificateId } = await params

        const certificate = await prisma.certificate.findUnique({
            where: { certificateId },
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
                                gradeCategory: true,
                                dob: true,
                            },
                        },
                    },
                },
            },
        })

        if (!certificate) {
            return createErrorResponse(
                ErrorCode.CERTIFICATE_NOT_FOUND,
                'Certificate not found. This certificate ID does not exist.',
                HttpStatus.NOT_FOUND
            )
        }

        const approvalSnapshot = await readCertificateApprovalSnapshot(prisma, certificate.id, { collegeName: certificate.collegeName })

        await prisma.certificateVerification.create({
            data: {
                certificateId,
                ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
                userAgent: request.headers.get('user-agent'),
            },
        })

        return createSuccessResponse({
            valid: !certificate.isRevoked,
            status: certificate.isRevoked ? 'revoked' : 'valid',
            certificate: {
                certificateId: certificate.certificateId,
                studentName: certificate.studentName,
                collegeName: certificate.collegeName,
                courseName: certificate.courseName,
                branch: certificate.course.affiliatedBranch,
                stream: approvalSnapshot.branch || certificate.course.affiliatedBranch,
                dateOfBirth: approvalSnapshot.dob ?? certificate.enrollment.submission?.dob?.toISOString() ?? null,
                finalScore: certificate.enrollment.submission?.finalGrade !== null && certificate.enrollment.submission?.finalGrade !== undefined
                    ? Number(certificate.enrollment.submission.finalGrade)
                    : null,
                grade: formatCertificateGradeLabel(certificate.grade),
                gradeCategory: certificate.enrollment.submission?.gradeCategory ?? null,
                issuedAt: certificate.issuedAt,
                revocationReason: certificate.revocationReason,
            },
        })
    } catch (error) {
        console.error('[GET /api/verify/[certificateId]]', error)
        return serverError('Failed to verify certificate')
    }
}
