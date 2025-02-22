import React from 'react';
import { TermsHeader } from '@/components/Terms/TermsHeader';
import { TermsContent } from '@/components/Terms/TermsContent';

export function TermsAndConditionsPage() {
  return (
    <div className="min-h-screen bg-white">
      <TermsHeader />
      <TermsContent />
    </div>
  );
}