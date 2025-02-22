import React, { useEffect, useState } from 'react';
import { StripeConnect } from '@/components/StylistCommunity/StripeConnect';
import { Card } from '@/components/ui/card';
import { DollarSign, Loader2 } from 'lucide-react';
import { checkSubscriptionStatus } from '@/lib/stripe-connect';
import { useAuth } from '@/hooks/use-auth';

interface SubscriptionStatus {
  active: boolean;
  currentPeriodEnd?: string;
}

export function PaymentsContent() {
  const { user } = useAuth();
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const subscriptionStatus = await checkSubscriptionStatus(user.uid);
        setStatus(subscriptionStatus);
      } catch (error) {
        console.error('Error fetching subscription status:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#3F0052]" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Subscription Status */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="w-5 h-5 text-[#3F0052]" />
          <h2 className="text-xl font-light text-[#3F0052] tracking-normal">
            Subscription Status
          </h2>
        </div>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-600">Current Plan</p>
              <p className="text-lg font-medium text-[#3F0052]">Professional Stylist</p>
            </div>
            <div className="text-right">
              <p className="text-gray-600">Monthly Fee</p>
              <p className="text-lg font-medium text-[#3F0052]">$19.99</p>
            </div>
          </div>
          
          {status?.active ? (
            <div className="bg-green-50 text-green-700 p-4 rounded-lg">
              <p>Your subscription is active</p>
              {status.currentPeriodEnd && (
                <p className="text-sm mt-1">
                  Next payment due: {new Date(status.currentPeriodEnd).toLocaleDateString()}
                </p>
              )}
            </div>
          ) : (
            <div className="bg-yellow-50 text-yellow-700 p-4 rounded-lg">
              <p>No active subscription</p>
              <p className="text-sm mt-1">
                A subscription is required to use the BraidsNow platform
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Stripe Connect Section */}
      {!status?.active && <StripeConnect />}
    </div>
  );
}