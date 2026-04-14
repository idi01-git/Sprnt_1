import { randomBytes } from 'node:crypto'
import { prisma } from '@/lib/db'

const REFERRAL_PREFIX = 'REF'
const REFERRAL_CODE_LENGTH = 6
const REFERRAL_CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function generateReferralCodeCandidate(): string {
    let referralCode = REFERRAL_PREFIX

    for (let index = 0; index < REFERRAL_CODE_LENGTH; index += 1) {
        const randomCharacterIndex = randomBytes(1)[0] % REFERRAL_CHARSET.length
        referralCode += REFERRAL_CHARSET[randomCharacterIndex]
    }

    return referralCode
}

export async function createUniqueReferralCode(): Promise<string> {
    for (let attempt = 0; attempt < 10; attempt += 1) {
        const referralCode = generateReferralCodeCandidate()
        const existingUser = await prisma.user.findUnique({
            where: { referralCode },
            select: { id: true },
        })

        if (!existingUser) {
            return referralCode
        }
    }

    throw new Error('Failed to generate a unique referral code')
}
