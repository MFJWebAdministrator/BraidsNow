import { BusinessToolsHeader } from "@/components/BusinessTools/BusinessToolsHeader";
import { ToolsGrid } from "@/components/BusinessTools/ToolsGrid";
import { CTASection } from "@/components/BusinessTools/CTASection";
import { StylistPricingCard } from "@/components/Pricing/StylistPricingCard";
import { SEO } from '@/components/SEO';
import { getPageMetadata } from '@/lib/metadata';

export function BusinessToolsPage() {
    return (
        <div className="min-h-screen bg-white">
            <SEO metadata={getPageMetadata('businessTools')} />
            <BusinessToolsHeader />
            <ToolsGrid />
            <StylistPricingCard />
            <CTASection />
        </div>
    );
}
