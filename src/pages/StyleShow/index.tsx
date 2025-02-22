import React from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { StyleShowHeader } from './StyleShowHeader';
import { StyleShowContent } from './StyleShowContent';

export function StyleShowPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <StyleShowHeader />
      <StyleShowContent />
      <Footer />
    </div>
  );
}