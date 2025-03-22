import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import axios from 'axios';
import { auth } from '@/lib/firebase/config';

// Define the API base URL - Use the /api prefix
const API_BASE_URL = 'https://api-5prtp2eqea-uc.a.run.app';

interface StripeConnectProps {
  subscriptionActive: boolean;
  connectAccountStatus: string;
  useExpressApi?: boolean;
}

export function StripeConnect({ 
  subscriptionActive, 
  connectAccountStatus,
  useExpressApi = false
}: StripeConnectProps) {
  const [loading, setLoading] = useState<'subscription' | 'connect' | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSubscribe = async () => {
    if (!user || !user.uid) {
      toast({
        title: "Error",
        description: "You must be logged in to subscribe.",
        variant: "destructive",
      });
      return;
    }

    setLoading('subscription');
    try {
      console.log('Setting up subscription for user ID:', user.uid);
      
      if (useExpressApi) {
        // Get fresh ID token
        const idToken = await auth.currentUser?.getIdToken(true);
        
        // Call the Express API endpoint
        const response = await axios.post(
          `${API_BASE_URL}/create-checkout-session`,
          {
            userId: user.uid,
            email: user.email || '',
            successUrl: `${window.location.origin}/dashboard/stylist/payments?success=true`,
            cancelUrl: `${window.location.origin}/dashboard/stylist/payments?canceled=true`
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${idToken}`
            }
          }
        );
        
        console.log('Checkout session created:', response.data);
        
        // Redirect to Stripe Checkout
        const { sessionId } = response.data;
        const stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
        if (stripe) {
          await stripe.redirectToCheckout({ sessionId });
        } else {
          throw new Error('Failed to load Stripe');
        }
      } else {
        // Use the existing function (fallback)
        await setupSubscription(user.uid);
      }
    } catch (error) {
      console.error('Error setting up subscription:', error);
      toast({
        title: "Error",
        description: "Failed to set up subscription. Please try again.",
        variant: "destructive",
      });
      setLoading(null);
    }
  };

  const handleConnectAccount = async () => {
    if (!user || !user.uid) {
      toast({
        title: "Error",
        description: "You must be logged in to set up your payout account.",
        variant: "destructive",
      });
      return;
    }

    setLoading('connect');
    try {
      console.log('Creating Connect account for user ID:', user.uid);
      
      if (useExpressApi) {
        // Get fresh ID token
        const idToken = await auth.currentUser?.getIdToken(true);
        
        // Call the Express API endpoint
        const response = await axios.post(
          `${API_BASE_URL}/create-connect-account`,
          {
            userId: user.uid,
            email: user.email || '',
            origin: window.location.origin
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${idToken}`
            }
          }
        );
        
        console.log('Connect account created:', response.data);
        
        // Redirect to Stripe Connect onboarding
        window.location.href = response.data.url;
      } else {
        // Use the existing function (fallback)
        await createConnectAccount(user.uid);
      }
    } catch (error) {
      console.error('Error creating Connect account:', error);
      toast({
        title: "Error",
        description: "Failed to set up payout account. Please try again.",
        variant: "destructive",
      });
      setLoading(null);
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-light text-[#3F0052] tracking-normal mb-4">
        {subscriptionActive ? "Set Up Payments" : "Get Started"}
      </h2>
      
      {!subscriptionActive ? (
        <div className="space-y-4">
          <p className="text-gray-600">
            Subscribe to our Professional Stylist plan to start accepting bookings and payments.
          </p>
          <Button 
            onClick={handleSubscribe}
            className="w-full bg-[#3F0052] hover:bg-[#2A0038] text-white"
            disabled={loading === 'subscription'}
          >
            {loading === 'subscription' ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>Subscribe - $19.99/month</>
            )}
          </Button>
          <p className="text-sm text-gray-500 text-center">
            Cancel anytime. Subscription renews monthly.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-gray-600">
            Connect your Stripe account to receive payments from clients.
          </p>
          <Button 
            onClick={handleConnectAccount}
            className="w-full bg-[#3F0052] hover:bg-[#2A0038] text-white"
            disabled={loading === 'connect'}
          >
            {loading === 'connect' ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>Set Up Payout Account</>
            )}
          </Button>
          <p className="text-sm text-gray-500 text-center">
            Powered by Stripe Connect. Your banking information is secure.
          </p>
        </div>
      )}
    </Card>
  );
}

// Helper function to load Stripe
async function loadStripe(key: string) {
  if (!window.Stripe) {
    const script = document.createElement('script');
    script.src = 'https://js.stripe.com/v3/';
    script.async = true;
    document.body.appendChild(script);
    
    await new Promise((resolve) => {
      script.onload = resolve;
    });
  }
  
  return window.Stripe(key);
}

// Add Stripe to the Window interface
declare global {
  interface Window {
    Stripe?: any;
  }
}

// Import these functions if needed for fallback
import { setupSubscription, createConnectAccount } from '@/lib/stripe-client';