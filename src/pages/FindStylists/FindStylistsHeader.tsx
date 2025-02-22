import React from 'react';

export function FindStylistsHeader() {
  return (
    <div className="relative bg-[#3F0052] pt-32 pb-16">
      <div className="absolute inset-0">
        <img 
          src="https://images.unsplash.com/photo-1605980776566-0486c3ac7617?auto=format&fit=crop&q=80"
          alt="Hair styling"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-[#3F0052]/90" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-light text-white mb-4 tracking-normal">
            Find Your Perfect Stylist
          </h1>
          <p className="text-xl text-gray-200 tracking-normal font-light">
            Connect with expert braiders in your area
          </p>
        </div>
      </div>
    </div>
  );
}