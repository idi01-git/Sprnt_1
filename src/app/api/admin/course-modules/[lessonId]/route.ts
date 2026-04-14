import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { createSuccessResponse, serverError, createErrorResponse, ErrorCode, HttpStatus } from '@/lib/api-response';
import { extractYouTubeId } from '@/lib/youtube';

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const { lessonId } = await params;
    const body = await req.json();
    const { title, description, youtubeUrl } = body;

    if (!title || !description) {
        return createErrorResponse(ErrorCode.VALIDATION_ERROR, 'Title and description are required', HttpStatus.BAD_REQUEST);
    }

    // Extract video URL if URL provided (store full URL, not just ID)
    let youtubeUrlToSave = body.youtubeUrl || null;

    const updatedModule = await prisma.courseModule.update({
        where: { id: lessonId },
        data: {
            title,
            contentText: description,
            youtubeUrl: youtubeUrlToSave
        }
    });

    return createSuccessResponse(updatedModule);
  } catch (error) {
    console.error('[ADMIN_UPDATE_COURSE_ERROR]', error);
    return serverError('Failed to update course module');
  }
}
