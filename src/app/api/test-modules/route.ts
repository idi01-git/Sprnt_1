import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const courses = await prisma.course.findMany({
    select: {
      id: true,
      slug: true,
      courseId: true,
      _count: { select: { modules: true } }
    }
  });

  const modules = await prisma.courseModule.findMany({
    select: {
      id: true,
      courseId: true,
      dayNumber: true
    }
  });

  return NextResponse.json({ courses, modules });
}
