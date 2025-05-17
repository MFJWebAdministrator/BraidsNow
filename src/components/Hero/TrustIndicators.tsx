const indicators = [
  ['500+', 'Expert Stylists'],
  ['25K+', 'Happy Clients'],
  ['4.9/5', 'Client Rating']
] as const;

export function TrustIndicators() {
  return (
    <div className="grid grid-cols-3 gap-8 pt-8 border-t border-white/10">
      {indicators.map(([number, label]) => (
        <div key={label} className="text-center">
          <div className="text-4xl font-bold text-[#DFA801]">{number}</div>
          <div className="text-sm text-white tracking-normal font-light mt-1">{label}</div>
        </div>
      ))}
    </div>
  );
}