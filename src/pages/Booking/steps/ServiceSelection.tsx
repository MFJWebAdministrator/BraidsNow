import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, DollarSign } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import type { ServiceSelection as ServiceSelectionType } from '@/lib/schemas/booking';
import type { StylistService } from '@/lib/schemas/stylist-service';

interface ServiceSelectionProps {
  stylistId: string;
  onSelect: (service: ServiceSelectionType) => void;
}

export function ServiceSelection({ stylistId, onSelect }: ServiceSelectionProps) {
  const location = useLocation();
  const preSelectedService = location.state?.selectedService as ServiceSelectionType;

  const { data: stylist, isLoading } = useQuery({
    queryKey: ['stylist', stylistId],
    queryFn: async () => {
      const docRef = doc(db, 'stylists', stylistId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error('Stylist not found');
      }
      
      const data = docSnap.data();
      return {
        services: data.services as StylistService[],
        depositAmount: data.depositAmount as number
      };
    }
  });

  // If we have a pre-selected service, use it immediately
  React.useEffect(() => {
    if (preSelectedService) {
      onSelect(preSelectedService);
    }
  }, [preSelectedService, onSelect]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3F0052]" />
      </div>
    );
  }

  if (!stylist || !stylist.services?.length) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No services available</p>
      </div>
    );
  }

  // If we have a pre-selected service, don't render the selection UI
  if (preSelectedService) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-light text-[#3F0052] mb-2">Select a Service</h2>
        <p className="text-gray-600">Choose the service you'd like to book</p>
      </div>

      <div className="grid gap-4">
        {stylist.services.map((service) => (
          <Card 
            key={service.name}
            className="p-6 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onSelect({
              serviceId: service.name,
              stylistId,
              price: service.price,
              depositAmount: stylist.depositAmount
            })}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-[#3F0052] mb-2">
                  {service.name}
                </h3>
                {service.description && (
                  <p className="text-gray-600 text-sm mb-4">{service.description}</p>
                )}
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {service.duration.hours}h {service.duration.minutes}m
                  </div>
                  <div className="flex items-center">
                    <DollarSign className="w-4 h-4 mr-1" />
                    {service.price}
                  </div>
                </div>
              </div>
              <Button>Select</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}