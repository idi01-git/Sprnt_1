'use client';

import { useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Sparkles, TrendingUp, Award, Users, ArrowRight } from 'lucide-react';

const heroMain = '/images/hero (1).svg';

const HeroSection = () => {
  const imgRef = useRef<HTMLDivElement | null>(null);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24 pb-20" style={{ background: '#FFF8E7' }}>
      {/* Neo Brutalism Decorative Elements */}
      <div className="absolute top-20 left-10 w-32 h-32 rounded-full opacity-40 animate-float" style={{ background: '#FF6B9D' }} />
      <div className="absolute bottom-20 right-16 w-24 h-24 rounded-lg rotate-12 opacity-30 animate-float animation-delay-500" style={{ background: '#4ECDC4' }} />
      <div className="absolute top-1/3 right-1/4 w-16 h-16 rotate-45 opacity-20" style={{ background: '#FFE156', border: '3px solid #1a1a2e' }} />
      <div className="absolute bottom-1/3 left-1/4 w-12 h-12 rounded-full opacity-25" style={{ background: '#B084FF' }} />
      
      {/* Dot pattern */}
      <div className="absolute inset-0 neo-pattern opacity-30 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Content */}
          <div className="animate-fade-in-up">
            {/* Badge */}
            <div
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl mb-6 animate-fade-in animation-delay-300"
              style={{ background: '#FFE156', border: '3px solid #1a1a2e', boxShadow: '3px 3px 0 #1a1a2e' }}
            >
              <Sparkles className="w-4 h-4" style={{ color: '#1a1a2e' }} />
              <span
                style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: 700,
                  fontSize: '14px',
                  color: '#1a1a2e',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}
              >
                Transform Your Career in 14 Days
              </span>
            </div>

            <h1
              className="mb-6 animate-fade-in animation-delay-400"
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 800,
                fontSize: '56px',
                lineHeight: '1.1',
                color: '#1a1a2e'
              }}
            >
              Get Industrial Experience in{' '}
              <span className="relative inline-block">
                <span style={{ background: '#FF6B9D', padding: '0 8px', borderRadius: '8px', border: '3px solid #1a1a2e' }}>
                  14 Days
                </span>
              </span>
            </h1>

            <p
              className="mb-8 animate-fade-in animation-delay-500"
              style={{
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 500,
                fontSize: '18px',
                lineHeight: '1.7',
                color: '#1a1a2e'
              }}
            >
              Tool-specific virtual internships for Core Engineers.{' '}
              <span className="font-bold" style={{ background: '#B084FF', padding: '1px 6px', borderRadius: '4px' }}>Verified by Faculty.</span>{' '}
              <span className="font-bold" style={{ background: '#4ECDC4', padding: '1px 6px', borderRadius: '4px' }}>Accepted by Industry.</span>
            </p>

            <div className="flex flex-wrap gap-4 mb-10 animate-fade-in animation-delay-600">
              <button
                onClick={() => document.getElementById('courses')?.scrollIntoView({ behavior: 'smooth' })}
                className="neo-btn neo-btn-primary px-8 py-4"
                style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: 700,
                  fontSize: '16px'
                }}
              >
                <span className="flex items-center gap-2">
                  EXPLORE INTERNSHIPS
                  <TrendingUp className="w-5 h-5" />
                </span>
              </button>

              <Link
                href="/courses/full-stack-web-development/day-1"
                className="neo-btn bg-white px-8 py-4 flex items-center gap-2"
                style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: 700,
                  fontSize: '16px',
                  color: '#1a1a2e'
                }}
              >
                TRY FREE
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="grid grid-cols-3 gap-4 animate-fade-in animation-delay-800">
              {[
                { icon: Users, value: '10K+', label: 'Students', bg: '#FF6B9D' },
                { icon: Award, value: '98%', label: 'Success Rate', bg: '#4ECDC4' },
                { icon: Sparkles, value: '4.9/5', label: 'Rating', bg: '#FFE156' }
              ].map((stat, index) => (
                <div
                  key={index}
                  className="text-center p-4 rounded-xl"
                  style={{ background: '#fff', border: '3px solid #1a1a2e', boxShadow: '3px 3px 0 #1a1a2e' }}
                >
                  <div className="flex items-center justify-center mb-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: stat.bg, border: '2px solid #1a1a2e' }}>
                      <stat.icon className="w-4 h-4" style={{ color: '#1a1a2e' }} />
                    </div>
                  </div>
                  <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: '20px', color: '#1a1a2e' }}>
                    {stat.value}
                  </div>
                  <div style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: '13px', color: '#1a1a2e', opacity: 0.6 }}>
                    {stat.label}
                  </div>
                </div>
              ))}
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
              style={{ background: '#FFE156', border: '3px solid #1a1a2e', boxShadow: '4px 4px 0 #1a1a2e' }}
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