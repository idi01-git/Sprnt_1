'use client';

import React, { useState } from 'react';
import { Engineering, RocketLaunch, Psychology, WorkspacePremium } from '@mui/icons-material';

const ProblemSolution = () => {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  const features = [
    {
      icon: Engineering,
      label: 'FEATURE',
      title: 'Core Engineering Focus',
      description: 'Deep dive into specialized modules including Mechanical, Civil, Electrical, and Chemical Engineering with industry-standard tools.',
      bg: '#A8E6FF',
    },
    {
      icon: RocketLaunch,
      label: 'FEATURE',
      title: 'Real Startup Internships',
      description: 'Gain hands-on experience by solving actual problems for high-growth startups and established companies.',
      bg: '#E8D5FF',
    },
    {
      icon: Psychology,
      label: 'FEATURE',
      title: 'Expert Mentorship',
      description: '1-on-1 sessions with industry leaders from Fortune 500 companies and successful startup founders.',
      bg: '#FFD4B8',
    },
    {
      icon: WorkspacePremium,
      label: 'FEATURE',
      title: 'Global Certification',
      description: 'Receive industry-recognized credentials verified by faculty and accepted globally upon successful completion.',
      bg: '#B8F0D8',
    }
  ];

  return (
    <section className="relative py-24 overflow-hidden" style={{ background: '#FFF8E7' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Header */}
        <div className="text-center mb-16 animate-fade-in">
          <h2 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: 'clamp(32px, 6vw, 48px)', lineHeight: '1.1', color: '#1a1a2e' }}>
            The Sprintern Advantage
          </h2>
          <p className="max-w-3xl mx-auto mt-4" style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 500, fontSize: 'clamp(16px, 2.5vw, 18px)', lineHeight: '1.7', color: '#1a1a2e', opacity: 0.7 }}>
            Experience a premium, enterprise-grade learning environment focused on accelerating your engineering career
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-6 md:gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const isHovered = hoveredCard === index;

            return (
              <div
                key={index}
                className="relative transition-all duration-200 cursor-pointer"
                style={{
                  animationDelay: `${index * 100}ms`,
                }}
                onMouseEnter={() => setHoveredCard(index)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div
                  className="rounded-2xl p-8"
                  style={{
                    background: feature.bg,
                    border: '3px solid #1a1a2e',
                    boxShadow: isHovered ? '2px 2px 0 #1a1a2e' : '5px 5px 0 #1a1a2e',
                    transform: isHovered ? 'translate(3px, 3px)' : 'translate(0, 0)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {/* Label */}
                  <span
                    className="inline-block px-3 py-1 rounded-lg mb-4"
                    style={{
                      fontFamily: "'Poppins', sans-serif",
                      fontWeight: 700,
                      fontSize: '11px',
                      letterSpacing: '0.1em',
                      background: '#fff',
                      border: '2px solid #1a1a2e',
                      color: '#1a1a2e'
                    }}
                  >
                    {feature.label}
                  </span>

                  {/* Icon + Title */}
                  <div className="flex items-start gap-4 mb-4">
                    <div
                      className="flex-shrink-0 w-16 h-16 rounded-xl flex items-center justify-center"
                      style={{ background: '#fff', border: '3px solid #1a1a2e', boxShadow: '3px 3px 0 #1a1a2e' }}
                    >
                      <Icon sx={{ fontSize: 32, color: '#1a1a2e' }} />
                    </div>
                    <h3
                      className="pt-2 flex-1"
                      style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: 'clamp(20px, 3vw, 24px)', lineHeight: '1.2', color: '#1a1a2e' }}
                    >
                      {feature.title}
                    </h3>
                  </div>

                  {/* Description */}
                  <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 500, fontSize: '16px', lineHeight: '1.6', color: '#1a1a2e', opacity: 0.8 }}>
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ProblemSolution;