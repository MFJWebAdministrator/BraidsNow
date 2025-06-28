import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ProfileContent } from './ProfileContent';
import { useParams } from 'react-router-dom';
import { SEO } from '@/components/SEO';
import { getPageMetadata } from '@/lib/metadata';

export function StylistProfilePage() {
  const { stylistId } = useParams();

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO metadata={getPageMetadata('stylistProfile')} />
      <Header />
      <main className="pt-16">
        <ProfileContent stylistId={stylistId!} />
      </main>
      <Footer />
    </div>
  );
}