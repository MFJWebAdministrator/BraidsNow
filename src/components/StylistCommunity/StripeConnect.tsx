import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import axios from 'axios';
import { auth } from '@/lib/firebase/config';

// Use the same API base URL as in PaymentsContent.tsx
const API_BASE_URL = 'https://api-5prtp2eqea-uc.a.run.app';

// Helper function to ensure origin URL is properly formatted for Stripe
const getFormattedOriginUrl = () => {
  const origin = window.location.origin;
  
  // Stripe accepts localhost URLs, but we need to ensure they're properly formatted
  if (origin.includes('localhost')) {
    // Make sure it has the proper protocol
    if (!origin.startsWith('http://') && !origin.startsWith('https://')) {
      return `http://${origin}`;
    }
  }
  
  return origin;
};

interface StripeConnectProps {
  subscriptionActive: boolean;
}

export function StripeConnect({ 
  subscriptionActive
}: StripeConnectProps) {
  const [loading, setLoading] = useState<'subscription' | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSubscribe = async () => {
    if (!user || !user.uid) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to subscribe.",
        variant: "destructive",
      });
      return;
    }

    setLoading('subscription');
    try {
      console.log('Setting up subscription for user ID:', user.uid);
      
      // Get fresh ID token
      const idToken = await auth.currentUser?.getIdToken(true);
      if (!idToken) {
        throw new Error('Failed to get authentication token');
      }
      
      // Get properly formatted origin URL
      const originUrl = getFormattedOriginUrl();
      
      // Call the Express API endpoint
      const response = await axios.post(
        `${API_BASE_URL}/create-checkout-session`,
        {
          userId: user.uid,
          email: user.email || '',
          successUrl: `${originUrl}/dashboard/stylist/payments?success=true`,
          cancelUrl: `${originUrl}/dashboard/stylist/payments?canceled=true`
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          }
        }
      );
      
      console.log('Checkout session created:', response.data);
      
      // Show processing toast before redirect
      toast({
        title: "Processing Subscription",
        description: "You're being redirected to the secure payment page.",
        variant: "default"
      });
      
      // Redirect to Stripe Checkout
      const { sessionId } = response.data;
      const stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
      if (stripe) {
        await stripe.redirectToCheckout({ sessionId });
      } else {
        throw new Error('Failed to load Stripe');
      }
    } catch (error) {
      console.error('Error setting up subscription:', error);
      
      // Provide more specific error messages based on the error type
      let errorMessage = "Failed to set up subscription. Please try again.";
      
      if (error instanceof Error) {
        if (error.message.includes('authentication')) {
          errorMessage = "Authentication error. Please log out and log back in.";
        } else if (error.message.includes('network')) {
          errorMessage = "Network error. Please check your internet connection.";
        } else if (error.message.includes('Stripe')) {
          errorMessage = "Payment processor error. Please try again later.";
        }
      }
      
      toast({
        title: "Subscription Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  return (
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
