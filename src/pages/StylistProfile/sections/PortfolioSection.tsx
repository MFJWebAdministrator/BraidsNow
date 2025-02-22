import React, { useState, useEffect } from 'react';
import { Image, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { useAuth } from '@/hooks/use-auth';
import { PortfolioUpload } from '@/components/StylistProfile/sections/PortfolioUpload';
import { getPortfolioImages, type PortfolioImage } from '@/lib/firebase/stylist/portfolio';

interface PortfolioSectionProps {
  stylistId?: string;
  isOwner?: boolean;
}

export function PortfolioSection({ stylistId, isOwner = false }: PortfolioSectionProps) {
  const [images, setImages] = useState<PortfolioImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<PortfolioImage | null>(null);
  const { user } = useAuth();

  // Split images into chunks of 6 for carousel
  const imageChunks = React.useMemo(() => {
    const chunks = [];
    for (let i = 0; i < images.length; i += 6) {
      chunks.push(images.slice(i, i + 6));
    }
    return chunks;
  }, [images]);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const userId = stylistId || user?.uid;
        if (!userId) return;
        
        const portfolioImages = await getPortfolioImages(userId);
        setImages(portfolioImages);
      } catch (error) {
        console.error('Error fetching portfolio images:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, [stylistId, user]);

  const handleImageAdded = (newImage: PortfolioImage) => {
    setImages(prev => [...prev, newImage]);
  };

  const handleImageDeleted = (imageId: string) => {
    setImages(prev => prev.filter(img => img.id !== imageId));
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Image className="w-5 h-5 text-[#3F0052]" />
          <h2 className="text-xl font-light text-[#3F0052] tracking-normal">
            Style Portfolio
          </h2>
        </div>
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-[#3F0052]" />
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="p-6">
        {isOwner ? (
          <PortfolioUpload
            images={images}
            onImageAdded={handleImageAdded}
            onImageDeleted={handleImageDeleted}
          />
        ) : images.length > 0 ? (
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Image className="w-5 h-5 text-[#3F0052]" />
                <h2 className="text-xl font-light text-[#3F0052] tracking-normal">
                  Style Portfolio
                </h2>
              </div>
              {images.length > 6 && (
                <div className="flex items-center gap-2">
                  <CarouselPrevious className="relative left-0 right-0 h-8 w-8" />
                  <CarouselNext className="relative left-0 right-0 h-8 w-8" />
                </div>
              )}
            </div>

            <CarouselContent>
              {imageChunks.map((chunk, chunkIndex) => (
                <CarouselItem key={chunkIndex}>
                  <div className="flex justify-between gap-4">
                    {chunk.map((image) => (
                      <div key={image.id} className="flex-1">
                        <Avatar 
                          className="w-24 h-24 mx-auto border-4 border-white shadow-lg hover:scale-105 transition-transform cursor-pointer"
                          onClick={() => setSelectedImage(image)}
                        >
                          <AvatarImage src={image.url} alt="Portfolio" className="object-cover" />
                          <AvatarFallback>Style</AvatarFallback>
                        </Avatar>
                      </div>
                    ))}
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        ) : (
          <div>
            <div className="flex items-center gap-2 mb-6">
              <Image className="w-5 h-5 text-[#3F0052]" />
              <h2 className="text-xl font-light text-[#3F0052] tracking-normal">
                Style Portfolio
              </h2>
            </div>
            <div className="text-center py-8 text-gray-500">
              <p className="tracking-normal">No portfolio images yet</p>
            </div>
          </div>
        )}
      </Card>

      {/* Image Preview Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-[800px] p-6">
          <DialogTitle className="text-xl font-light text-[#3F0052] mb-4">My Work!</DialogTitle>
          
          <div className="flex justify-center">
            {selectedImage && (
              <div className="relative w-full aspect-square max-w-[700px] rounded-lg overflow-hidden">
                <img 
                  src={selectedImage.url} 
                  alt="Portfolio preview"
                  className="w-full h-full object-contain"
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}