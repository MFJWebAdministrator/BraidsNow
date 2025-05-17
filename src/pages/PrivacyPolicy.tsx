import { PrivacyHeader } from '@/components/Privacy/PrivacyHeader';
import { PrivacyContent } from '@/components/Privacy/PrivacyContent';

export function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      <PrivacyHeader />
      <PrivacyContent />
    </div>
  );
}