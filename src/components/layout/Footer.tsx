'use client';

import { Mail, Phone, MapPin, Instagram, Linkedin, Send } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

const footerLinks = {
  product: [
    { name: 'Courses', href: '/courses' },
    { name: 'How It Works', href: '/#roadmap' },
    { name: 'Pricing', href: '/courses' },
    { name: 'Verify Certificate', href: '/verify' }
  ],
  company: [
    { name: 'About Us', href: '/' },
    { name: 'Careers', href: '/courses' },
    { name: 'Blog', href: '/' },
    { name: 'Press Kit', href: '/' }
  ],
  support: [
    { name: 'Help Center', href: '/verify' },
    { name: 'Contact Us', href: '/' },
    { name: 'FAQ', href: '/#roadmap' },
    { name: 'Community', href: '/courses' }
  ],
  legal: [
    { name: 'Terms of Service', href: '/' },
    { name: 'Privacy Policy', href: '/' },
    { name: 'Cookie Policy', href: '/' },
    { name: 'Refund Policy', href: '/' }
  ]
};

const socialLinks = [
  { icon: Instagram, href: 'https://www.instagram.com/idi01_insta?igsh=c2ljZzNkYmpyMm55', bg: '#FF6B9D' },
  { icon: Linkedin, href: 'https://www.linkedin.com/company/sprintern/', bg: '#A8E6FF' },
];

export function Footer() {
  return (
    <footer className="relative overflow-hidden pt-12" style={{ background: '#FFF8E7', color: '#1a1a2e' }}>
      {/* Top border - thick neo-brutalist line */}
      <div className="h-[6px] w-full bg-[#1a1a2e]" />

      <div className="max-w-7xl mx-auto px-6 py-20 relative z-10">
        {/* Newsletter / CTA Section */}
        <div className="mb-20 p-8 rounded-3xl bg-[#FFE156] border-[4px] border-[#1a1a2e] flex flex-col md:flex-row items-center justify-between gap-8" style={{ boxShadow: '10px 10px 0 #1a1a2e' }}>
          <div className="max-w-md">
            <h3 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: '32px', lineHeight: '1.1', color: '#1a1a2e' }}>
              JOIN THE SPRINTERN.
            </h3>
            <p className="mt-2" style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: '16px', color: '#1a1a2e', opacity: 0.8 }}>
              Get the latest course updates and engineering tips directly in your inbox.
            </p>
          </div>
          <div className="w-full md:w-auto flex gap-3">
            <input 
              type="email" 
              placeholder="your@email.com" 
              className="neo-input flex-1 md:w-64 bg-white"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            />
            <button className="neo-btn neo-btn-primary p-4 aspect-square flex items-center justify-center">
              <Send className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Main Section */}
        <div className="grid md:grid-cols-2 lg:grid-cols-6 gap-12 mb-16">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="inline-block p-4 bg-white rounded-2xl border-[3px] border-[#1a1a2e] mb-8" style={{ boxShadow: '5px 5px 0 #1a1a2e' }}>
              <Image
                src="/images/logo1.png"
                alt="Sprintern logo"
                width={460}
                height={300}
                className="h-10 w-40 object-cover -mt-3"
              />
            </div>
            <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: '16px', lineHeight: '1.7', color: '#1a1a2e', opacity: 0.8 }}>
              Transform your career with industry-standard tools and real-world projects in just 14 days. Verified by faculty, trusted by industry.
            </p>

            {/* Social */}
            <div className="flex gap-4 mt-8">
              {socialLinks.map((social, i) => (
                <a
                  key={i}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                  className="w-12 h-12 rounded-xl flex items-center justify-center transition-all border-[3px] border-[#1a1a2e] hover:translate-x-[-2px] hover:translate-y-[-2px]"
                  style={{ background: social.bg, boxShadow: '4px 4px 0 #1a1a2e' }}
                >
                  <social.icon className="w-6 h-6" style={{ color: '#1a1a2e' }} />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: '18px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#1a1a2e', marginBottom: '2rem' }}>
                {category}
              </h4>
              <ul className="space-y-4">
                {links.map((link, i) => (
                  <li key={i}>
                    <Link
                      href={link.href}
                      className="relative inline-block transition-all text-[#1a1a2e] opacity-70 hover:opacity-100 hover:text-[#FF6B9D] hover:-translate-y-0.5 group pb-1"
                      style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: '15px' }}
                    >
                      {link.name}
                      <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-[#1a1a2e] transition-all duration-300 group-hover:w-full" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Contact Strip */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {[
            { icon: Mail, text: 'support@sprintern.com', label: 'Email Us', bg: '#A8E6FF' },
            { icon: Phone, text: '+91 98765 43210', label: 'Call Us', bg: '#95E77E' },
            { icon: MapPin, text: 'Lucknow, India', label: 'Visit Us', bg: '#FFD4B8' }
          ].map((c, i) => (
            <div 
              key={i} 
              className="flex items-center gap-5 p-5 rounded-2xl border-[3px] border-[#1a1a2e] bg-white transition-all hover:translate-x-[-2px] hover:translate-y-[-2px]" 
              style={{ boxShadow: '6px 6px 0 #1a1a2e' }}
            >
              <div className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 border-[3px] border-[#1a1a2e]" style={{ background: c.bg }}>
                <c.icon className="w-7 h-7" style={{ color: '#1a1a2e' }} />
              </div>
              <div>
                <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: '12px', fontWeight: 800, color: '#1a1a2e', opacity: 0.5, textTransform: 'uppercase' }}>{c.label}</div>
                <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: '15px', fontWeight: 800, color: '#1a1a2e' }}>{c.text}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="pt-10 border-t-[3px] border-[#1a1a2e]">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <p style={{ fontFamily: "'Poppins', sans-serif", fontSize: '14px', fontWeight: 700, color: '#1a1a2e', opacity: 0.6 }}>
              © 2026 SPRINTERN. ALL RIGHTS RESERVED. MADE BY CORE ENGINEERS.
            </p>
            <div className="flex items-center gap-8">
              {['Status', 'Sitemap'].map(t => (
                <a key={t} href="#" style={{ fontFamily: "'Poppins', sans-serif", fontSize: '14px', fontWeight: 800, color: '#1a1a2e', opacity: 0.6 }}
                  className="hover:text-[#FF6B9D] transition-all"
                >
                  {t}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
