import { Card } from '@/components/ui/card';
import { User } from 'lucide-react';

interface AboutSectionProps {
  introduction: string;
}

export function AboutSection({ introduction }: AboutSectionProps) {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <User className="w-5 h-5 text-[#3F0052]" />
        <h2 className="text-xl font-light text-[#3F0052] tracking-normal">
          About Me
        </h2>
      </div>
      <p className="text-gray-600 tracking-normal leading-relaxed">
        {introduction}
      </p>
    </Card>
  );
}