import { Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center py-24 px-4">
        <div className="text-center">
          <h1 className="text-8xl font-extrabold gradient-text mb-4 select-none">404</h1>
          <h2 className="text-3xl font-bold text-[#3F0052] mb-2">Page Not Found</h2>
          <p className="text-lg text-gray-700 mb-8 max-w-md mx-auto">
            Oops! The page you’re looking for doesn’t exist or has been moved.<br />
            Let’s get you back to beautiful styles!
          </p>
          <Button asChild size="lg" className="bg-[#3F0052] hover:bg-[#FBCC14] text-white font-semibold shadow-lg">
            <Link to="/">Return Home</Link>
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
}
