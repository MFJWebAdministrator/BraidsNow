import { Hero } from "@/components/Hero";
import { WhyJoin } from "@/components/WhyJoin";
import { HowItWorks } from "@/components/HowItWorks";
import { PricingSection } from "@/components/BusinessTools/PricingCard";

export function HomePage() {
    return (
        <main>
            <Hero />
            <WhyJoin />
            <HowItWorks />
            <PricingSection isHome={true} />
        </main>
    );
}
