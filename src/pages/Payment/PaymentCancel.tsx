import { useSearchParams, Link } from 'react-router-dom';
import { XCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SEO } from '@/components/SEO';
import { getPageMetadata } from '@/lib/metadata';

export function PaymentCancel() {
  const [searchParams] = useSearchParams();
  const stylistId = searchParams.get('stylistId');

  return (
    <div className="container max-w-md mx-auto py-12 px-4">
      <SEO metadata={getPageMetadata('paymentCancel')} />
      <Card className="p-6 text-center">
        <div className="flex justify-center mb-4">
          <XCircle className="h-16 w-16 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Payment Canceled</h1>
        <p className="text-gray-600 mb-6">
          Your payment was canceled. No charges were made.
        </p>
        
        <div className="space-y-3">
          <Button asChild className="w-full">
            <Link to={stylistId ? `/stylist/${stylistId}` : "/find-stylists"}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Return to Stylist
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link to="/find-stylists">
              Browse Other Stylists
            </Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}