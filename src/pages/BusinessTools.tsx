import { BusinessToolsHeader } from "@/components/BusinessTools/BusinessToolsHeader";
import { ToolsGrid } from "@/components/BusinessTools/ToolsGrid";
import { CTASection } from "@/components/BusinessTools/CTASection";
import { PricingSection } from "@/components/BusinessTools/PricingCard";

export function BusinessToolsPage() {
    return (
        <div className="min-h-screen bg-white">
            <BusinessToolsHeader />
            <ToolsGrid />
            <PricingSection />
            <CTASection />
        </div>
    );
}
