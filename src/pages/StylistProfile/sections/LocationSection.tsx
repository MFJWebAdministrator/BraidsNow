import React from 'react';
import { Card } from '@/components/ui/card';
import { MapPin } from 'lucide-react';

interface LocationSectionProps {
  location: string;
}

export function LocationSection({ location }: LocationSectionProps) {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="w-5 h-5 text-[#3F0052]" />
        <h2 className="text-xl font-light text-[#3F0052] tracking-normal">
          Location
        </h2>
      </div>

      <p className="text-gray-600 tracking-normal">{location}</p>
    </Card>
  );
}