import React from 'react';
import { SuccessStoriesHeader } from '@/components/SuccessStories/SuccessStoriesHeader';
import { StoriesList } from '@/components/SuccessStories/StoriesList';

export function SuccessStoriesPage() {
  return (
    <div className="min-h-screen bg-white">
      <SuccessStoriesHeader />
      <StoriesList />
    </div>
  );
}