import React from 'react';
import { Button } from '@/components/ui/button';
import { Step } from './Step';
import { Link } from 'react-router-dom';

const steps = [
  {
    title: '1. Find Your Stylist',
    description: 'Browse through our curated list of professional hair braiders in your area. Filter by style, price, and location to find your perfect match.'
  },
  {
    title: '2. Book Appointment',
    description: 'Choose your preferred date and time slot. Our real-time booking system ensures immediate confirmation of your appointment.'
  },
  {
    title: '3. Secure Appointment With A Deposit',
    description: 'Pay a small deposit to confirm your booking. This ensures commitment from both parties and guarantees your appointment slot.'
  }
] as const;

export function Content() {
  return (
    <div className="lg:pl-12">
      <h2 className="text-4xl md:text-5xl font-light tracking-tight text-[#3F0052] mb-6 leading-tight">
        Your Journey to
        <span className="block mt-2 bg-gradient-to-r from-[#3F0052] to-[#DFA801] bg-clip-text text-transparent">
          Beautiful Styles
        </span>
      </h2>
      
      <div className="space-y-12 mt-8">
        {steps.map((step) => (
          <Step key={step.title} {...step} />
        ))}
      </div>

      <div className="mt-10">
        <Button 
          size="lg" 
          className="rounded-full font-light"
          asChild
        >
          <Link to="/find-stylists">
            Find Stylists Now
          </Link>
        </Button>
      </div>
    </div>
  );
}