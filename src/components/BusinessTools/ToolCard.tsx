import React from 'react';
import { LucideIcon } from 'lucide-react';
import { GradientIcon } from '@/components/ui/GradientIcon';

interface ToolCardProps {
  icon: LucideIcon;
  name: string;
  description: string;
}

export function ToolCard({ icon, name, description }: ToolCardProps) {
  return (
    <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="relative w-12 h-12 mb-4">
        <div className="absolute inset-0 bg-gradient-to-br from-[#3F0052] to-[#DFA801] rounded-full opacity-20" />
        <div className="relative w-full h-full flex items-center justify-center">
          <GradientIcon icon={icon} className="h-6 w-6" />
        </div>
      </div>
      <h3 className="text-xl font-light text-[#3F0052] mb-2 tracking-normal">{name}</h3>
      <p className="text-black tracking-normal">{description}</p>
    </div>
  );
}