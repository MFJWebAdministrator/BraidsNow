import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GradientIconProps {
  icon: LucideIcon;
  className?: string;
}

export function GradientIcon({ icon: Icon, className }: GradientIconProps) {
  return (
    <div className={cn(
      "relative w-14 h-14 rounded-full p-[2px] bg-gradient-to-br from-[#3F0052] to-[#DFA801]",
      className
    )}>
      <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
        <Icon className="h-6 w-6 text-[#3F0052]" />
      </div>
    </div>
  );
}