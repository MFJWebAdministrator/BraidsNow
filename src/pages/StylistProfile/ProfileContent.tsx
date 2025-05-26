import { useStylistProfile } from './hooks/useStylistProfile';
import { ProfileHeader } from './sections/ProfileHeader';
import { AboutSection } from './sections/AboutSection';
import { ServicesSection } from './sections/ServicesSection';
import { ScheduleSection } from './sections/ScheduleSection';
import { LocationSection } from './sections/LocationSection';
import { ReviewsSection } from './sections/ReviewsSection';
import { PortfolioSection } from './sections/PortfolioSection';
import { InstructionsSection } from './sections/InstructionsSection';
import { PoliciesSection } from './sections/PoliciesSection';
import { AdditionalServicesSection } from './sections/AdditionalServicesSection';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

interface ProfileContentProps {
  stylistId: string;
}

export function ProfileContent({ stylistId }: ProfileContentProps) {
  const { stylist, loading, error } = useStylistProfile(stylistId);
  const { user } = useAuth();
  const isOwner = user?.uid === stylistId;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[#3F0052]" />
      </div>
    );
  }

  if (error || !stylist) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <p className="text-red-600">Failed to load stylist profile</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="space-y-8">
        {/* Profile Header */}
        <ProfileHeader stylist={stylist} />
        
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-8 space-y-8">
            {/* About Section */}
            <AboutSection introduction={stylist.introduction} />
            
            {/* Services Section with Portfolio */}
            <div className="space-y-8">
              <ServicesSection 
                services={stylist.services} 
                depositAmount={stylist.depositAmount}
                stylistId={stylistId}
              />
              <PortfolioSection 
                stylistId={stylistId}
                isOwner={isOwner}
              />
            </div>
            
            {/* Instructions and Policies */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <InstructionsSection instructions={stylist.specialInstructions} />
              <PoliciesSection policies={stylist.policyAndProcedures} />
            </div>
            
            {/* Reviews */}
            <ReviewsSection stylistId={stylistId} />
          </div>
          
          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-8">
            <div className="sticky top-24">
              {/* Additional Services */}
              <AdditionalServicesSection 
                washesHair={stylist.washesHair}
                providesHair={stylist.providesHair}
                stylesMensHair={stylist.stylesMensHair}
                stylesChildrensHair={stylist.stylesChildrensHair}
              />
              
              {/* Schedule and Location */}
              <div className="space-y-8 mt-8">
                <ScheduleSection schedule={stylist.schedule} />
                <LocationSection location={stylist.location} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}