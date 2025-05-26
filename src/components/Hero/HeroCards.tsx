export function HeroCards() {
  return (
    <div className="hidden lg:block lg:w-1/2 relative">
      <div className="absolute top-4 right-4 glass-card rounded-2xl p-4 shadow-xl animate-float">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-full bg-[#DFA801]/20 flex items-center justify-center">
            <span className="text-2xl">👩🏾‍🦱</span>
          </div>
          <div>
            <p className="text-white font-medium">Trending Styles</p>
            <p className="text-white text-sm">Explore Latest Stylist Trends</p>
          </div>
        </div>
      </div>

      <div className="absolute bottom-4 left-4 glass-card rounded-2xl p-4 shadow-xl animate-float-delayed">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-full bg-[#3F0052]/20 flex items-center justify-center">
            <span className="text-2xl">👩🏾‍🦱</span>
          </div>
          <div>
            <p className="text-white font-medium">Verified Stylists</p>
            <p className="text-white tracking-normal text-sm">Professional & Experienced</p>
          </div>
        </div>
      </div>
    </div>
  );
}