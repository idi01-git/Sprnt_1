'use client';

import { useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Sparkles, TrendingUp, ArrowRight } from 'lucide-react';

const heroMain = '/images/right_vector2.png';

const HeroSection = () => {
  const imgRef = useRef<HTMLDivElement | null>(null);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24 pb-20" style={{ background: '#E0F7FF' }}>
      {/* Neo Brutalism Decorative Elements */}
      <div className="absolute top-10 left-5 w-32 h-32 rounded-full opacity-40 animate-float" style={{ background: '#FF6B9D' }} />
      <div className="absolute bottom-20 right-16 w-24 h-24 rounded-lg rotate-12 opacity-30 animate-float animation-delay-500" style={{ background: '#4ECDC4' }} />
      <div className="absolute top-1/3 right-1/4 w-16 h-16 rotate-45 opacity-20" style={{ background: '#A8E6FF', border: '3px solid #1a1a2e' }} />
      <div className="absolute bottom-1/3 left-1/4 w-12 h-12 rounded-full opacity-25" style={{ background: '#B084FF' }} />

      {/* Dot pattern */}
      <div className="absolute inset-0 neo-pattern opacity-30 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Content */}
          <div className="animate-fade-in-up">
            <h1
              className="mb-8 animate-fade-in animation-delay-400"
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 900,
                fontSize: '64px',
                lineHeight: '1.2',
                color: '#1a1a2e'
              }}
            >
              Get Industrial Experience in{' '}
              <span className="relative inline-block translate-y-4">
                <span style={{ background: '#FF6B9D', padding: '4px 12px', borderRadius: '12px', border: '3px solid #1a1a2e' }}>
                  14 Days
                </span>
              </span>
            </h1>

            <p
              className="mb-12 animate-fade-in animation-delay-500"
              style={{
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 500,
                fontSize: '20px',
                lineHeight: '1.7',
                color: '#1a1a2e',
                opacity: 0.9
              }}
            >
              Tool-specific virtual internships for Core Engineers.{' '}
              <span className="font-bold" style={{ background: '#B084FF', padding: '1px 6px', borderRadius: '4px' }}>Verified by Faculty.</span>{' '}
              <span className="font-bold" style={{ background: '#4ECDC4', padding: '1px 6px', borderRadius: '4px' }}>Accepted by Industry.</span>
            </p>

            <div className="flex flex-wrap gap-5 animate-fade-in animation-delay-600">
              <button
                onClick={() => document.getElementById('courses')?.scrollIntoView({ behavior: 'smooth' })}
                className="neo-btn neo-btn-primary px-10 py-5"
                style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: 700,
                  fontSize: '18px'
                }}
              >
                <span className="flex items-center gap-3">
                  EXPLORE INTERNSHIPS
                  <TrendingUp className="w-6 h-6" />
                </span>
              </button>

              <Link
                href="/courses/full-stack-web-development/day-1"
                className="neo-btn bg-white px-10 py-5 flex items-center gap-2"
                style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: 700,
                  fontSize: '18px',
                  color: '#1a1a2e'
                }}
              >
                TRY FREE
                <ArrowRight className="w-5 h-5 ml-1" />
              </Link>
            </div>
          </div>

          {/* Right Content - Image */}
          <div className="relative animate-fade-in-right animation-delay-400">
            <div className="flex justify-center">
              <div
                ref={imgRef}
                className="relative rounded-2xl overflow-hidden"
                style={{ border: '4px solid #1a1a2e', boxShadow: '8px 8px 0 #1a1a2e' }}
              >
                <Image
                  src={heroMain}
                  alt="Engineering Software"
                  width={600}
                  height={400}
                  className="w-full h-auto object-cover"
                  priority
                />
              </div>
            </div>

            {/* Floating Element */}
            <div
              className="absolute -top-6 -right-6 w-20 h-20 rounded-2xl flex items-center justify-center animate-float"
              style={{ background: '#A8E6FF', border: '3px solid #1a1a2e', boxShadow: '4px 4px 0 #1a1a2e' }}
            >
              <Sparkles className="w-10 h-10" style={{ color: '#1a1a2e' }} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;