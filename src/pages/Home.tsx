import { Hero } from "@/components/Hero";
import { WhyJoin } from "@/components/WhyJoin";
import { HowItWorks } from "@/components/HowItWorks";
import { HomePricingSection } from "@/components/Pricing/HomePricingSection";

export function HomePage() {
    return (
        <main>
            <Hero />
            <WhyJoin />
            <HowItWorks />
            <HomePricingSection />
        </main>
    );
}
