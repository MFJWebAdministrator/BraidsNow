import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, CreditCard } from 'lucide-react';
import { createConnectAccount, setupSubscription } from '@/lib/stripe-connect';
import { useToast } from '@/hooks/use-toast';

export function StripeConnect() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleConnect = async () => {
    try {
      setIsLoading(true);
      
      // First set up the subscription
      const clientSecret = await setupSubscription();
      
      if (!clientSecret) {
        throw new Error('Failed to set up subscription');
      }

      // Then create the Connect account
      await createConnectAccount();
      
      toast({
        title: "Success",
        description: "Your account has been connected with Stripe",
      });
    } catch (error: any) {
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect with Stripe",
        variant: "destructive"
      });
    } finally {
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
        <p className="text-[#3F0052] font-medium tracking-normal">
          Monthly Subscription: $19.99
        </p>
        <p className="text-sm text-gray-600 tracking-normal mt-1">
          Required to use the BraidsNow platform
        </p>
      </div>

      <Button
        onClick={handleConnect}
        disabled={isLoading}
        className="w-full rounded-full"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Connecting...
          </>
        ) : (
          'Connect with Stripe'
        )}
      </Button>
    </Card>
  );
}