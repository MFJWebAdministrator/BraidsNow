import { PrivacyHeader } from '@/components/Privacy/PrivacyHeader';
import { PrivacyContent } from '@/components/Privacy/PrivacyContent';
import { SEO } from '@/components/SEO';
import { getPageMetadata } from '@/lib/metadata';

export function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      <SEO metadata={getPageMetadata('privacy')} />
      <PrivacyHeader />
      <PrivacyContent />
    </div>
  );
}