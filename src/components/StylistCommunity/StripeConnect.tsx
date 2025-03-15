import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, CreditCard, CheckCircle, AlertCircle } from 'lucide-react';
import { setupSubscription, createConnectAccount, checkSubscriptionStatus } from '@/lib/stripe-client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

export function StripeConnect() {
  const [isLoading, setIsLoading] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<{
    active: boolean;
    stripeAccountStatus?: string;
  }>({ active: false });
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const checkStatus = async () => {
      if (user?.uid) {
        try {
          const status = await checkSubscriptionStatus(user.uid);
          setSubscriptionStatus(status);
        } catch (error) {
          console.error("Error checking subscription status:", error);
        }
      }
    };
    
    checkStatus();
  }, [user]);

  const handleSubscribe = async () => {
    try {
      setIsLoading(true);
      
      if (!user) {
        throw new Error('You must be logged in to subscribe');
      }
      
      // Set up the subscription
      await setupSubscription();
      
      toast({
        title: "Redirecting to Stripe",
        description: "You'll be redirected to complete your subscription",
      });
    } catch (error: any) {
      toast({
        title: "Subscription Failed",
        description: error.message || "Failed to set up subscription",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      setIsLoading(true);
      
      if (!user) {
        throw new Error('You must be logged in to connect with Stripe');
      }
      
      // Create Connect account
      await createConnectAccount();
      
      toast({
        title: "Redirecting to Stripe",
        description: "You'll be redirected to complete your account setup",
      });
    } catch (error: any) {
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect with Stripe",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center gap-2">
        <CreditCard className="w-5 h-5 text-[#3F0052]" />
        <h2 className="text-xl font-light text-[#3F0052] tracking-normal">
          Payment Information
        </h2>
      </div>

      <p className="text-gray-600 tracking-normal">
        Connect your bank account to receive payments from clients and set up your subscription.
      </p>

      <div className="bg-[#3F0052]/5 p-4 rounded-lg">
        {subscriptionStatus.active ? (
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 mt-0.5 text-green-600" />
            <div>
              <p className="font-medium">Your subscription is active</p>
              <p className="text-sm mt-1">
                {subscriptionStatus.stripeAccountStatus === 'active' ? (
                  "Your Stripe account is fully set up and ready to receive payments."
                ) : (
                  "Now you can connect your Stripe account to receive payments."
                )}
              </p>
              
              {!subscriptionStatus.stripeAccountStatus && (
                <Button 
                  onClick={handleConnect}
                  disabled={isLoading}
                  className="mt-3 bg-[#3F0052] hover:bg-[#3F0052]/90"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    "Connect Stripe Account"
                  )}
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 mt-0.5 text-amber-600" />
            <div>
              <p className="font-medium">Subscription Required</p>
              <p className="text-sm mt-1">
                A subscription is required to use the BraidsNow platform as a stylist.
              </p>
              
              <Button 
                onClick={handleSubscribe}
                disabled={isLoading}
                className="mt-3 bg-[#3F0052] hover:bg-[#3F0052]/90"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Subscribe Now - $19.99/month"
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}