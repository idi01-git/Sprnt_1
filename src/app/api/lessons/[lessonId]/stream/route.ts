import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { validateRequest } from '@/lib/auth/session'
import { extractYouTubeId } from '@/lib/youtube'
import {
    createSuccessResponse,
    createErrorResponse,
    serverError,
    HttpStatus,
    ErrorCode,
} from '@/lib/api-response'

/**
 * GET /api/lessons/{lessonId}/stream
 * Returns the YouTube Video ID for a lesson (CourseModule) after validating enrollment.
 * Auth: Session Cookie
 */
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ lessonId: string }> }
) {
    try {
        const { lessonId } = await params

        if (!lessonId) {
            return createErrorResponse(
                ErrorCode.VALIDATION_ERROR,
                'Lesson ID is required',
                HttpStatus.BAD_REQUEST
            )
        }

        // 1. Fetch the lesson (CourseModule) with its course information
        const lesson = await prisma.courseModule.findUnique({
            where: { id: lessonId },
            select: {
                id: true,
                courseId: true,
                dayNumber: true,
                isFreePreview: true,
                youtubeUrl: true,
            },
        })

        if (!lesson) {
            return createErrorResponse(
                ErrorCode.NOT_FOUND,
                'Lesson not found',
                HttpStatus.NOT_FOUND
            )
        }

        // 2. Check Enrollment / Purchase Status (Skip if free preview)
        const isFree = lesson.dayNumber === 1;
        
        if (!isFree) {
            const { user } = await validateRequest();
            if (!user) {
                return NextResponse.json(
                    { success: false, data: null, error: { code: 'UNAUTHORIZED', message: 'Authentication required to view paid lessons' } },
                    { status: 401 }
                );
            }

            const enrollment = await prisma.enrollment.findFirst({
                where: {
                    userId: user.id,
                    courseId: lesson.courseId,
                    paymentStatus: 'success', // "successful purchase"
                    deletedAt: null,
                },
                select: { id: true },
            })

            if (!enrollment) {
                return NextResponse.json(
                    { success: false, data: null, error: { code: 'FORBIDDEN', message: 'Access denied: Enrollment or active purchase required' } },
                    { status: 403 }
                )
            }

            // Optional: Check if daily progress is unlocked (similar to existing implementation)
            // if (lesson.dayNumber > 1) { ... }
        }

        // 3. Extract YouTube ID from youtubeUrl
        if (!lesson.youtubeUrl) {
            return createErrorResponse(
                ErrorCode.NOT_FOUND,
                'Video stream not found for this lesson',
                HttpStatus.NOT_FOUND
            )
        }

        const videoId = extractYouTubeId(lesson.youtubeUrl)
        if (!videoId) {
            return createErrorResponse(
                ErrorCode.NOT_FOUND,
                'Video stream is invalid for this lesson',
                HttpStatus.NOT_FOUND
            )
        }

        return createSuccessResponse({ videoId })

    } catch (error) {
        console.error('[GET /api/lessons/[lessonId]/stream]', error)
        return serverError('Failed to fetch video stream')
    }
}
