'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Wallet, Users, Gift, Star, TrendingUp } from 'lucide-react';

const ReferralSection = () => {
  const router = useRouter();

  const steps = [
    {
      icon: Users,
      title: 'Share Your Link',
      description: 'Get a unique referral code after signup. Share it with friends via WhatsApp, email, or social media.',
      bg: '#A8E6FF',
    },
    {
      icon: Wallet,
      title: 'Earn ₹50/Purchase',
      description: 'Credits automatically added when your friend enrolls. Track your earnings in real-time dashboard.',
      bg: '#B8F0D8',
    },
    {
      icon: Gift,
      title: 'Unlock Pocket Money',
      description: 'Use accumulated credits to enroll in any track. No hidden charges or expiry dates.',
      bg: '#FFD4B8',
    }
  ];

  return (
    <section className="relative py-24 overflow-hidden" style={{ background: '#1a1a2e' }}>
      {/* Decorative elements */}
      <div className="absolute top-10 left-10 w-20 h-20 rounded-full opacity-20" style={{ background: '#FF6B9D' }} />
      <div className="absolute bottom-10 right-10 w-28 h-28 rounded-lg rotate-12 opacity-15" style={{ background: '#4ECDC4' }} />
      <div className="absolute top-1/2 right-1/3 w-12 h-12 rotate-45 opacity-10" style={{ background: '#A8E6FF' }} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center mb-16 animate-fade-in">
          {/* Badge */}
          <div className="relative inline-block mb-6">
            <span
              className="inline-block px-6 py-3 rounded-xl"
              style={{
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 700,
                fontSize: '16px',
                background: '#A8E6FF',
                color: '#1a1a2e',
                border: '3px solid #A8E6FF',
                boxShadow: '3px 3px 0 rgba(255,255,255,0.3)'
              }}
            >
              🎁 Limited Time Offer
            </span>
          </div>

          <h2
            className="mb-6 animate-fade-in animation-delay-200"
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 800,
              fontSize: 'clamp(32px, 8vw, 56px)',
              lineHeight: '1.1',
              color: '#ffffff'
            }}
          >
            Learn for Free?<br />
            <span style={{ color: '#A8E6FF' }}>Yes, It's Possible!</span>
          </h2>

          <p
            className="mb-4 animate-fade-in animation-delay-300"
            style={{
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 500,
              fontSize: 'clamp(16px, 3vw, 20px)',
              color: 'rgba(255,255,255,0.8)'
            }}
          >
            Refer friends and earn credits.
          </p>

          <div
            className="inline-block px-8 py-4 rounded-xl mb-12 animate-scale-in animation-delay-400"
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 800,
              fontSize: 'clamp(20px, 4vw, 28px)',
              background: '#A8E6FF',
              color: '#1a1a2e',
              border: '3px solid #A8E6FF',
              boxShadow: '5px 5px 0 rgba(255,255,255,0.2)'
            }}
          >
            1 Course = ₹50 🎉
          </div>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-6 md:gap-8 mb-12">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={index} className="animate-fade-in-up" style={{ animationDelay: `${500 + index * 100}ms` }}>
                <div
                  className="rounded-2xl p-8 relative transition-all duration-150 cursor-pointer hover:translate-x-[-2px] hover:translate-y-[-2px]"
                  style={{
                    background: step.bg,
                    border: '3px solid #1a1a2e',
                    boxShadow: '5px 5px 0 #1a1a2e',
                  }}
                >
                  {/* Icon */}
                  <div
                    className="w-16 h-16 rounded-xl flex items-center justify-center mb-6"
                    style={{ background: '#fff', border: '3px solid #1a1a2e', boxShadow: '3px 3px 0 #1a1a2e' }}
                  >
                    <Icon className="w-8 h-8" style={{ color: '#1a1a2e' }} strokeWidth={2.5} />
                  </div>

                  {/* Step Number */}
                  <div
                    className="absolute top-4 right-6"
                    style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: '48px', color: '#1a1a2e', opacity: 0.15 }}
                  >
                    {index + 1}
                  </div>

                  <h3 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: 'clamp(20px, 3vw, 24px)', color: '#1a1a2e', marginBottom: '12px' }}>
                    {step.title}
                  </h3>

                  <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 500, fontSize: '15px', lineHeight: '1.6', color: '#1a1a2e', opacity: 0.8 }}>
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="text-center animate-fade-in animation-delay-800">
          <button
            onClick={() => router.push('/dashboard/referrals')}
            className="neo-btn neo-btn-primary px-12 py-5 text-lg"
            style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: '18px' }}
          >
            <span className="flex items-center justify-center gap-3">
              GET YOUR REFERRAL LINK
              <TrendingUp className="w-6 h-6" />
            </span>
          </button>

          <p className="mt-4 animate-fade-in animation-delay-1000"
            style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 500, fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>
            Join 2,500+ students already earning credits
          </p>
        </div>
      </div>
    </section>
  );
};

export default ReferralSection;
