'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Calendar, Zap, Target, Trophy, ChevronRight, CheckCircle2, Rocket, BookOpen, Code } from 'lucide-react';
import StatsLoop from './StatsLoop';

interface DayItem {
  day: string;
  phase: string;
  title: string;
  description: string;
  icon: React.ElementType;
  bg: string;
  iconBg: string;
  activities: string[];
}

export function Timeline() {
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);

  const roadmap: DayItem[] = [
    {
      day: 'Day 1-2', phase: 'Getting Started', title: 'Onboarding & Setup',
      description: 'Complete orientation and prepare your learning environment',
      icon: Rocket, bg: '#E8D5FF', iconBg: '#B084FF',
      activities: ['Platform walkthrough & orientation', 'Software installation & configuration', 'Access course materials & resources', 'Meet your mentor & cohort']
    },
    {
      day: 'Day 3-5', phase: 'Foundation', title: 'Core Concepts',
      description: 'Master fundamental theories and basic tool operations',
      icon: BookOpen, bg: '#A8E6FF', iconBg: '#4ECDC4',
      activities: ['Video lectures on fundamentals', 'Interactive tool demonstrations', 'Guided practice exercises', 'Knowledge check quizzes']
    },
    {
      day: 'Day 6-8', phase: 'Application', title: 'Hands-On Practice',
      description: 'Apply concepts through structured practical sessions',
      icon: Code, bg: '#B8F0D8', iconBg: '#95E77E',
      activities: ['Real-world case studies', 'Step-by-step tutorials', 'Problem-solving exercises', 'Peer collaboration sessions']
    },
    {
      day: 'Day 9-11', phase: 'Project Work', title: 'Industrial Project',
      description: 'Design and build your capstone engineering project',
      icon: Target, bg: '#BEE3F8', iconBg: '#A8E6FF',
      activities: ['Project specification analysis', 'Design & planning phase', 'Implementation with tools', 'Mentor feedback & iterations']
    },
    {
      day: 'Day 12-13', phase: 'Refinement', title: 'Optimization & Review',
      description: 'Perfect your project and prepare documentation',
      icon: Zap, bg: '#FFD4B8', iconBg: '#FFB347',
      activities: ['Project optimization', 'Documentation completion', 'Quality assurance testing', 'Presentation preparation']
    },
    {
      day: 'Day 14', phase: 'Completion', title: 'Certification',
      description: 'Final submission and receive verified certificate',
      icon: Trophy, bg: '#FFD4D4', iconBg: '#FF6B9D',
      activities: ['Final project submission', 'Faculty evaluation & review', 'Receive detailed feedback', 'Claim verified certificate']
    }
  ];

  return (
    <section id="roadmap" className="relative py-24 overflow-hidden" style={{ background: '#E0F7FF' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Header */}
        <div className="text-center mb-16 animate-fade-in">
          <div
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl mb-6"
            style={{ background: '#4ECDC4', border: '3px solid #1a1a2e', boxShadow: '3px 3px 0 #1a1a2e' }}
          >
            <Calendar className="w-5 h-5" style={{ color: '#1a1a2e' }} />
            <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: '13px', letterSpacing: '0.1em', color: '#1a1a2e', textTransform: 'uppercase' }}>
              YOUR LEARNING PATH
            </span>
          </div>

          <h2 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: 'clamp(36px, 7vw, 56px)', lineHeight: '1.1', color: '#1a1a2e' }}>
            14-Day Learning Roadmap
          </h2>

          <p className="max-w-3xl mx-auto mt-4" style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 500, fontSize: 'clamp(16px, 2.5vw, 18px)', lineHeight: '1.7', color: '#1a1a2e', opacity: 0.7 }}>
            A structured, intensive program designed to transform you into an industry-ready engineer in just two weeks
          </p>
        </div>

        <StatsLoop />

        {/* Timeline Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-16">
          {roadmap.map((item, index) => {
            const Icon = item.icon;
            const isHovered = hoveredDay === index;

            return (
              <div
                key={index}
                className="animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
                onMouseEnter={() => setHoveredDay(index)}
                onMouseLeave={() => setHoveredDay(null)}
              >
                <div
                  className="rounded-2xl overflow-hidden cursor-pointer transition-all duration-150"
                  style={{
                    background: item.bg,
                    border: '3px solid #1a1a2e',
                    boxShadow: isHovered ? '2px 2px 0 #1a1a2e' : '5px 5px 0 #1a1a2e',
                    transform: isHovered ? 'translate(3px, 3px)' : 'translate(0, 0)',
                  }}
                >
                  {/* Top color bar */}
                  <div className="h-[4px]" style={{ background: item.iconBg }} />

                  <div className="p-6 md:p-8">
                    {/* Icon & Day Badge */}
                    <div className="flex items-center justify-between mb-6">
                      <div
                        className="w-14 h-14 rounded-xl flex items-center justify-center"
                        style={{ background: item.iconBg, border: '3px solid #1a1a2e', boxShadow: '3px 3px 0 #1a1a2e' }}
                      >
                        <Icon className="w-7 h-7" style={{ color: '#1a1a2e' }} />
                      </div>
                      <div
                        className="px-4 py-2 rounded-xl"
                        style={{ background: '#fff', border: '2px solid #1a1a2e' }}
                      >
                        <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: '13px', color: '#1a1a2e' }}>
                          {item.day}
                        </span>
                      </div>
                    </div>

                    {/* Phase Label */}
                    <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#1a1a2e', opacity: 0.5 }}>
                      {item.phase}
                    </span>

                    {/* Title */}
                    <h3 className="mt-2 mb-3" style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: 'clamp(18px, 3vw, 22px)', lineHeight: '1.3', color: '#1a1a2e' }}>
                      {item.title}
                    </h3>

                    {/* Description */}
                    <p className="mb-6" style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 500, fontSize: '14px', lineHeight: '1.6', color: '#1a1a2e', opacity: 0.7 }}>
                      {item.description}
                    </p>

                    {/* Activities */}
                    <div className="space-y-2.5">
                      {item.activities.map((activity, actIdx) => (
                        <div key={actIdx} className="flex items-start gap-2.5">
                          <div className="shrink-0 w-5 h-5 rounded-md flex items-center justify-center mt-0.5"
                            style={{ background: item.iconBg, border: '2px solid #1a1a2e' }}>
                            <CheckCircle2 className="w-3 h-3" style={{ color: '#1a1a2e' }} strokeWidth={3} />
                          </div>
                          <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 500, fontSize: '13px', lineHeight: '1.5', color: '#1a1a2e', opacity: 0.8 }}>
                            {activity}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="text-center animate-fade-in animation-delay-600">
          <div className="inline-block rounded-2xl p-8 md:p-10" style={{ background: '#fff', border: '3px solid #1a1a2e', boxShadow: '8px 8px 0 #1a1a2e' }}>
            <h3 className="mb-3" style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: 'clamp(24px, 4vw, 32px)', color: '#1a1a2e' }}>
              Ready to Start Your Journey?
            </h3>
            <p className="mb-8 max-w-2xl mx-auto" style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 500, fontSize: 'clamp(14px, 2vw, 16px)', lineHeight: '1.6', color: '#1a1a2e', opacity: 0.6 }}>
              Join 15,000+ students who completed this roadmap and landed opportunities at top companies
            </p>
            <button
              onClick={() => {
                const el = document.getElementById('courses');
                if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
                window.location.href = '/courses';
              }}
              className="neo-btn neo-btn-pink px-10 py-5"
            >
              <span className="flex items-center gap-3" style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 'clamp(16px, 2.5vw, 18px)' }}>
                ENROLL NOW
                <ChevronRight className="w-5 h-5" />
              </span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
