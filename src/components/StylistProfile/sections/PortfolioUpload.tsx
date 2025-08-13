import React, { useState, useRef } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ImageCropper } from '@/components/ClientCommunity/ImageCropper';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { uploadPortfolioImage, deletePortfolioImage, type PortfolioImage } from '@/lib/firebase/stylist/portfolio';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface PortfolioUploadProps {
  images: PortfolioImage[];
  onImageAdded: (image: PortfolioImage) => void;
  onImageDeleted: (imageId: string) => void;
}

export function PortfolioUpload({ images, onImageAdded, onImageDeleted }: PortfolioUploadProps) {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Image must be less than 5MB",
          variant: "destructive",
          duration: 3000,
        });
        return;
      }
      if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Only PNG, JPG, or WebP files are allowed",
          variant: "destructive",
          duration: 3000,
        });
        return;
      }
      setSelectedImage(file);
    }
  };

  const handleCropComplete = async (croppedFile: File) => {
    if (!user) return;
    
    try {
      setIsUploading(true);
      const image = await uploadPortfolioImage(user.uid, croppedFile);
      onImageAdded(image);
      toast({
        title: "Success",
        description: "Image uploaded successfully",
        duration: 3000,
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsUploading(false);
      setSelectedImage(null);
    }
  };

  const handleDelete = async (imageId: string, url: string) => {
    if (!user) return;
    
    try {
      setIsDeleting(imageId);
      await deletePortfolioImage(user.uid, imageId);
      onImageDeleted(imageId);
      toast({
        title: "Success",
        description: "Image deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting image:', error);
      console.log("ImageUrl", url)
      toast({
        title: "Error",
        description: "Failed to delete image",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Button */}
      {images.length < 20 && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleFileSelect}
          />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full h-32 border-dashed rounded-full"
          >
            {isUploading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <div className="flex flex-col items-center">
                <Upload className="h-6 w-6 mb-2" />
                <span>Upload Image</span>
                <span className="text-sm text-gray-500 mt-1">Max 5MB, 600x600px</span>
              </div>
            )}
          </Button>
        </div>
      )}

      {/* Image Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
        {images.map((image) => (
          <div key={image.id} className="relative group flex justify-center">
            <Avatar className="w-24 h-24 border-4 border-white shadow-lg">
              <AvatarImage src={image.url} alt="Portfolio" className="object-cover" />
              <AvatarFallback>Style</AvatarFallback>
            </Avatar>
            <button
              onClick={() => handleDelete(image.id, image.url)}
              disabled={isDeleting === image.id}
              className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
            >
              {isDeleting === image.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <X className="h-4 w-4" />
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Image Cropper */}
      {selectedImage && (
        <ImageCropper
          image={selectedImage}
          onCropComplete={handleCropComplete}
          onCancel={() => setSelectedImage(null)}
          cropShape="round"
        />
      )}
    </div>
  );
}