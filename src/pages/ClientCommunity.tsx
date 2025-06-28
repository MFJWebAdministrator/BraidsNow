import { ClientCommunityHeader } from '@/components/ClientCommunity/ClientCommunityHeader';
import { ClientRegistrationForm } from '@/components/ClientCommunity/ClientRegistrationForm';
import { SEO } from '@/components/SEO';
import { getPageMetadata } from '@/lib/metadata';

export function ClientCommunityPage() {
  return (
    <div className="min-h-screen bg-white">
      <SEO metadata={getPageMetadata('clientCommunity')} />
      <ClientCommunityHeader />
      <div className="pb-32 bg-white">
        <ClientRegistrationForm />
      </div>
    </div>
  );
}