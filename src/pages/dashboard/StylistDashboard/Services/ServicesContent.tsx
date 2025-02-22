import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ServicesList } from './ServicesList';
import { AddServiceDialog } from './AddServiceDialog';
import { useStylistServices } from './hooks/useStylistServices';
import type { StylistService } from '@/lib/schemas/stylist-service';

export function ServicesContent() {
  const {
    services,
    loading,
    error,
    handleAddService,
    handleEditService,
    handleDeleteService
  } = useStylistServices();

  const [showDialog, setShowDialog] = useState(false);
  const [editingService, setEditingService] = useState<StylistService | null>(null);

  const handleEdit = (service: StylistService) => {
    setEditingService(service);
    setShowDialog(true);
  };

  const handleClose = () => {
    setShowDialog(false);
    setEditingService(null);
  };

  const handleSave = (service: StylistService) => {
    if (editingService) {
      handleEditService(service);
    } else {
      handleAddService(service);
    }
    handleClose();
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className="text-red-600">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-light text-[#3F0052] tracking-normal">Services List</h2>
          <p className="text-sm text-gray-500 tracking-normal">
            {services.length} services added
          </p>
        </div>
        <Button
          onClick={() => setShowDialog(true)}
          className="rounded-full font-light tracking-normal"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Service
        </Button>
      </div>

      <ServicesList
        services={services}
        onEdit={handleEdit}
        onDelete={handleDeleteService}
      />

      <AddServiceDialog
        open={showDialog}
        onClose={handleClose}
        onSave={handleSave}
        initialData={editingService}
        isEdit={!!editingService}
      />
    </div>
  );
}