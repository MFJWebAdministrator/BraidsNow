import React from 'react';
import { Card } from '@/components/ui/card';
import { Shield } from 'lucide-react';

interface PoliciesSectionProps {
  policies: string;
}

export function PoliciesSection({ policies }: PoliciesSectionProps) {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-5 h-5 text-[#3F0052]" />
        <h2 className="text-xl font-light text-[#3F0052] tracking-normal">
          Policies & Procedures
        </h2>
      </div>
      <p className="text-gray-600 tracking-normal leading-relaxed">
        {policies}
      </p>
    </Card>
  );
}