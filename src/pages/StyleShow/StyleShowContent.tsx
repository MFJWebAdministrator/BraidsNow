import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StyleGrid } from './StyleGrid';
import { Loader2 } from 'lucide-react';

interface StyleImage {
  url: string;
  category: string;
  createdAt: string;
  userId: string;
}

export function StyleShowContent() {
  const [images, setImages] = useState<StyleImage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const styleBoardsRef = collection(db, 'styleBoards');
        const querySnapshot = await getDocs(styleBoardsRef);
        
        const allImages: StyleImage[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          
          // Process current styles
          data.currentStyles?.forEach((style: StyleImage) => {
            allImages.push({
              ...style,
              userId: doc.id,
              category: 'current'
            });
          });

          // Process past styles
          data.pastStyles?.forEach((style: StyleImage) => {
            allImages.push({
              ...style,
              userId: doc.id,
              category: 'past'
            });
          });

          // Process wishlist
          data.wishlist?.forEach((style: StyleImage) => {
            allImages.push({
              ...style,
              userId: doc.id,
              category: 'wishlist'
            });
          });

          // Process natural hair
          data.naturalHair?.forEach((style: StyleImage) => {
            allImages.push({
              ...style,
              userId: doc.id,
              category: 'natural'
            });
          });
        });

        // Sort by createdAt
        allImages.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        setImages(allImages);
      } catch (error) {
        console.error('Error fetching images:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#3F0052]" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Tabs defaultValue="all">
        <TabsList className="grid w-full grid-cols-5 max-w-2xl mx-auto mb-8">
          <TabsTrigger value="all">All Styles</TabsTrigger>
          <TabsTrigger value="current">Current</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
          <TabsTrigger value="wishlist">Wishlist</TabsTrigger>
          <TabsTrigger value="natural">Natural</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <StyleGrid images={images} />
        </TabsContent>

        <TabsContent value="current">
          <StyleGrid images={images.filter(img => img.category === 'current')} />
        </TabsContent>

        <TabsContent value="past">
          <StyleGrid images={images.filter(img => img.category === 'past')} />
        </TabsContent>

        <TabsContent value="wishlist">
          <StyleGrid images={images.filter(img => img.category === 'wishlist')} />
        </TabsContent>

        <TabsContent value="natural">
          <StyleGrid images={images.filter(img => img.category === 'natural')} />
        </TabsContent>
      </Tabs>
    </div>
  );
}