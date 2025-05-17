import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { ImageUpload } from '@/components/ClientCommunity/ImageUpload';
import type { UseFormReturn } from 'react-hook-form';
import type { ClientSettingsForm } from '@/lib/schemas/client-settings';

interface ProfileSectionProps {
  form: UseFormReturn<ClientSettingsForm>;
  onImageChange: (file: File) => void;
}

export function ProfileSection({ onImageChange }: ProfileSectionProps) {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-light text-[#3F0052]">Profile Image</h2>
        <p className="text-sm text-gray-500">
          Upload a profile picture to personalize your account
        </p>
      </CardHeader>
      <CardContent>
        <div className="max-w-sm">
          <ImageUpload onImageSelect={onImageChange} />
        </div>
      </CardContent>
    </Card>
  );
}