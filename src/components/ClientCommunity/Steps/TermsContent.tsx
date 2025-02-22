import React from 'react';
import { termsData } from '@/data/termsData';

export function TermsContent() {
  return (
    <div className="space-y-6">
      {termsData.map((section, index) => (
        <div key={index} className="space-y-2">
          <h3 className="text-lg font-light text-[#3F0052] tracking-normal">
            {section.title}
          </h3>
          <p className="text-sm text-black font-light tracking-normal leading-relaxed">
            {section.content}
          </p>
        </div>
      ))}
    </div>
  );
}