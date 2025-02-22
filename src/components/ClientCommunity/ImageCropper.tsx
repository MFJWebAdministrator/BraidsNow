import React, { useState } from 'react';
import Cropper from 'react-easy-crop';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { getCroppedImg } from '@/lib/utils/image-cropper';
import { Loader2 } from 'lucide-react';

interface ImageCropperProps {
  image: File;
  onCropComplete: (file: File) => void;
  onCancel: () => void;
  cropShape?: 'round' | 'square';
}

export function ImageCropper({ 
  image, 
  onCropComplete, 
  onCancel,
  cropShape = 'round'
}: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleCropComplete = (_: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleCrop = async () => {
    try {
      setIsLoading(true);
      if (croppedAreaPixels) {
        const croppedImage = await getCroppedImg(
          URL.createObjectURL(image),
          croppedAreaPixels,
          cropShape
        );
        onCropComplete(croppedImage);
      }
    } catch (e) {
      console.error('Error cropping image:', e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-light tracking-normal text-[#3F0052]">
            Crop Image
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            Adjust your image to fit perfectly
          </DialogDescription>
        </DialogHeader>

        <div className="relative w-full h-[400px] bg-black rounded-lg overflow-hidden">
          <Cropper
            image={URL.createObjectURL(image)}
            crop={crop}
            zoom={zoom}
            aspect={1}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={handleCropComplete}
            cropShape={cropShape}
            showGrid={false}
          />
        </div>
        
        <div className="flex items-center gap-4 py-4">
          <span className="text-sm text-gray-500">Zoom:</span>
          <Slider
            value={[zoom]}
            min={1}
            max={3}
            step={0.1}
            onValueChange={(value) => setZoom(value[0])}
            className="w-full max-w-xs"
          />
        </div>

        <div className="flex justify-end space-x-2">
          <Button 
            variant="outline" 
            onClick={onCancel}
            className="font-light tracking-normal"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleCrop}
            className="font-light tracking-normal"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Save Image'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}