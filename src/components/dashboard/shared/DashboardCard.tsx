import React from 'react';
import { Card } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface DashboardCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  value?: string | number;
}

export function DashboardCard({ title, description, icon: Icon, value }: DashboardCardProps) {
  return (
    <Card className="p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <h3 className="text-lg font-light tracking-normal text-[#3F0052]">{title}</h3>
          <p className="text-sm text-gray-600 tracking-normal">{description}</p>
        </div>
        <div className="rounded-full p-2 bg-[#3F0052]/5">
          <Icon className="h-5 w-5 text-[#3F0052]" />
        </div>
      </div>
      {value && (
        <p className="mt-4 text-2xl font-light tracking-normal text-[#3F0052]">{value}</p>
      )}
    </Card>
  );
}