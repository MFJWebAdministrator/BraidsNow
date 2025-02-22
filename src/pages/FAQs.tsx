import React from 'react';
import { FAQHeader } from '@/components/FAQs/FAQHeader';
import { FAQList } from '@/components/FAQs/FAQList';

export function FAQsPage() {
  return (
    <div className="min-h-screen bg-white">
      <FAQHeader />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <FAQList />
      </div>
    </div>
  );
}