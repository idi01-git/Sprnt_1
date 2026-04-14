import { NextRequest } from 'next/server';
import { createErrorResponse } from '@/lib/api-response';
import { ErrorCode, HttpStatus } from '@/lib/api-response';

// NOTE: OTP functionality is disabled pending schema review
// TODO: Re-enable once OtpCode model is added to Prisma schema

export async function POST(req: NextRequest) {
  return createErrorResponse(
    ErrorCode.SERVICE_UNAVAILABLE,
    'OTP sign-in is not supported in the current version.',
    HttpStatus.SERVICE_UNAVAILABLE
  );
}
