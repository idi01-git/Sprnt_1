import { createHash, randomBytes } from 'node:crypto'
import { prisma } from '@/lib/db'

const PASSWORD_RESET_TOKEN_TTL_MS = 1000 * 60 * 60
const EMAIL_VERIFICATION_TOKEN_TTL_MS = 1000 * 60 * 60 * 24

function createTokenHash(rawToken: string): string {
    return createHash('sha256').update(rawToken).digest('hex')
}

function createOpaqueToken(): string {
    return randomBytes(32).toString('hex')
}

export function hashOpaqueToken(rawToken: string): string {
    return createTokenHash(rawToken)
}

export async function issuePasswordResetToken(userId: string): Promise<string> {
    const rawToken = createOpaqueToken()
    const tokenHash = createTokenHash(rawToken)
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MS)

    await prisma.passwordResetToken.create({
        data: {
            userId,
            tokenHash,
            expiresAt,
        },
    })

    return rawToken
}

export async function issueEmailVerificationToken(userId: string): Promise<string> {
    const rawToken = createOpaqueToken()
    const tokenHash = createTokenHash(rawToken)
    const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_TOKEN_TTL_MS)

    await prisma.emailVerificationToken.create({
        data: {
            userId,
            tokenHash,
            expiresAt,
        },
    })

    return rawToken
}

export async function findValidPasswordResetToken(rawToken: string) {
    const tokenHash = createTokenHash(rawToken)

    return prisma.passwordResetToken.findFirst({
        where: {
            tokenHash,
            usedAt: null,
            expiresAt: { gt: new Date() },
        },
        include: { user: true },
    })
}

export async function findValidEmailVerificationToken(rawToken: string) {
    const tokenHash = createTokenHash(rawToken)

    return prisma.emailVerificationToken.findFirst({
        where: {
            tokenHash,
            usedAt: null,
            expiresAt: { gt: new Date() },
        },
        include: { user: true },
    })
}
