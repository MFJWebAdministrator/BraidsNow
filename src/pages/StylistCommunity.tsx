import { StylistCommunityHeader } from '@/components/StylistCommunity/StylistCommunityHeader';
import { StylistRegistrationForm } from '@/components/StylistCommunity/StylistRegistrationForm';

export function StylistCommunityPage() {
  return (
    <div className="min-h-screen bg-white">
      <StylistCommunityHeader />
      <div className="pb-32 bg-white">
        <StylistRegistrationForm />
      </div>
    </div>
  );
}