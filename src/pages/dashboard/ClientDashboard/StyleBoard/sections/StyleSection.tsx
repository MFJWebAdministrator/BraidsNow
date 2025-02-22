import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Loader2, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import type { StyleImage } from '@/lib/schemas/style-board';

interface StyleSectionProps {
  title: string;
  description: string;
  images: StyleImage[];
  category: StyleImage['category'];
  onShowUpload: () => void;
  onDelete: (imageId: string, category: StyleImage['category']) => Promise<void>;
}

export function StyleSection({
  title,
  description,
  images,
  category,
  onShowUpload,
  onDelete
}: StyleSectionProps) {
  const [selectedImage, setSelectedImage] = React.useState<StyleImage | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const handleDelete = async (image: StyleImage) => {
    try {
      setDeletingId(image.id);
      await onDelete(image.id, category);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-light text-[#3F0052] tracking-normal">{title}</h3>
            <p className="text-sm text-gray-500 tracking-normal">{description}</p>
          </div>
          <Button onClick={onShowUpload}>
            <Plus className="w-4 h-4 mr-2" />
            Add Photo
          </Button>
        </div>

        {images.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {images.map((image) => (
              <div
                key={`${category}-${image.id}`}
                className="relative group aspect-square rounded-lg overflow-hidden"
              >
                <img
                  src={image.url}
                  alt={`${category} style`}
                  className="w-full h-full object-cover transition-transform cursor-pointer hover:scale-105"
                  onClick={() => setSelectedImage(image)}
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleDelete(image)}
                  disabled={deletingId === image.id}
                >
                  {deletingId === image.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500 tracking-normal">No images added yet</p>
          </div>
        )}
      </div>

      {/* Image Preview Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-[800px] p-6">
          <DialogTitle className="text-xl font-light text-[#3F0052] mb-4">
            Style Preview
          </DialogTitle>
          
          {selectedImage && (
            <div className="relative w-full aspect-square max-w-[700px] rounded-lg overflow-hidden">
              <img 
                src={selectedImage.url} 
                alt={`${category} style preview`}
                className="w-full h-full object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}