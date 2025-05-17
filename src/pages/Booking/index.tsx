import { useNavigate, useParams } from 'react-router-dom';
import { BookingSteps } from './BookingSteps';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export function BookingPage() {
  const { stylistId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    navigate('/login', { state: { from: `/book/${stylistId}` } });
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 pt-4">
        <Button
          variant="ghost"
          onClick={() => navigate(`/stylist/${stylistId}`)}
          className="text-[#3F0052] hover:text-[#DFA801] mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Return to Stylist Profile
        </Button>

        <BookingSteps stylistId={stylistId!} />
      </div>
    </div>
  );
}