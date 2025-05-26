import { Card } from '@/components/ui/card';
import { Plus } from 'lucide-react';

interface AdditionalServicesSectionProps {
  washesHair: boolean;
  providesHair: boolean;
  stylesMensHair: boolean;
  stylesChildrensHair: boolean;
}

export function AdditionalServicesSection({ 
  washesHair,
  providesHair,
  stylesMensHair,
  stylesChildrensHair 
}: AdditionalServicesSectionProps) {
  const services = [
    { enabled: washesHair, label: 'Hair Washing' },
    { enabled: providesHair, label: 'Hair Provided' },
    { enabled: stylesMensHair, label: "Men's Styling" },
    { enabled: stylesChildrensHair, label: "Children's Styling" }
  ].filter(service => service.enabled);

  if (services.length === 0) return null;

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Plus className="w-5 h-5 text-[#3F0052]" />
        <h2 className="text-xl font-light text-[#3F0052] tracking-normal">
          Additional Services
        </h2>
      </div>
      <div className="flex flex-wrap gap-2">
        {services.map(({ label }) => (
          <span 
            key={label}
            className="px-3 py-1 bg-[#3F0052]/5 rounded-full text-sm text-[#3F0052]"
          >
            {label}
          </span>
        ))}
      </div>
    </Card>
  );
}