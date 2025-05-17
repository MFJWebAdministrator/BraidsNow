import { PrivacySection } from './PrivacySection';
import { privacyData } from '@/data/privacyData';

export function PrivacyContent() {
  return (
    <div className="max-w-4xl mx-auto px-4 pb-24">
      <div className="space-y-12">
        {privacyData.map((section) => (
          <PrivacySection 
            key={section.title} 
            title={section.title} 
            content={section.content}
            isMainTitle={section.title === "Privacy Policy Changes"}
          />
        ))}
      </div>
    </div>
  );
}