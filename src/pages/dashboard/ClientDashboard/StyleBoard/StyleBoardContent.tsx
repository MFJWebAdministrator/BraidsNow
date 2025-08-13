import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useStyleBoard } from '@/hooks/use-style-board';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';
import { StyleSection } from './sections/StyleSection';
import { HairTypeSection } from './sections/HairTypeSection';
import { StyleBoardUpload } from './StyleBoardUpload';
import { useToast } from '@/hooks/use-toast';
import type { StyleImage } from '@/lib/schemas/style-board';

export function StyleBoardContent() {
  const { user } = useAuth();
  const { styleBoard, loading } = useStyleBoard(user?.uid || '');
  const [showUpload, setShowUpload] = useState(false);
  const [uploadCategory, setUploadCategory] = useState<StyleImage['category']>('current');
  console.log("uploadCategory", uploadCategory);
  const { toast } = useToast();

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#3F0052]" />
      </div>
    );
  }

  if (!styleBoard) return null;
  
  const handleUpload = async (file: File) => {
    try {
      if (!user) {
        throw new Error('You must be logged in to upload images');
      }
      console.log("handleUpload file name", file.name)
      // Upload logic will be handled by the parent component
      setShowUpload(false);
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload image",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const handleDelete = async (imageId: string, category: StyleImage['category']) => {
    console.log("handleDelete imageId", imageId)
    console.log("handleDelete category", category)
    try {
      // Delete logic will be handled by the parent component
      toast({
        title: "Success",
        description: "Image deleted successfully"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete image",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const handleShowUpload = (category: StyleImage['category']) => {
    setUploadCategory(category);
    setShowUpload(true);
  };

  return (
    <Card className="p-6">
      <HairTypeSection
        hairType={styleBoard.hairType}
        onUpdate={async () => {}}
      />

      <div className="mt-8">
        <Tabs defaultValue="current">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="current">Current Style</TabsTrigger>
            <TabsTrigger value="past">Past Looks</TabsTrigger>
            <TabsTrigger value="wishlist">Style Wishlist</TabsTrigger>
            <TabsTrigger value="natural">Natural Hair</TabsTrigger>
          </TabsList>

          <TabsContent value="current">
            <StyleSection
              title="My Current Hairstyle"
              description="Share your current look"
              images={styleBoard.currentStyles}
              category="current"
              onShowUpload={() => handleShowUpload('current')}
              onDelete={handleDelete}
            />
          </TabsContent>

          <TabsContent value="past">
            <StyleSection
              title="My Favorite Past Looks"
              description="Keep track of styles you've loved"
              images={styleBoard.pastStyles}
              category="past"
              onShowUpload={() => handleShowUpload('past')}
              onDelete={handleDelete}
            />
          </TabsContent>

          <TabsContent value="wishlist">
            <StyleSection
              title="Styles I Want to Try"
              description="Save inspiration for your next style"
              images={styleBoard.wishlist}
              category="wishlist"
              onShowUpload={() => handleShowUpload('wishlist')}
              onDelete={handleDelete}
            />
          </TabsContent>

          <TabsContent value="natural">
            <StyleSection
              title="My Natural Hair"
              description="Document your natural hair journey"
              images={styleBoard.naturalHair}
              category="natural"
              onShowUpload={() => handleShowUpload('natural')}
              onDelete={handleDelete}
            />
          </TabsContent>
        </Tabs>
      </div>

      <StyleBoardUpload
        open={showUpload}
        onClose={() => setShowUpload(false)}
        onUpload={handleUpload}
      />
    </Card>
  );
}