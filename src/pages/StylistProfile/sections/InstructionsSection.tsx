import React from 'react';
import { Card } from '@/components/ui/card';
import { FileText } from 'lucide-react';

interface InstructionsSectionProps {
  instructions: string;
}

export function InstructionsSection({ instructions }: InstructionsSectionProps) {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-5 h-5 text-[#3F0052]" />
        <h2 className="text-xl font-light text-[#3F0052] tracking-normal">
          Special Instructions
        </h2>
      </div>
      <p className="text-gray-600 tracking-normal leading-relaxed">
        {instructions}
      </p>
    </Card>
  );
}