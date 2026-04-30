'use client';

import { Clock, Target, Code, Users } from 'lucide-react';

interface StatItem {
  label: string;
  value: string;
  icon: React.ElementType;
  bg: string;
}

const StatsLoop = () => {
  const stats: StatItem[] = [
    { label: 'Total Duration', value: '14 Days', icon: Clock, bg: '#B084FF' },
    { label: 'Learning Phases', value: '6 Stages', icon: Target, bg: '#4ECDC4' },
    { label: 'Active Projects', value: '1 Major', icon: Code, bg: '#95E77E' },
    { label: 'Students Enrolled', value: '15K+', icon: Users, bg: '#FF6B9D' },
  ];

  const duplicatedStats = [...stats, ...stats, ...stats];

  return (
    <div className="relative w-full overflow-hidden mb-16">
      {/* Fade edges */}
      <div
        className="absolute left-0 top-0 bottom-0 w-8 md:w-12 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to right, #E0F7FF, transparent)' }}
      />
      <div
        className="absolute right-0 top-0 bottom-0 w-8 md:w-12 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to left, #E0F7FF, transparent)' }}
      />

      {/* Scrolling container */}
      <div
        className="stats-loop-track flex items-center gap-6 py-4"
        style={{ animation: 'statsLoop 30s linear infinite', width: 'max-content' }}
      >
        {duplicatedStats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="flex-shrink-0" style={{ width: '180px' }}>
              <div
                className="rounded-2xl p-4 text-center cursor-pointer transition-all duration-150 hover:translate-x-[-2px] hover:translate-y-[-2px]"
                style={{
                  background: stat.bg,
                  border: '3px solid #1a1a2e',
                  boxShadow: '4px 4px 0 #1a1a2e',
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-2 mx-auto"
                  style={{ background: '#fff', border: '2px solid #1a1a2e' }}
                >
                  <Icon className="w-5 h-5" style={{ color: '#1a1a2e' }} />
                </div>

                <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: '20px', color: '#1a1a2e' }}>
                  {stat.value}
                </div>
                <div style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: '11px', color: '#1a1a2e', opacity: 0.7 }}>
                  {stat.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StatsLoop;
