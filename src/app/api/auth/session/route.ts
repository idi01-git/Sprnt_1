import { validateRequest } from '@/lib/auth/session'
import { prisma } from '@/lib/db'
import {
    createSuccessResponse,
    unauthorized,
    serverError,
} from '@/lib/api-response'

/**
 * GET /api/auth/session
 * Return current authenticated user + session metadata
 */
export async function GET() {
    try {
        const { user, session } = await validateRequest()

        if (!user || !session) {
            return unauthorized('No active session')
        }

        // Fetch full user data from Prisma (Lucia User doesn't have email/name/role)
        const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                emailVerified: true,
            }
        })

        if (!dbUser) {
            return unauthorized('User not found')
        }

        return createSuccessResponse({
            user: {
                id: dbUser.id,
                email: dbUser.email,
                name: dbUser.name,
                role: dbUser.role,
                emailVerified: dbUser.emailVerified,
            },
            session: {
                id: session.id,
                expiresAt: session.expiresAt,
                fresh: session.fresh,
            },
        })
    } catch (error) {
        console.error('[GET /api/auth/session]', error)
        return serverError('Failed to fetch session')
    }
}
