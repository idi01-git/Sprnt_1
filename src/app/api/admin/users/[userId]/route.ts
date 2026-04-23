import { prisma } from '@/lib/db'
import { requireAdminOrAbove, AuthError } from '@/lib/auth/guards'
import { createSuccessResponse, createErrorResponse, badRequest, conflict, notFound, serverError, HttpStatus, ErrorCode } from '@/lib/api-response'
import { logAdminAction } from '@/lib/admin-logger'
import { adminUpdateUserSchema } from '@/lib/validations/admin'

export const dynamic = 'force-dynamic'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        await requireAdminOrAbove()
        const { userId } = await params

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                _count: {
                    select: {
                        enrollments: true,
                        submissions: true,
                        referralsSent: true,
                        sessions: true,
                        certificates: true,
                    }
                },
                certificates: {
                    select: {
                        id: true,
                        certificateId: true,
                        studentName: true,
                        courseName: true,
                        collegeName: true,
                        issuedAt: true,
                        isRevoked: true,
                        revocationReason: true,
                    },
                    orderBy: { issuedAt: 'desc' },
                    take: 10,
                },
                sessions: {
                    select: {
                        id: true,
                        expiresAt: true,
                    },
                    orderBy: { expiresAt: 'desc' },
                    take: 10,
                },
            }
        })

        if (!user) {
            return notFound('User')
        }

        const referralStats = await prisma.referral.aggregate({
            where: { referrerId: userId, status: 'completed' },
            _sum: { amount: true },
            _count: true,
        })

        const responseData = {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            dob: user.dob?.toISOString() || null,
            studyLevel: user.studyLevel,
            avatarUrl: user.avatarUrl,
            upiId: user.upiId,
            referralCode: user.referralCode,
            referredBy: user.referredBy,
            status: user.deletedAt !== null ? 'suspended' : 'active',
            emailVerified: !!user.emailVerified,
            createdAt: user.createdAt.toISOString(),
            updatedAt: user.updatedAt.toISOString(),
            walletBalance: Number(user.walletBalance),
            counts: {
                enrollments: user._count.enrollments,
                submissions: user._count.submissions,
                referralsSent: user._count.referralsSent,
                sessions: user._count.sessions,
                certificates: user._count.certificates,
            },
            referralStats: {
                totalReferrals: referralStats._count,
                totalEarned: Number(referralStats._sum.amount ?? 0),
            },
            certificates: user.certificates.map((certificate) => ({
                id: certificate.id,
                certificateId: certificate.certificateId,
                studentName: certificate.studentName,
                courseName: certificate.courseName,
                collegeName: certificate.collegeName,
                issuedAt: certificate.issuedAt.toISOString(),
                isRevoked: certificate.isRevoked,
                revocationReason: certificate.revocationReason,
            })),
            sessions: user.sessions.map((session) => ({
                id: session.id,
                expiresAt: session.expiresAt.toISOString(),
                isExpired: session.expiresAt.getTime() <= Date.now(),
            })),
        }

        return createSuccessResponse({ user: responseData })
    } catch (error) {
        if (error instanceof AuthError) {
            return createErrorResponse(ErrorCode.ADMIN_AUTH_REQUIRED, 'Admin authentication required', HttpStatus.UNAUTHORIZED)
        }
        console.error('[GET /api/admin/users/[userId]]', error)
        return serverError()
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const { adminId } = await requireAdminOrAbove()
        const { userId } = await params

        const body = await request.json().catch(() => null)
        if (!body) {
            return badRequest('Request body is required')
        }

        const parsed = adminUpdateUserSchema.safeParse(body)
        if (!parsed.success) {
            return badRequest('Validation failed', { errors: parsed.error.flatten().fieldErrors })
        }

        const existingUser = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                deletedAt: true,
                referralCode: true,
            },
        })

        if (!existingUser) {
            return notFound('User')
        }

        const updateData: Record<string, unknown> = {}
        const data = parsed.data

        if (data.email && data.email !== existingUser.email) {
            const conflictUser = await prisma.user.findUnique({
                where: { email: data.email },
                select: { id: true },
            })
            if (conflictUser && conflictUser.id !== userId) {
                return conflict('Another user already uses this email address')
            }
            updateData.email = data.email
        }

        if (data.referralCode !== undefined && data.referralCode !== existingUser.referralCode) {
            if (data.referralCode) {
                const conflictReferral = await prisma.user.findUnique({
                    where: { referralCode: data.referralCode },
                    select: { id: true },
                })
                if (conflictReferral && conflictReferral.id !== userId) {
                    return conflict('Another user already uses this referral code')
                }
            }
            updateData.referralCode = data.referralCode ?? null
        }

        if (data.name !== undefined) updateData.name = data.name
        if (data.phone !== undefined) updateData.phone = data.phone ?? null
        if (data.dob !== undefined) updateData.dob = data.dob ? new Date(data.dob) : null
        if (data.studyLevel !== undefined) updateData.studyLevel = data.studyLevel ?? null
        if (data.avatarUrl !== undefined) updateData.avatarUrl = data.avatarUrl ?? null
        if (data.upiId !== undefined) updateData.upiId = data.upiId ?? null
        if (data.emailVerified !== undefined) updateData.emailVerified = data.emailVerified
        if (data.status !== undefined) {
            updateData.deletedAt = data.status === 'suspended'
                ? existingUser.deletedAt ?? new Date()
                : null
        }

        if (Object.keys(updateData).length === 0) {
            return badRequest('No editable fields were provided')
        }

        const updatedUser = await prisma.$transaction(async (tx) => {
            const updated = await tx.user.update({
                where: { id: userId },
                data: updateData,
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    dob: true,
                    studyLevel: true,
                    avatarUrl: true,
                    upiId: true,
                    referralCode: true,
                    emailVerified: true,
                    deletedAt: true,
                    updatedAt: true,
                },
            })

            if (data.status === 'suspended') {
                await tx.session.deleteMany({ where: { userId } })
            }

            return updated
        })

        await logAdminAction(adminId, 'user_updated', 'user', userId)

        return createSuccessResponse({
            user: {
                ...updatedUser,
                dob: updatedUser.dob?.toISOString() ?? null,
                status: updatedUser.deletedAt ? 'suspended' : 'active',
                updatedAt: updatedUser.updatedAt.toISOString(),
            },
        })
    } catch (error) {
        if (error instanceof AuthError) {
            return createErrorResponse(ErrorCode.ADMIN_AUTH_REQUIRED, 'Admin authentication required', HttpStatus.UNAUTHORIZED)
        }
        console.error('[PATCH /api/admin/users/[userId]]', error)
        return serverError('Failed to update user')
    }
}
