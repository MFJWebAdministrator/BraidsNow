import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AddServiceDialog } from './AddServiceDialog';
import { useStylistServices } from './hooks/useStylistServices';
import type { StylistService } from '@/lib/schemas/stylist-service';
import ImageLightbox from '@/components/ImageLightBox';

// Lightbox modal for image preview


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
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

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

      {/* Updated Services List with image thumbnails */}
      <div className="space-y-4">
        {services.map((service) => (
          <div key={service.name} className="flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-100 shadow-sm">
            <div className='w-full flex justify-start items-center gap-4'>
            <div className="">
              <div className="font-medium text-[#3F0052] text-lg">{service.name}</div>
              <div className="text-gray-500 text-sm">${service.price}</div>
              <div className="text-gray-400 text-xs">{service.duration.hours}h {service.duration.minutes}m</div>
            </div>
            {service.imageUrl && (
              <img
                src={service.imageUrl}
                alt={service.name}
                className="w-16 h-16 object-cover rounded-full border cursor-pointer hover:opacity-80 transition"
                onClick={() => setLightboxUrl(service.imageUrl!)}
              />
            )}
            </div>
            <Button variant="outline" onClick={() => handleEdit(service)} className="mr-2">Edit</Button>
            <Button variant="destructive" onClick={() => handleDeleteService(service)}>Delete</Button>
          </div>
        ))}
      </div>

      <AddServiceDialog
        open={showDialog}
        onClose={handleClose}
        onSave={handleSave}
        initialData={editingService}
        isEdit={!!editingService}
      />

      {/* Lightbox for image preview */}
      {lightboxUrl && <ImageLightbox imageUrl={lightboxUrl} onClose={() => setLightboxUrl(null)} />}
    </div>
  );
}