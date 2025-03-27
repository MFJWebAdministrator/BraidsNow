import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Info, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { StylistService } from '@/lib/schemas/stylist-service';
import { useToast } from '@/hooks/use-toast';

interface ServicesSectionProps {
  services: StylistService[];
  depositAmount: number;
  stylistId: string;
}

export function ServicesSection({ services, depositAmount, stylistId }: ServicesSectionProps) {
  const [showAll, setShowAll] = useState(false);
  const displayedServices = showAll ? services : services.slice(0, 3);
  const hasMoreServices = services.length > 3;
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const handleBookService = (service: StylistService) => {
    // Check if user is logged in
    if (!user) {
      navigate('/login', { 
        state: { 
          from: `/book/${stylistId}`,
          selectedService: {
            serviceId: service.name,
            stylistId,
            price: service.price,
            depositAmount
          }
        } 
      });
      return;
    }
    
    // Navigate to booking page with service pre-selected
    navigate(`/book/${stylistId}`, {
      state: {
        selectedService: {
          serviceId: service.name,
          stylistId,
          price: service.price,
          depositAmount
        }
      }
    });
    
    // Show confirmation toast
    toast({
      title: "Service Selected",
      description: `You've selected ${service.name}. Complete your booking details.`,
      variant: "default"
    });
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-light text-[#3F0052] tracking-normal">
          Services & Pricing
        </h2>
        
        {/* Deposit Information */}
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <AlertCircle className="w-4 h-4 text-[#3F0052]" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">A deposit is required to secure your booking</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <span className="text-sm text-[#3F0052] font-bold tracking-normal text-md">
            ${depositAmount} Deposit Required!
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {/* Services */}
        {displayedServices.map((service) => (
          <div key={service.name} className="relative group">
            {/* Service Card with Gradient Border */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#3F0052] to-[#DFA801] rounded-xl blur opacity-0 group-hover:opacity-20 transition duration-500" />
            
            <div className="relative bg-white rounded-lg p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex items-center justify-between">
                {/* Service Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-medium text-[#3F0052] tracking-normal">
                      {service.name}
                    </h3>
                    {service.description && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="w-4 h-4 text-gray-400" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">{service.description}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                  <div className="flex items-center mt-1 text-gray-500">
                    <Clock className="w-4 h-4 mr-1" />
                    <span className="text-sm tracking-normal">
                      {service.duration.hours}h {service.duration.minutes}m
                    </span>
                  </div>
                </div>

                {/* Price and Book Button */}
                <div className="flex items-center gap-4">
                  {/* Price Tag */}
                  <div className="relative">
                    <div className="absolute -inset-2 bg-gradient-to-br from-[#3F0052]/5 to-[#DFA801]/5 rounded-full blur-sm" />
                    <div className="relative bg-white px-4 py-1 rounded-full border border-[#3F0052]/10">
                      <span className="text-xl font-bold bg-gradient-to-r from-[#3F0052] to-[#DFA801] bg-clip-text text-transparent">
                        ${service.price}
                      </span>
                    </div>
                  </div>

                  {/* Book Button */}
                  <Button 
                    onClick={() => handleBookService(service)}
                    className="rounded-full bg-gradient-to-r from-[#3F0052] to-[#DFA801] hover:from-[#3F0052]/90 hover:to-[#DFA801]/90 transition-all duration-300 text-lg tracking-normal font-light"
                  >
                    Book Now
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Show More Button */}
        {hasMoreServices && (
          <div className="text-center pt-4">
            <Button
              variant="ghost"
              onClick={() => setShowAll(!showAll)}
              className="text-[#3F0052] hover:text-[#FFFFFF] transition-colors font-light text-md tracking-normal"
            >
              {showAll ? 'Show Less' : `Show ${services.length - 3} More Services`}
            </Button>
          </div>
        )}

        {services.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p className="tracking-normal">No services available yet.</p>
          </div>
        )}
      </div>
    </Card>
  );
}