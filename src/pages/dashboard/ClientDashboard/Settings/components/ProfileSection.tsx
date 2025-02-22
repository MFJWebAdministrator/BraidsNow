import React from 'react';
import { ImageUpload } from '@/components/ClientCommunity/ImageUpload';

interface ProfileSectionProps {
  onImageChange: (file: File) => void;
}

export function ProfileSection({ onImageChange }: ProfileSectionProps) {
  return (
    <div>
      <h3 className="text-lg font-light text-[#3F0052] mb-4">Profile Image</h3>
      <div className="max-w-sm">
        <ImageUpload onImageSelect={onImageChange} />
      </div>
    </div>
  );
}