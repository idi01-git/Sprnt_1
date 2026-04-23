import { prisma } from '@/lib/db'
import { appEnv } from '@/lib/env'
import { requireAdminOrAbove, AuthError } from '@/lib/auth/guards'
import { createSuccessResponse, createErrorResponse, ErrorCode, badRequest, notFound, serverError, HttpStatus } from '@/lib/api-response'
import { logAdminAction } from '@/lib/admin-logger'
import { adminApproveSubmissionSchema } from '@/lib/validations/admin'
import { sendCertificateEmail } from '@/lib/email'
import { formatCertificateGradeLabel, generateUniqueCertificateId, getCertificateGrade, writeCertificateApprovalSnapshot, writeCertificatePdfUrl } from '@/lib/certificates'

export async function POST(
    request: Request,
    { params }: { params: Promise<{ submissionId: string }> }
) {
    try {
        const { adminId } = await requireAdminOrAbove()
        const { submissionId } = await params
        const body = await request.json().catch(() => null)

        if (!body) {
            return badRequest('Invalid JSON body')
        }

        const parsed = adminApproveSubmissionSchema.safeParse(body)
        if (!parsed.success) {
            return badRequest('Validation failed', { errors: parsed.error.flatten().fieldErrors })
        }

        const submission = await prisma.submission.findUnique({
            where: { id: submissionId },
            include: {
                enrollment: {
                    include: { course: true },
                },
                user: true,
            },
        })

        if (!submission) return notFound('Submission')

        const existingCertificate = await prisma.certificate.findUnique({
            where: { enrollmentId: submission.enrollmentId },
        })

        const metricsComplete =
            submission.metric1SimulationAccuracy !== null &&
            submission.metric2LogicMethodology !== null &&
            submission.metric3IndustrialOutput !== null &&
            submission.metric4SensitivityAnalysis !== null &&
            submission.metric5Documentation !== null

        if (!metricsComplete || submission.finalGrade === null) {
            return createErrorResponse(
                ErrorCode.SUBMISSION_NOT_GRADED,
                'Submission must be fully graded before approval',
                HttpStatus.BAD_REQUEST
            )
        }

        if (Number(submission.finalGrade) < 3.0) {
            return createErrorResponse(
                ErrorCode.SUBMISSION_GRADE_TOO_LOW,
                'Final grade must be at least 3.0 to approve',
                HttpStatus.BAD_REQUEST
            )
        }

        if (existingCertificate) {
            return createSuccessResponse({
                certificateId: existingCertificate.certificateId,
                grade: formatCertificateGradeLabel(existingCertificate.grade),
                studentName: existingCertificate.studentName,
                collegeName: existingCertificate.collegeName,
                courseName: existingCertificate.courseName,
                qrCodeData: existingCertificate.qrCodeData,
                certificateUrl: existingCertificate.certificateUrl,
                certificatePdfUrl: null,
                alreadyIssued: true,
            })
        }

        const grade = Number(submission.finalGrade)
        const certificateGrade = getCertificateGrade(grade)
        const issueTimestamp = new Date()
        const certificateRecord = await prisma.$transaction(async (tx) => {
            const certificateId = await generateUniqueCertificateId(tx)
            const verificationUrl = `${appEnv.appUrl}/verify/${certificateId}`

            await tx.submission.update({
                where: { id: submissionId },
                data: {
                    reviewStatus: 'approved',
                    reviewStartedAt: submission.reviewStartedAt ?? issueTimestamp,
                    reviewCompletedAt: issueTimestamp,
                },
            })

            await tx.enrollment.update({
                where: { id: submission.enrollmentId },
                data: {
                    certificateIssued: true,
                    certificateId,
                    completedAt: issueTimestamp,
                },
            })

            const certificate = await tx.certificate.create({
                data: {
                    certificateId,
                    enrollmentId: submission.enrollmentId,
                    userId: submission.userId,
                    courseId: submission.enrollment.courseId,
                    studentName: parsed.data.certificateStudentName.trim(),
                    collegeName: parsed.data.certificateCollegeName.trim(),
                    courseName: submission.enrollment.course.courseName,
                    grade: certificateGrade,
                    certificateUrl: verificationUrl,
                    qrCodeData: verificationUrl,
                    issuedAt: issueTimestamp,
                },
            })

            await writeCertificateApprovalSnapshot(tx, certificate.id, {
                fullName: parsed.data.fullName.trim(),
                dob: parsed.data.dob || null,
                collegeName: parsed.data.collegeName.trim(),
                branch: parsed.data.branch.trim(),
                graduationYear: parsed.data.graduationYear,
                collegeIdLink: parsed.data.collegeIdLink.trim(),
            })
            await writeCertificatePdfUrl(tx, certificate.id, parsed.data.certificatePdfUrl)

            return certificate
        })

        await logAdminAction(adminId, 'submission_approved', 'submission', submissionId)
        sendCertificateEmail(
            submission.user.email,
            parsed.data.certificateStudentName.trim(),
            submission.enrollment.course.courseName,
            formatCertificateGradeLabel(certificateRecord.grade),
            certificateRecord.certificateId,
            { certificatePdfUrl: parsed.data.certificatePdfUrl }
        ).catch((emailError) => {
            console.error('[submission approval] Failed to send certificate email:', emailError)
        })

        return createSuccessResponse({
            certificateId: certificateRecord.certificateId,
            grade: formatCertificateGradeLabel(certificateRecord.grade),
            studentName: certificateRecord.studentName,
            collegeName: certificateRecord.collegeName,
            courseName: certificateRecord.courseName,
            qrCodeData: certificateRecord.qrCodeData,
            certificateUrl: certificateRecord.certificateUrl,
            certificatePdfUrl: parsed.data.certificatePdfUrl,
            alreadyIssued: false,
        })
    } catch (error) {
        if (error instanceof AuthError) {
            return createErrorResponse(
                ErrorCode.ADMIN_AUTH_REQUIRED,
                'Admin authentication required',
                HttpStatus.UNAUTHORIZED
            )
        }
        console.error('[POST /api/admin/submissions/[submissionId]/approve]', error)
        return serverError()
    }
}
