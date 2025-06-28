import { StylistCommunityHeader } from '@/components/StylistCommunity/StylistCommunityHeader';
import { StylistRegistrationForm } from '@/components/StylistCommunity/StylistRegistrationForm';
import { SEO } from '@/components/SEO';
import { getPageMetadata } from '@/lib/metadata';

export function StylistCommunityPage() {
  return (
    <div className="min-h-screen bg-white">
      <SEO metadata={getPageMetadata('stylistCommunity')} />
      <StylistCommunityHeader />
      <div className="pb-32 bg-white">
        <StylistRegistrationForm />
      </div>
    </div>
  );
}