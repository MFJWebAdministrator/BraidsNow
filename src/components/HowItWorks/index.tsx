import { Content } from './Content';
import { ImageSection } from './ImageSection';

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <ImageSection />
          <Content />
        </div>
      </div>
    </section>
  );
}