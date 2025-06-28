import { SuccessStoriesHeader } from '@/components/SuccessStories/SuccessStoriesHeader';
import { StoriesList } from '@/components/SuccessStories/StoriesList';
import { SEO } from '@/components/SEO';
import { getPageMetadata } from '@/lib/metadata';

export function SuccessStoriesPage() {
  return (
    <div className="min-h-screen bg-white">
      <SEO metadata={getPageMetadata('successStories')} />
      <SuccessStoriesHeader />
      <StoriesList />
    </div>
  );
}