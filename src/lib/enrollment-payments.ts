import { prisma } from '@/lib/db'
import { createOrder, PaymentError, verifyPayment } from '@/lib/payments'
import { ErrorCode } from '@/lib/api-response'
import { paymentEnv } from '@/lib/env'

const REFERRAL_AMOUNT = 50

export interface CreateEnrollmentOrderInput {
    readonly userId: string
    readonly courseId: string
    readonly promocode?: string
}

export interface EnrollmentOrderResult {
    readonly orderId: string
    readonly amount: number
    readonly currency: string
    readonly keyId: string | undefined
    readonly enrollmentId: string
    readonly courseName: string
    readonly originalPrice: number
    readonly discountAmount: number
    readonly finalAmount: number
    readonly userName: string | null
    readonly userEmail: string | null
    readonly userPhone: string | null
}

export async function createEnrollmentOrder(
    input: CreateEnrollmentOrderInput,
): Promise<EnrollmentOrderResult> {
    const { userId, courseId, promocode } = input

    const course = await prisma.course.findFirst({
        where: {
            OR: [{ id: courseId }, { courseId }],
            isActive: true,
            deletedAt: null,
        },
        select: { id: true, courseId: true, courseName: true, coursePrice: true },
    })

    if (!course) {
        throw new PaymentError('Course not found', ErrorCode.COURSE_NOT_FOUND, 404)
    }

    const fullUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true, phone: true },
    })

    if (!fullUser) {
        throw new PaymentError('User not found', ErrorCode.AUTH_REQUIRED, 401)
    }

    const existingEnrollment = await prisma.enrollment.findUnique({
        where: {
            userId_courseId: {
                userId,
                courseId: course.id,
            },
        },
        select: { id: true, paymentStatus: true },
    })

    if (existingEnrollment?.paymentStatus === 'success') {
        throw new PaymentError(
            'You are already enrolled in this course',
            ErrorCode.COURSE_ALREADY_ENROLLED,
            409,
        )
    }

    const coursePrice = Number(course.coursePrice)
    let discountAmount = 0
    let promocodeUsed: string | null = null
    const normalizedPromocode = promocode?.trim().toUpperCase()

    if (normalizedPromocode) {
        const promo = await prisma.promocode.findUnique({
            where: { code: normalizedPromocode },
            select: {
                id: true,
                code: true,
                discountType: true,
                discountValue: true,
                maxDiscount: true,
                usageLimit: true,
                usageCount: true,
                perUserLimit: true,
                validFrom: true,
                validUntil: true,
                isActive: true,
                deletedAt: true,
            },
        })

        const now = new Date()
        if (promo?.isActive && !promo.deletedAt && now >= promo.validFrom && now <= promo.validUntil) {
            const globalUsageAllowed = promo.usageLimit === null || promo.usageCount < promo.usageLimit
            const userUsageCount = await prisma.promocodeUsage.count({
                where: { promocodeId: promo.id, userId },
            })
            const perUserUsageAllowed = userUsageCount < promo.perUserLimit

            if (globalUsageAllowed && perUserUsageAllowed) {
                if (promo.discountType === 'percentage') {
                    discountAmount = Math.round((coursePrice * Number(promo.discountValue)) / 100)
                    if (promo.maxDiscount !== null) {
                        discountAmount = Math.min(discountAmount, Number(promo.maxDiscount))
                    }
                } else {
                    discountAmount = Number(promo.discountValue)
                }

                discountAmount = Math.min(discountAmount, coursePrice)
                promocodeUsed = promo.code
            }
        }
    }

    const finalAmount = coursePrice - discountAmount
    if (finalAmount <= 0) {
        throw new PaymentError(
            'Payment amount must be greater than zero',
            ErrorCode.VALIDATION_ERROR,
            400,
        )
    }

    const enrollment = existingEnrollment
        ? await prisma.enrollment.update({
            where: { id: existingEnrollment.id },
            data: {
                amountPaid: finalAmount,
                discountAmount,
                promocodeUsed,
                paymentStatus: 'pending',
            },
            select: { id: true },
        })
        : await prisma.enrollment.create({
            data: {
                userId,
                courseId: course.id,
                amountPaid: finalAmount,
                discountAmount,
                promocodeUsed,
                paymentStatus: 'pending',
            },
            select: { id: true },
        })

    const order = await createOrder({
        amountInr: finalAmount,
        receipt: `enroll_${enrollment.id}`,
        notes: {
            enrollmentId: enrollment.id,
            userId,
            courseId: course.id,
            courseName: course.courseName,
        },
    })

    await prisma.enrollment.update({
        where: { id: enrollment.id },
        data: { paymentGatewayOrderId: order.id },
    })

    return {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: paymentEnv.keyId,
        enrollmentId: enrollment.id,
        courseName: course.courseName,
        originalPrice: coursePrice,
        discountAmount,
        finalAmount,
        userName: fullUser.name,
        userEmail: fullUser.email,
        userPhone: fullUser.phone,
    }
}

export interface VerifyEnrollmentPaymentInput {
    readonly userId: string
    readonly razorpayOrderId: string
    readonly razorpayPaymentId: string
    readonly razorpaySignature: string
}

export interface VerifyEnrollmentPaymentResult {
    readonly enrollmentId: string
    readonly status: 'success'
    readonly message: string
}

export async function verifyEnrollmentPayment(
    input: VerifyEnrollmentPaymentInput,
): Promise<VerifyEnrollmentPaymentResult> {
    const { userId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = input

    const isValidPayment = verifyPayment(
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
    )

    if (!isValidPayment) {
        throw new PaymentError(
            'Payment signature verification failed',
            ErrorCode.PAYMENT_VERIFICATION_FAILED,
            400,
        )
    }

    const enrollment = await prisma.enrollment.findUnique({
        where: { paymentGatewayOrderId: razorpayOrderId },
        select: {
            id: true,
            userId: true,
            courseId: true,
            paymentStatus: true,
            promocodeUsed: true,
            discountAmount: true,
            amountPaid: true,
        },
    })

    if (!enrollment) {
        throw new PaymentError(
            'Enrollment not found for this order',
            ErrorCode.ENROLLMENT_NOT_FOUND,
            404,
        )
    }

    if (enrollment.userId !== userId) {
        throw new PaymentError(
            'You do not own this enrollment',
            ErrorCode.ENROLLMENT_ACCESS_DENIED,
            403,
        )
    }

    if (enrollment.paymentStatus === 'success') {
        return {
            enrollmentId: enrollment.id,
            status: 'success',
            message: 'Payment already verified',
        }
    }

    const courseWithModules = await prisma.course.findUnique({
        where: { id: enrollment.courseId },
        select: { totalDays: true, _count: { select: { modules: true } } },
    })
    const moduleCount = courseWithModules?.totalDays || courseWithModules?._count.modules || 7

    await prisma.$transaction(async (tx) => {
        await tx.enrollment.update({
            where: { id: enrollment.id },
            data: {
                paymentStatus: 'success',
                paymentGatewayPaymentId: razorpayPaymentId,
            },
        })

        const progressRows = Array.from({ length: moduleCount }, (_, index) => ({
            enrollmentId: enrollment.id,
            dayNumber: index + 1,
            isLocked: index !== 0,
            unlockedAt: index === 0 ? new Date() : null,
        }))

        await tx.dailyProgress.createMany({
            data: progressRows,
            skipDuplicates: true,
        })

        await tx.transaction.create({
            data: {
                userId,
                transactionType: 'course_purchase',
                amount: enrollment.amountPaid,
                paymentMethod: 'razorpay',
                enrollmentId: enrollment.id,
                gatewayTransactionId: razorpayPaymentId,
                gatewayStatus: 'captured',
                status: 'completed',
            },
        })

        if (enrollment.promocodeUsed) {
            const promo = await tx.promocode.findUnique({
                where: { code: enrollment.promocodeUsed },
                select: { id: true },
            })

            if (promo) {
                await tx.promocodeUsage.create({
                    data: {
                        promocodeId: promo.id,
                        userId,
                        enrollmentId: enrollment.id,
                        discountApplied: enrollment.discountAmount,
                    },
                })

                await tx.promocode.update({
                    where: { id: promo.id },
                    data: { usageCount: { increment: 1 } },
                })
            }
        }

        const refereeUser = await tx.user.findUnique({
            where: { id: enrollment.userId },
            select: { referredBy: true },
        })

        if (refereeUser?.referredBy) {
            const existingReferral = await tx.referral.findFirst({
                where: { refereeId: enrollment.userId },
                select: { id: true },
            })

            if (!existingReferral) {
                const referrer = await tx.user.findUnique({
                    where: { id: refereeUser.referredBy },
                    select: { referralCode: true },
                })

                const autoApproveAt = new Date()
                autoApproveAt.setDate(autoApproveAt.getDate() + 7)

                await tx.referral.create({
                    data: {
                        referrerId: refereeUser.referredBy,
                        refereeId: enrollment.userId,
                        referralCodeUsed: referrer?.referralCode || '',
                        status: 'pending',
                        amount: REFERRAL_AMOUNT,
                        autoApproveAt,
                    },
                })
            }
        }
    })

    return {
        enrollmentId: enrollment.id,
        status: 'success',
        message: 'Payment verified and enrollment activated',
    }
}
