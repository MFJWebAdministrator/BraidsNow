export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number },
  cropShape: 'round' | 'square' = 'round'
): Promise<File> {
  try {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (!ctx) {
      throw new Error('No 2d context');
    }

    // Calculate dimensions while maintaining aspect ratio
    const maxSize = 800;
    const scale = Math.min(maxSize / pixelCrop.width, maxSize / pixelCrop.height);
    const outputWidth = Math.round(pixelCrop.width * scale);
    const outputHeight = Math.round(pixelCrop.height * scale);

    // Set canvas dimensions
    canvas.width = outputWidth;
    canvas.height = outputHeight;

    // Fill with white background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Set quality settings
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Draw the image
    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      outputWidth,
      outputHeight
    );

    // Apply shape mask if needed
    if (cropShape === 'round') {
      ctx.globalCompositeOperation = 'destination-in';
      ctx.beginPath();
      ctx.arc(
        outputWidth / 2,
        outputHeight / 2,
        Math.min(outputWidth, outputHeight) / 2,
        0,
        2 * Math.PI
      );
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    }

    // Convert to blob
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to create image file'));
            return;
          }

          // Create file with unique name
          const fileName = `image-${Date.now()}.jpg`;
          const file = new File([blob], fileName, {
            type: 'image/jpeg',
            lastModified: Date.now()
          });

          resolve(file);
        },
        'image/jpeg',
        0.85 // Slightly reduced quality for better file size
      );
    });
  } catch (error) {
    console.error('Error in image cropping:', error);
    throw new Error('Failed to process image. Please try again.');
  }
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    
    // Handle CORS
    if (url.startsWith('blob:') || url.startsWith('data:')) {
      image.crossOrigin = null;
    } else {
      image.crossOrigin = 'anonymous';
    }

    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Failed to load image'));
    
    // Add cache buster for non-blob URLs
    if (url.startsWith('blob:')) {
      image.src = url;
    } else {
      const cacheBuster = `${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}`;
      image.src = cacheBuster;
    }
  });
}