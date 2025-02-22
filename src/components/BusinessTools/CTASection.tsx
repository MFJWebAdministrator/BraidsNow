import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export function CTASection() {
  const navigate = useNavigate();

  return (
    <div className="bg-[#3F0052]/5 py-16">
      <div className="max-w-3xl mx-auto text-center px-4">
        <h2 className="text-3xl font-light text-[#3F0052] mb-4 tracking-normal">
          Ready to Grow Your Business?
        </h2>
        <p className="text-black mb-8 tracking-normal">
          Join our crew of successful stylists and grow your business strong.
        </p>
        <Button 
          onClick={() => navigate('/stylist-community')}
          className="rounded-full font-light tracking-normal text-lg px-8 py-6"
        >
          Get Started Now!
        </Button>
      </div>
    </div>
  );
}