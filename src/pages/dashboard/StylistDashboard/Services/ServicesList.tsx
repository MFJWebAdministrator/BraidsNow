import React from 'react';
import { Edit2, Trash2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { StylistService } from '@/lib/schemas/stylist-service';

interface ServicesListProps {
  services: StylistService[];
  onEdit: (service: StylistService) => void;
  onDelete: (service: StylistService) => void;
}

export function ServicesList({ services, onEdit, onDelete }: ServicesListProps) {
  if (services.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <p className="text-gray-600 tracking-normal">No services added yet</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      {services.map((service) => (
        <Card key={service.name}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-xl font-light tracking-normal text-[#3F0052]">
                {service.name}
              </CardTitle>
              <CardDescription className="text-sm tracking-normal">
                ${service.price}
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(service)}
                className="hover:text-[#3F0052]"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(service)}
                className="hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-gray-500 mb-2">
              <Clock className="w-4 h-4 mr-2" />
              <span className="tracking-normal">
                {service.duration.hours}h {service.duration.minutes}m
              </span>
            </div>
            {service.description && (
              <p className="text-sm text-gray-600 tracking-normal">
                {service.description}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}