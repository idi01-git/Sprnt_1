import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { getQuizConfig } from '@/lib/quiz'
import { buildYouTubeEmbedUrl } from '@/lib/youtube'
import {
    createSuccessResponse,
    createErrorResponse,
    serverError,
    HttpStatus,
    ErrorCode,
} from '@/lib/api-response'

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params

        const course = await prisma.course.findFirst({
            where: { slug, isActive: true, deletedAt: null },
            select: { id: true, courseId: true, courseName: true, coursePrice: true },
        })

        if (!course) {
            return createErrorResponse(
                ErrorCode.COURSE_NOT_FOUND,
                `Course '${slug}' not found`,
                HttpStatus.NOT_FOUND
            )
        }

        const day1Module = await prisma.courseModule.findUnique({
            where: {
                courseId_dayNumber: {
                    courseId: course.id,
                    dayNumber: 1,
                },
            },
            select: {
                id: true,
                dayNumber: true,
                title: true,
                contentText: true,
                notesPdfUrl: true,
                youtubeUrl: true,
                isFreePreview: true,
                quizQuestions: true,
            },
        })

        if (!day1Module) {
            return createErrorResponse(
                ErrorCode.NOT_FOUND,
                'Day 1 module not found for this course',
                HttpStatus.NOT_FOUND
            )
        }

        // Fetch quiz questions for Day 1
        const quizQuestions = await prisma.quizQuestion.findMany({
            where: { moduleId: day1Module.id },
            select: {
                id: true,
                questionText: true,
                options: true,
                correctOptionIndex: true,
                orderIndex: true,
            },
            orderBy: { orderIndex: 'asc' },
        })

        // Get quiz config for pass percentage
        const config = await getQuizConfig()
        const passScore = Math.ceil(quizQuestions.length * (config.passPercentage / 100))

        let quizData = null;
        if (day1Module.quizQuestions) {
             const questions = Array.isArray(day1Module.quizQuestions) 
                  ? day1Module.quizQuestions 
                  : [];
             
             if (questions.length > 0) {
                 quizData = {
                     passingScore: Math.ceil(questions.length * 0.7), // Default to 70% passing
                     questions: questions.map((q: any) => ({
                         id: q.id || Math.random(),
                         question: q.question,
                         options: q.options || []
                     }))
                 };
             }
        }

        return createSuccessResponse({
            day: {
                id: day1Module.id,
                dayNumber: day1Module.dayNumber,
                title: day1Module.title,
                description: day1Module.contentText || '',
                content: day1Module.contentText || '',
                videoUrl: day1Module.youtubeUrl ? buildYouTubeEmbedUrl(day1Module.youtubeUrl) : null,
                isFreePreview: day1Module.isFreePreview,
                courseData: {
                    id: course.courseId,
                    name: course.courseName,
                    price: course.coursePrice,
                    slug: slug
                },
                resources: day1Module.notesPdfUrl
                    ? [{ title: 'Download Notes', url: day1Module.notesPdfUrl }]
                    : [],
                quiz: quizData
            },
        })
    } catch (error) {
        console.error('[GET /api/courses/[slug]/modules/day-1/preview]', error)
        return serverError('Failed to fetch day 1 preview')
    }
}
