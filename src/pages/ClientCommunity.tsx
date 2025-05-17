import { ClientCommunityHeader } from '@/components/ClientCommunity/ClientCommunityHeader';
import { ClientRegistrationForm } from '@/components/ClientCommunity/ClientRegistrationForm';

export function ClientCommunityPage() {
  return (
    <div className="min-h-screen bg-white">
      <ClientCommunityHeader />
      <div className="pb-32 bg-white">
        <ClientRegistrationForm />
      </div>
    </div>
  );
}