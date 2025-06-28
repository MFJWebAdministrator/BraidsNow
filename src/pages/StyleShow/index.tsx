import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { StyleShowHeader } from './StyleShowHeader';
import { StyleShowContent } from './StyleShowContent';
import { SEO } from '@/components/SEO';
import { getPageMetadata } from '@/lib/metadata';

export function StyleShowPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <SEO metadata={getPageMetadata('styleShow')} />
      <Header />
      <StyleShowHeader />
      <StyleShowContent />
      <Footer />
    </div>
  );
}