import { prisma } from '@/lib/db'
import { requireAdminOrAbove, AuthError } from '@/lib/auth/guards'
import {
    createSuccessResponse,
    createErrorResponse,
    badRequest,
    notFound,
    conflict,
    serverError,
    HttpStatus,
    ErrorCode,
} from '@/lib/api-response'
import { adminCreateModuleSchema } from '@/lib/validations/admin'

// =============================================================================
// GET /api/admin/courses/[courseId]/modules — List modules
// =============================================================================

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ courseId: string }> },
) {
    try {
        await requireAdminOrAbove()
        const { courseId } = await params

        const course = await prisma.course.findUnique({
            where: { courseId },
            select: { id: true, totalDays: true },
        })
        if (!course) return notFound('Course')

        const modules = await prisma.courseModule.findMany({
            where: { courseId: course.id },
            orderBy: { dayNumber: 'asc' },
            select: {
                id: true,
                courseId: true,
                dayNumber: true,
                title: true,
                isFreePreview: true,
                updatedAt: true,
                contentText: true,
                transcriptText: true,
                youtubeUrl: true,
                notesPdfUrl: true,
                createdAt: true,
            },
        })

        return createSuccessResponse({
            modules: modules.map(m => ({
                ...m,
                createdAt: m.createdAt.toISOString(),
                updatedAt: m.updatedAt.toISOString(),
            })),
        })
    } catch (error) {
        if (error instanceof AuthError) {
            return createErrorResponse(ErrorCode.ADMIN_AUTH_REQUIRED, 'Admin authentication required', HttpStatus.UNAUTHORIZED)
        }
        console.error('[GET /api/admin/courses/[courseId]/modules]', error)
        return serverError()
    }
}

// =============================================================================
// POST /api/admin/courses/[courseId]/modules — Create module
// =============================================================================

export async function POST(
    request: Request,
    { params }: { params: Promise<{ courseId: string }> },
) {
    try {
        await requireAdminOrAbove()
        const { courseId } = await params

        const course = await prisma.course.findUnique({
            where: { courseId },
            select: { id: true, totalDays: true },
        })
        if (!course) return notFound('Course')

        const body = await request.json().catch(() => null)
        if (!body) return badRequest('Invalid JSON body')

        const parsed = adminCreateModuleSchema.safeParse(body)
        if (!parsed.success) {
            return badRequest('Validation failed', {
                errors: parsed.error.flatten().fieldErrors,
            })
        }

        const data = parsed.data

        if (data.dayNumber > course.totalDays) {
            return badRequest(`Day number must be between 1 and ${course.totalDays}`)
        }

        // Check unique day number constraint
        const existing = await prisma.courseModule.findFirst({
            where: {
                courseId: course.id,
                dayNumber: data.dayNumber,
            },
        })

        if (existing) {
            return conflict(`Module for Day ${data.dayNumber} already exists`)
        }

        const module = await prisma.$transaction(async (tx) => {
            const createdModule = await tx.courseModule.create({
                data: {
                    courseId: course.id,
                    dayNumber: data.dayNumber,
                    title: data.title,
                    contentText: data.contentText ?? '',
                    transcriptText: data.transcriptText ?? null,
                    youtubeUrl: data.youtubeUrl ?? null,
                    notesPdfUrl: data.notesPdfUrl ?? null,
                    isFreePreview: data.isFreePreview ?? false,
                },
            })

            if (data.quizQuestions.length > 0) {
                await tx.quizQuestion.createMany({
                    data: data.quizQuestions.map((question, index) => {
                        const correctOptionIndex = question.options.findIndex((option) => option.isCorrect)
                        return {
                            moduleId: createdModule.id,
                            questionText: question.question,
                            options: question.options.map((option) => option.text),
                            correctOptionIndex,
                            orderIndex: index,
                        }
                    }),
                })
            }

            return createdModule
        })

        return createSuccessResponse({
            module: {
                ...module,
                createdAt: module.createdAt.toISOString(),
                updatedAt: module.updatedAt.toISOString(),
            },
        }, HttpStatus.CREATED)
    } catch (error) {
        if (error instanceof AuthError) {
            return createErrorResponse(ErrorCode.ADMIN_AUTH_REQUIRED, 'Admin authentication required', HttpStatus.UNAUTHORIZED)
        }
        console.error('[POST /api/admin/courses/[courseId]/modules]', error)
        return serverError()
    }
}
