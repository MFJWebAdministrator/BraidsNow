import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ImageCropper } from '@/components/ClientCommunity/ImageCropper';
import { Upload, Loader2 } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';

interface StyleBoardUploadProps {
  open: boolean;
  onClose: () => void;
  onUpload: (file: File) => Promise<void>;
}

export function StyleBoardUpload({ open, onClose, onUpload }: StyleBoardUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [zoom, setZoom] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Image must be less than 5MB",
          variant: "destructive"
        });
        return;
      }
      if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Only PNG, JPG, or WebP files are allowed",
          variant: "destructive"
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleCropComplete = async (croppedFile: File) => {
    try {
      setIsUploading(true);
      await onUpload(croppedFile);
      onClose();
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setIsUploading(false);
      setSelectedFile(null);
      setZoom(1);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setZoom(1);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[800px] p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl font-light tracking-normal text-[#3F0052]">
            Upload Photo
          </DialogTitle>
        </DialogHeader>

        {!selectedFile ? (
          <div className="space-y-4">
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
              className="w-full h-32 border-dashed rounded-xl"
            >
              {isUploading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <div className="flex flex-col items-center">
                  <Upload className="h-6 w-6 mb-2" />
                  <span>Upload Image</span>
                  <span className="text-sm text-gray-500 mt-1">Max 5MB</span>
                </div>
              )}
            </Button>
          </div>
        ) : (
          <>
            <ImageCropper
              image={selectedFile}
              onCropComplete={handleCropComplete}
              onCancel={() => setSelectedFile(null)}
              cropShape="square"
              zoom={zoom}
              onZoomChange={setZoom}
            />
            
            <div className="flex items-center gap-4 py-4 px-1">
              <span className="text-sm text-gray-500 min-w-[40px]">Zoom:</span>
              <div className="relative flex-1">
                <div className="absolute inset-0 bg-gradient-to-r from-[#3F0052]/5 to-[#DFA801]/5 rounded-full" />
                <Slider
                  value={[zoom]}
                  min={1}
                  max={3}
                  step={0.1}
                  onValueChange={(value) => setZoom(value[0])}
                  className="relative"
                />
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}