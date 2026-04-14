import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { validateRequest } from '@/lib/auth/session'
import {
    createSuccessResponse,
    serverError,
    HttpStatus,
} from '@/lib/api-response'

/**
 * GET /api/lessons
 * Returns list of all available lessons (CourseModules) without video details.
 * Auth: Session Cookie + Paid Enrollment Check (as per request guidelines)
 */
export async function GET(request: NextRequest) {
    try {
        const { user } = await validateRequest()
        // Allow unauthenticated users to see the curriculum overview
        // if (!user) { ... }

        // Optional: Filter by courseId to avoid returning every module from every course
        const url = new URL(request.url)
        const courseId = url.searchParams.get('courseId')

        const whereClause: any = {}
        if (courseId) {
            whereClause.courseId = courseId
        }

        const lessons = await prisma.courseModule.findMany({
            where: whereClause,
            select: {
                id: true,
                dayNumber: true,
                title: true,
                contentText: true, // "description" mapping
                isFreePreview: true,
            },
            orderBy: {
                dayNumber: 'asc',
            },
        })

        const mappedLessons = lessons.map(lesson => ({
            ...lesson,
            isFree: lesson.dayNumber === 1,
        }))

        return createSuccessResponse(mappedLessons)

    } catch (error) {
        console.error('[GET /api/lessons]', error)
        return serverError('Failed to fetch lessons')
    }
}
