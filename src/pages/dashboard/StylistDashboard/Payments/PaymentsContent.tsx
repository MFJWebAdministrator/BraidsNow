import React, { useEffect, useState } from 'react';
import { StripeConnect } from '@/components/StylistCommunity/StripeConnect';
import { Card } from '@/components/ui/card';
import { DollarSign, Loader2, CheckCircle, AlertCircle, CreditCard } from 'lucide-react';
import { checkSubscriptionStatus } from '@/lib/stripe-connect';
import { useAuth } from '@/hooks/use-auth';
import { useSearchParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionStatus {
  active: boolean;
  currentPeriodEnd?: string;
  stripeAccountStatus?: string;
}

export function PaymentsContent() {
  const { user } = useAuth();
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  // Check for success or error in URL params
  useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');
    const refresh = searchParams.get('refresh');
    
    if (success === 'true') {
      toast({
        title: "Success",
        description: "Your payment was processed successfully!",
        variant: "default"
      });
    } else if (canceled === 'true') {
      toast({
        title: "Canceled",
        description: "Your payment was canceled.",
        variant: "destructive"
      });
    } else if (refresh === 'true') {
      toast({
        title: "Refreshing",
        description: "Please complete your Stripe account setup.",
        variant: "default"
      });
    }
  }, [searchParams, toast]);

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
    
    // Refresh status every 30 seconds if page is kept open
    const intervalId = setInterval(fetchStatus, 30000);
    
    return () => clearInterval(intervalId);
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
            <div className="bg-green-50 text-green-700 p-4 rounded-lg flex items-start gap-3">
              <CheckCircle className="w-5 h-5 mt-0.5" />
              <div>
                <p className="font-medium">Your subscription is active</p>
                {status.currentPeriodEnd && (
                  <p className="text-sm mt-1">
                    Next payment due: {new Date(status.currentPeriodEnd).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 text-yellow-700 p-4 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 mt-0.5" />
              <div>
                <p className="font-medium">No active subscription</p>
                <p className="text-sm mt-1">
                  A subscription is required to use the BraidsNow platform
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Stripe Connect Account Status */}
      {status?.active && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-5 h-5 text-[#3F0052]" />
            <h2 className="text-xl font-light text-[#3F0052] tracking-normal">
              Payment Account
            </h2>
          </div>
          
          {status.stripeAccountStatus === 'active' ? (
            <div className="bg-green-50 text-green-700 p-4 rounded-lg flex items-start gap-3">
              <CheckCircle className="w-5 h-5 mt-0.5" />
              <div>
                <p className="font-medium">Your Stripe account is connected</p>
                <p className="text-sm mt-1">
                  You can now receive payments from clients
                </p>
              </div>
            </div>
          ) : status.stripeAccountStatus === 'pending' ? (
            <div className="bg-blue-50 text-blue-700 p-4 rounded-lg flex items-start gap-3">
              <Loader2 className="w-5 h-5 mt-0.5 animate-spin" />
              <div>
                <p className="font-medium">Your Stripe account setup is pending</p>
                <p className="text-sm mt-1">
                  Please complete the onboarding process to receive payments
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 text-yellow-700 p-4 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 mt-0.5" />
              <div>
                <p className="font-medium">Connect your payment account</p>
                <p className="text-sm mt-1">
                  Set up Stripe Connect to receive payments from clients
                </p>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Stripe Connect Section - Show if no subscription or if subscription is active but no Connect account */}
      {(!status?.active || (status?.active && !status?.stripeAccountStatus)) && <StripeConnect />}
    </div>
  );
}