import { Hero } from "@/components/Hero";
import { WhyJoin } from "@/components/WhyJoin";
import { HowItWorks } from "@/components/HowItWorks";
import { HomePricingSection } from "@/components/Pricing/HomePricingSection";
import { SEO } from "@/components/SEO";
import { getPageMetadata } from "@/lib/metadata";

export function HomePage() {
    return (
        <main>
            <SEO metadata={getPageMetadata('home')} />
            <Hero />
            <WhyJoin />
            <HowItWorks />
            <HomePricingSection />
        </main>
    );
}
