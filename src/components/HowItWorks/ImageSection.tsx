export function ImageSection() {
  return (
    <div className="relative">
      <div className="relative rounded-2xl overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&q=80"
          alt="Professional hairstylist at work"
          className="w-full h-[600px] object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-purple-600/80 to-transparent" />
      </div>
      {/* Floating Stats Card */}
      <div className="absolute -bottom-6 -right-6 bg-white rounded-2xl shadow-xl p-6 max-w-xs">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-black-500 font-light tracking-normal"> Success Rate</span>
          <span className="text-lg font-light" style={{ color: '#3F0052' }}>98%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="h-2 rounded-full" style={{ backgroundColor: '#3F0052', width: '98%' }} />
        </div>
        <p className="mt-4 text-sm text-black-600 font-light tracking-normal">
          Satisfied clients who found their perfect stylist through our platform
        </p>
      </div>
    </div>
  );
}