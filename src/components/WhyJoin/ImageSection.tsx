export function ImageSection() {
  return (
    <div className="relative lg:h-[700px]">
      <div className="relative h-full rounded-3xl overflow-hidden flex items-center justify-center">
        <img
          src="/images/Join Our Growing Stylist Community.jpg"
          alt="Professional hair braiding"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#3F0052]/80 via-[#3F0052]/20 to-transparent" />
      </div>
    </div>
  );
}