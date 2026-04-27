'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Clock, Users, Star, CheckCircle2, Sparkles, Award } from 'lucide-react';
import type { Course } from '@/lib/api';

interface CourseCardProps {
  course: Course;
  index?: number;
  popular?: boolean;
  purchased?: boolean;
}

const getBranchColor = (branch: string): string => {
  const n = branch.toLowerCase();
  if (n.includes('chemical')) return '#FF6B9D';
  if (n.includes('civil')) return '#95E77E';
  if (n.includes('mechanical')) return '#B084FF';
  if (n.includes('electrical')) return '#4ECDC4';
  if (n.includes('electronic') || n.includes('ece')) return '#FFB347';
  if (n.includes('computer') || n.includes('it') || n.includes('cse') || n.includes('cs')) return '#A8E6FF';
  return '#E8D5FF';
};

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(price);
};

export function CourseCard({ course, index = 0, popular = false, purchased = false }: CourseCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const router = useRouter();
  const branchColor = getBranchColor(course.affiliatedBranch);
  const tags = Array.isArray(course.tags) ? course.tags : [];
  const features = tags.slice(0, 4);
  const tools = tags.slice(0, 3);

  const originalPrice = Math.round(course.coursePrice * 1.5);
  const hasDiscount = course.coursePrice < originalPrice;

  return (
    <Link
      href={`/courses/${course.slug}`}
      className="block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className="relative animate-fade-in-up"
        style={{ animationDelay: `${index * 100}ms` }}
      >
        {/* Popular Badge */}
        {popular && (
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20">
            <div
              className="flex items-center gap-2 px-4 py-1.5 rounded-xl"
              style={{
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 700,
                fontSize: '12px',
                background: '#A8E6FF',
                color: '#1a1a2e',
                border: '3px solid #1a1a2e',
                boxShadow: '3px 3px 0 #1a1a2e'
              }}
            >
              <Sparkles className="w-4 h-4" />
              MOST POPULAR
            </div>
          </div>
        )}

        {/* Card */}
        <div
          className="rounded-2xl overflow-hidden transition-all duration-150 cursor-pointer"
          style={{
            background: '#fff',
            border: '3px solid #1a1a2e',
            boxShadow: isHovered ? '2px 2px 0 #1a1a2e' : '5px 5px 0 #1a1a2e',
            transform: isHovered ? 'translate(3px, 3px)' : 'translate(0, 0)',
          }}
        >
          {/* Header */}
          <div className="relative p-5" style={{ background: branchColor }}>
            <div className="flex items-center justify-between mb-4">
              <span
                className="px-3 py-1 rounded-lg"
                style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: 700,
                  fontSize: '12px',
                  letterSpacing: '0.05em',
                  background: '#fff',
                  border: '2px solid #1a1a2e',
                  color: '#1a1a2e'
                }}
              >
                {course.affiliatedBranch}
              </span>

              <div
                className="flex items-center gap-1 px-3 py-1 rounded-lg"
                style={{ background: '#fff', border: '2px solid #1a1a2e' }}
              >
                <Star className="w-4 h-4" style={{ color: '#FFB347', fill: '#FFB347' }} />
                <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: '13px', color: '#1a1a2e' }}>
                  5.0
                </span>
              </div>
            </div>

            <h3
              className="mb-3"
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 800,
                fontSize: 'clamp(20px, 3vw, 24px)',
                lineHeight: '1.3',
                minHeight: '62px',
                color: '#1a1a2e'
              }}
            >
              {course.courseName}
            </h3>

            <div className="flex flex-wrap gap-2">
              {tools.map((tool, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 rounded-md"
                  style={{
                    fontFamily: "'Poppins', sans-serif",
                    fontWeight: 600,
                    fontSize: '11px',
                    background: 'rgba(255,255,255,0.7)',
                    border: '2px solid #1a1a2e',
                    color: '#1a1a2e'
                  }}
                >
                  {tool}
                </span>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="flex items-center gap-4 mb-6 pb-5" style={{ borderBottom: '2px solid #1a1a2e' }}>
              <div className="flex items-center gap-2" style={{ color: '#1a1a2e' }}>
                <Clock className="w-4 h-4" />
                <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: '14px' }}>14 Days</span>
              </div>
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#1a1a2e' }} />
              <div className="flex items-center gap-2" style={{ color: '#1a1a2e' }}>
                <Users className="w-4 h-4" />
                <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: '14px' }}>New</span>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              {features.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <div
                    className="shrink-0 w-5 h-5 rounded-md flex items-center justify-center mt-0.5"
                    style={{ background: '#95E77E', border: '2px solid #1a1a2e' }}
                  >
                    <CheckCircle2 className="w-3 h-3" style={{ color: '#1a1a2e' }} strokeWidth={3} />
                  </div>
                  <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 500, fontSize: '14px', lineHeight: '1.5', color: '#1a1a2e', opacity: 0.8 }}>
                    {feature}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="flex items-baseline gap-2">
                  <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: 'clamp(28px, 4vw, 32px)', color: '#1a1a2e' }}>
                    {formatPrice(course.coursePrice)}
                  </span>
                  {hasDiscount && (
                    <span className="line-through" style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 500, fontSize: '16px', color: '#999' }}>
                      {formatPrice(originalPrice)}
                    </span>
                  )}
                </div>
                {hasDiscount && (
                  <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: '12px', color: '#FF6B6B' }}>
                    Limited Time Offer
                  </span>
                )}
              </div>
              {purchased && (
                <span
                  className="rounded-xl px-3 py-1.5"
                  style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: '12px', background: '#95E77E', border: '2px solid #1a1a2e', color: '#1a1a2e' }}
                >
                  Purchased ✓
                </span>
              )}
            </div>

            {/* CTA Button */}
            <button
              onClick={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                try {
                  const res = await fetch('/api/auth/session', { credentials: 'include' });
                  const data = await res.json().catch(() => null);
                  if (data?.success && data?.data?.user) {
                    router.push(`/courses/${course.slug}`);
                  } else {
                    const returnUrl = `/courses/${course.slug}`;
                    router.push(`/login?redirect=${encodeURIComponent(returnUrl)}`);
                  }
                } catch {
                  const returnUrl = `/courses/${course.slug}`;
                  router.push(`/login?redirect=${encodeURIComponent(returnUrl)}`);
                }
              }}
              className="w-full neo-btn py-4 flex items-center justify-center gap-2"
              style={{
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 700,
                fontSize: '16px',
                background: branchColor,
                color: '#1a1a2e',
              }}
            >
              <Award className="w-5 h-5" />
              {purchased ? 'OPEN COURSE' : 'ENROLL NOW'}
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
