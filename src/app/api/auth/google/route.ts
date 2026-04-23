import { getFirebaseAdminAuth } from '@/lib/firebase-admin'
import { prisma } from '@/lib/db'
import { createSession } from '@/lib/auth/session'
import {
    createSuccessResponse,
    createErrorResponse,
    badRequest,
    serverError,
    HttpStatus,
    ErrorCode,
} from '@/lib/api-response'
import { StudyLevel } from '@/generated/prisma/client'
import { createUniqueReferralCode } from '@/lib/referrals'
import { sendWelcomeEmail } from '@/lib/email'

const GOOGLE_PROVIDER_ID = 'google'

/**
 * POST /api/auth/google
 * Firebase Google OAuth — token exchange + session creation.
 *
 * Client sends Firebase ID token from signInWithPopup.
 * Server verifies token, creates/links OAuthAccount, creates Lucia session.
 *
 * For new users, returns needsProfileCompletion: true if additional info needed.
 */
export async function POST(request: Request) {
    try {
        const body = await request.json().catch(() => null)
        if (!body) return badRequest('Request body is required')

        const { idToken, referralCode, profileData } = body as { 
            idToken?: string; 
            referralCode?: string;
            profileData?: { phone?: string; dob?: string; studyLevel?: string };
        }

        if (!idToken || typeof idToken !== 'string') {
            return badRequest('Firebase ID token is required')
        }

        // 1. Verify Firebase ID token
        let firebaseUser: { uid: string; email?: string; name?: string }
        try {
            const decoded = await getFirebaseAdminAuth().verifyIdToken(idToken)
            firebaseUser = {
                uid: decoded.uid,
                email: decoded.email,
                name: decoded.name || null,
            }
        } catch (err) {
            console.error('[POST /api/auth/google] Firebase token verification failed:', err)
            return createErrorResponse(
                ErrorCode.AUTH_TOKEN_INVALID,
                'Invalid or expired Google credential. Please try again.',
                HttpStatus.UNAUTHORIZED
            )
        }

        if (!firebaseUser.email) {
            return createErrorResponse(
                ErrorCode.AUTH_TOKEN_INVALID,
                'Google account must have an email address.',
                HttpStatus.UNAUTHORIZED
            )
        }

        const email = firebaseUser.email.toLowerCase().trim()
        const googleUserId = firebaseUser.uid

        // 2. Check if OAuthAccount already exists (existing user logging in with Google)
        const existingOAuth = await prisma.oAuthAccount.findUnique({
            where: {
                providerId_providerUserId: {
                    providerId: GOOGLE_PROVIDER_ID,
                    providerUserId: googleUserId,
                },
            },
            include: { user: true },
        })

        if (existingOAuth) {
            // Existing user — check if suspended
            if (existingOAuth.user.isSuspended) {
                return createErrorResponse(
                    ErrorCode.AUTH_ACCOUNT_DISABLED,
                    'Your account has been suspended. Please contact support.',
                    HttpStatus.UNAUTHORIZED
                )
            }

            // Create session
            await createSession(existingOAuth.user.id)

            return createSuccessResponse({
                user: {
                    id: existingOAuth.user.id,
                    email: existingOAuth.user.email,
                    name: existingOAuth.user.name,
                    role: existingOAuth.user.role,
                    emailVerified: existingOAuth.user.emailVerified,
                    avatarUrl: existingOAuth.user.avatarUrl,
                },
            })
        }

        // 3. No OAuthAccount — check if email already registered (account takeover prevention)
        const existingUserByEmail = await prisma.user.findUnique({
            where: { email },
            select: { id: true, deletedAt: true, isSuspended: true },
        })

        if (existingUserByEmail) {
            if (existingUserByEmail.deletedAt || existingUserByEmail.isSuspended) {
                return createErrorResponse(
                    ErrorCode.AUTH_ACCOUNT_DISABLED,
                    'Your account has been suspended. Please contact support.',
                    HttpStatus.UNAUTHORIZED
                )
            }

            // Link Google account to existing user
            await prisma.oAuthAccount.create({
                data: {
                    providerId: GOOGLE_PROVIDER_ID,
                    providerUserId: googleUserId,
                    userId: existingUserByEmail.id,
                    email,
                },
            })

            // Create session
            await createSession(existingUserByEmail.id)

            return createSuccessResponse({
                user: {
                    id: existingUserByEmail.id,
                    email,
                    name: null, // will be fetched properly
                    role: 'student',
                    emailVerified: true, // Google OAuth verifies email
                    avatarUrl: null,
                },
            })
        }

        // 4. New user — create user + OAuthAccount
        // Validate referral code if provided
        let referredByUserId: string | undefined
        if (referralCode) {
            const referrer = await prisma.user.findUnique({
                where: { referralCode: referralCode.toUpperCase().trim() },
                select: { id: true },
            })
            if (referrer) {
                referredByUserId = referrer.id
            }
        }

        const newReferralCode = await createUniqueReferralCode()

        const newUser = await prisma.user.create({
            data: {
                email,
                name: firebaseUser.name || email.split('@')[0],
                hashedPassword: null, // OAuth users don't need password
                emailVerified: true, // Google OAuth verifies email
                referredBy: referredByUserId || null,
                referralCode: newReferralCode,
                // Additional profile data from Google OAuth signup form
                phone: profileData?.phone || null,
                dob: profileData?.dob || null,
                studyLevel: (profileData?.studyLevel as StudyLevel) || null,
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                emailVerified: true,
                avatarUrl: true,
                phone: true,
                dob: true,
                studyLevel: true,
            },
        })

        // Create OAuthAccount link
        await prisma.oAuthAccount.create({
            data: {
                providerId: GOOGLE_PROVIDER_ID,
                providerUserId: googleUserId,
                userId: newUser.id,
                email,
            },
        })

        // 5. Create session
        await createSession(newUser.id)
        sendWelcomeEmail(newUser.email, newUser.name).catch((error) => {
            console.error('[POST /api/auth/google] Failed to send welcome email:', error)
        })

        // Check if profile needs completion (phone, dob, or studyLevel is missing)
        const needsProfileCompletion = !newUser.phone && !newUser.dob && !newUser.studyLevel

        return createSuccessResponse({
            user: {
                id: newUser.id,
                email: newUser.email,
                name: newUser.name,
                role: newUser.role,
                emailVerified: newUser.emailVerified,
                avatarUrl: newUser.avatarUrl,
            },
            needsProfileCompletion,
        })
    } catch (error) {
        console.error('[POST /api/auth/google]', error)
        return serverError('Google sign-in failed')
    }
}
