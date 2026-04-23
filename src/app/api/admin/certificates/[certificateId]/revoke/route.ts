import { prisma } from '@/lib/db'
import { requireAdminOrAbove, AuthError } from '@/lib/auth/guards'
import { createErrorResponse, createSuccessResponse, badRequest, HttpStatus, notFound, serverError } from '@/lib/api-response'
import { logAdminAction } from '@/lib/admin-logger'
import { adminRevokeCertificateSchema } from '@/lib/validations/admin'

export async function POST(
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

        const parsed = adminRevokeCertificateSchema.safeParse(body)
        if (!parsed.success) {
            return badRequest('Validation failed', { errors: parsed.error.flatten().fieldErrors })
        }

        const certificate = await prisma.certificate.findUnique({
            where: { certificateId },
            select: { id: true, isRevoked: true },
        })

        if (!certificate) {
            return notFound('Certificate')
        }

        if (!certificate.isRevoked) {
            await prisma.certificate.update({
                where: { certificateId },
                data: {
                    isRevoked: true,
                    revokedAt: new Date(),
                    revokedBy: adminId,
                    revocationReason: parsed.data.reason,
                },
            })
        }

        await logAdminAction(adminId, 'certificate_revoked', 'certificate', certificate.id)

        return createSuccessResponse({
            certificateId,
            isRevoked: true,
            revocationReason: parsed.data.reason,
        })
    } catch (error) {
        if (error instanceof AuthError) {
            return createErrorResponse('ADMIN_AUTH_REQUIRED', 'Admin authentication required', HttpStatus.UNAUTHORIZED)
        }

        console.error('[POST /api/admin/certificates/[certificateId]/revoke]', error)
        return serverError('Failed to revoke certificate')
    }
}
