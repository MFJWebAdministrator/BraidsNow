import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

interface StyleGridProps {
  images: Array<{
    url: string;
    category: string;
    createdAt: string;
  }>;
}

export function StyleGrid({ images }: StyleGridProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [columns, setColumns] = useState<Array<Array<typeof images[0]>>>([]);

  // Distribute images into columns for masonry layout
  useEffect(() => {
    const calculateColumns = () => {
      let numColumns = 2; // Default for mobile
      if (window.innerWidth >= 1024) numColumns = 5; // lg
      else if (window.innerWidth >= 768) numColumns = 4; // md
      else if (window.innerWidth >= 640) numColumns = 3; // sm

      // Create empty columns
      const newColumns: Array<Array<typeof images[0]>> = Array.from({ length: numColumns }, () => []);

      // Distribute images into columns
      images.forEach((image, index) => {
        newColumns[index % numColumns].push(image);
      });

      setColumns(newColumns);
    };

    calculateColumns();

    // Recalculate on window resize
    window.addEventListener('resize', calculateColumns);
    return () => window.removeEventListener('resize', calculateColumns);
  }, [images]);

  // Function to get random float animation class
  const getRandomFloat = () => {
    const floats = ['float-1', 'float-2', 'float-3', 'float-4'];
    return floats[Math.floor(Math.random() * floats.length)];
  };

  if (images.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">No styles found</p>
      </div>
    );
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'current':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'past':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'wishlist':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'natural':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <>
      <div className="flex gap-4">
        {columns.map((column, columnIndex) => (
          <div key={columnIndex} className="flex-1 space-y-4">
            {column.map((image, imageIndex) => (
              <div
                key={`${image.url}-${imageIndex}`}
                className={`relative group rounded-xl overflow-hidden cursor-pointer shadow-lg hover:shadow-xl transition-all duration-500 ${getRandomFloat()}`}
                onClick={() => setSelectedImage(image.url)}
              >
                {/* Glass overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* Image */}
                <img
                  src={image.url}
                  alt="Hairstyle"
                  className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-110"
                />

                {/* Content overlay */}
                <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  <Badge 
                    variant="secondary" 
                    className={`${getCategoryColor(image.category)} backdrop-blur-sm border shadow-sm`}
                  >
                    {image.category}
                  </Badge>
                  <div className="text-xs text-white mt-2 font-light tracking-wide">
                    {formatDistanceToNow(new Date(image.createdAt), { addSuffix: true })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-[1000px] p-6">
          <DialogTitle className="text-xl font-light text-[#3F0052] mb-4">
            Style Preview
          </DialogTitle>
          
          {selectedImage && (
            <div className="relative w-full max-h-[80vh] rounded-lg overflow-hidden">
              <img 
                src={selectedImage} 
                alt="Style preview"
                className="w-full h-full object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}