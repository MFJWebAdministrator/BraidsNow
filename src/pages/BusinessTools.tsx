import { BusinessToolsHeader } from "@/components/BusinessTools/BusinessToolsHeader";
import { ToolsGrid } from "@/components/BusinessTools/ToolsGrid";
import { CTASection } from "@/components/BusinessTools/CTASection";
import { StylistPricingCard } from "@/components/Pricing/StylistPricingCard";

export function BusinessToolsPage() {
    return (
        <div className="min-h-screen bg-white">
            <BusinessToolsHeader />
            <ToolsGrid />
            <StylistPricingCard />
            <CTASection />
        </div>
    );
}
