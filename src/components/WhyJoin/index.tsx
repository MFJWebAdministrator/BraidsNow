import React from 'react';
import { Benefits } from './Benefits';
import { ImageSection } from './ImageSection';

export function WhyJoin() {
  return (
    <section className="relative py-24 overflow-hidden bg-white">
      {/* Background Gradient Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 -left-64 w-96 h-96 bg-[#3F0052]/10 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
        <div className="absolute bottom-1/4 -right-64 w-96 h-96 bg-brand-yellow rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <Benefits />
          <ImageSection />
        </div>
      </div>
    </section>
  );
}