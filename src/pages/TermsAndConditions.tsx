import { TermsHeader } from '@/components/Terms/TermsHeader';
import { TermsContent } from '@/components/Terms/TermsContent';
import { SEO } from '@/components/SEO';
import { getPageMetadata } from '@/lib/metadata';

export function TermsAndConditionsPage() {
  return (
    <div className="min-h-screen bg-white">
      <SEO metadata={getPageMetadata('terms')} />
      <TermsHeader />
      <TermsContent />
    </div>
  );
}