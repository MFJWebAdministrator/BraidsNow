import React from 'react';
import { Shield, Clock, DollarSign, Users } from 'lucide-react';
import { BenefitCard } from '@/components/BenefitCard';

const benefits = [
  {
    icon: Shield,
    title: 'Secure & Protected',
    description: 'Every booking is protected with secure payments and verified stylist profiles.'
  },
  {
    icon: Clock,
    title: 'Flexible Scheduling',
    description: 'Book appointments that fit your schedule with real-time availability.'
  },
  {
    icon: DollarSign,
    title: 'Clear Pricing',
    description: 'Transparent pricing with no hidden fees. Pay deposits securely.'
  },
  {
    icon: Users,
    title: 'Expert Stylists',
    description: 'Access to a network of professional and experienced hair braiders.'
  }
] as const;

export function Benefits() {
  return (
    <div className="relative z-10">
      <div className="inline-flex items-center justify-center px-4 py-2 bg-[#3F0052]/10 rounded-full mb-8">
        <span className="text-[#3F0052] font-light tracking-normal">Why Choose BraidsNow</span>
      </div>
      
      <h2 className="text-4xl md:text-5xl font-light tracking-tight text-[#3F0052] mb-6 leading-tight">
        Join Our Growing
        <span className="block mt-2 bg-gradient-to-r from-[#3F0052] to-[#DFA801] bg-clip-text text-transparent">
          Stylist Community
        </span>
      </h2>
      
      <p className="text-xl text-black mb-12 font-light tracking-normal leading-relaxed">
        Experience the future of hair braiding services with our professional platform
        that connects talented stylists with clients seeking beautiful styles.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        {benefits.map((benefit) => (
          <BenefitCard key={benefit.title} {...benefit} />
        ))}
      </div>
    </div>
  );
}