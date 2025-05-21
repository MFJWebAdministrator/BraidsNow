import { HeroContent } from './HeroContent';
import { HeroCards } from './HeroCards';

export function Hero() {
  return (
    <div className="relative min-h-screen flex items-center pt-16">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="/images/Hero Image.jpeg"
          alt="Professional hair braiding"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#3F0052]/95 via-[#3F0052]/80 to-[#DFA801]/50" />
      </div>

      {/* Hero Content */}
      <div className="relative z-10 w-full py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:flex lg:items-center lg:gap-12">
            <HeroContent />
            <HeroCards />
          </div>
        </div>
      </div>
    </div>
  );
}