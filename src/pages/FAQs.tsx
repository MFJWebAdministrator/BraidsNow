import { FAQHeader } from '@/components/FAQs/FAQHeader';
import { FAQList } from '@/components/FAQs/FAQList';
import { SEO } from '@/components/SEO';
import { getPageMetadata } from '@/lib/metadata';

export function FAQsPage() {
  return (
    <div className="min-h-screen bg-white">
      <SEO metadata={getPageMetadata('faqs')} />
      <FAQHeader />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <FAQList />
      </div>
    </div>
  );
}