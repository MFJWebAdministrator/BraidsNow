import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ProfileContent } from './ProfileContent';
import { useParams } from 'react-router-dom';

export function StylistProfilePage() {
  const { stylistId } = useParams();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="pt-16">
        <ProfileContent stylistId={stylistId!} />
      </main>
      <Footer />
    </div>
  );
}