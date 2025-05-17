import { Hero } from '@/components/Hero';
import { WhyJoin } from '@/components/WhyJoin';
import { HowItWorks } from '@/components/HowItWorks';

export function HomePage() {
  return (
    <main>
      <Hero />
      <WhyJoin />
      <HowItWorks />
    </main>
  );
}