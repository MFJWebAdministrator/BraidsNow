import React, { useEffect, useState } from 'react';
import { StripeConnect } from '@/components/StylistCommunity/StripeConnect';
import { Card } from '@/components/ui/card';
import { DollarSign, Loader2, CheckCircle, AlertCircle, CreditCard, XCircle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useSearchParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase/config';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

// Update the API base URL to the new endpoint
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

interface SubscriptionStatus {
  active: boolean;
  currentPeriodEnd?: string;
  stripeAccountStatus?: string;
  cancelAtPeriodEnd?: boolean;
  details?: {
    chargesEnabled?: boolean;
    payoutsEnabled?: boolean;
    requirementsPending?: boolean;
    requirementsCurrentlyDue?: string[];
  };
}

export function PaymentsContent() {
  const { user } = useAuth();
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [reactivateLoading, setReactivateLoading] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  // Check for success or error in URL params
  useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');
    const refresh = searchParams.get('refresh');

    if (success === 'true') {
      toast({
        title: "Payment Successful",
        description: "Your payment was processed successfully! Your subscription will be active shortly.",
        variant: "default"
      });

      // Force an immediate status check after successful payment
      if (user) {
        setTimeout(() => {
          fetchStatus(true);
        }, 2000); // Wait 2 seconds for webhook processing
      }
    } else if (canceled === 'true') {
      toast({
        title: "Payment Canceled",
        description: "Your payment was canceled. No charges were made to your account.",
        variant: "destructive"
      });
    } else if (refresh === 'true') {
      toast({
        title: "Account Setup",
        description: "Please complete your Stripe account setup to receive payments.",
        variant: "default"
      });

      // Force an immediate status check after refresh
      if (user) {
        setTimeout(() => {
          fetchStatus(true);
        }, 2000);
      }
    }
  }, [searchParams, toast, user]);

  // Define fetchStatus as a named function so we can call it from multiple places
  const fetchStatus = async (forceRefresh = false) => {
    if (!user || !user.uid) {
      console.log('No user or user ID available');
      setLoading(false);
      return;
    }

    try {
      console.log('Fetching status for user ID:', user.uid);
  
      // Ensure user is authenticated and token is fresh
      if (!auth.currentUser) {
        console.log('No current user in auth object');
        setLoading(false);
        return;
      }
  
      // Refresh the token before making the request
      const idToken = await auth.currentUser.getIdToken(forceRefresh);
      console.log('Token refreshed successfully');
  
      // Call the Express API endpoint with the user ID
      const response = await axios.post(
        `${API_BASE_URL}/check-account-status`,
        { userId: user.uid },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          }
        }
      );

      console.log('Subscription status response:', response.data);

      // Transform the response data to match our SubscriptionStatus interface
      // Convert Firestore timestamp to JavaScript Date
      const convertFirestoreTimestampToDate = (timestamp: { _seconds: number, _nanoseconds: number }) => {
        return new Date(timestamp._seconds * 1000 + timestamp._nanoseconds / 1000000);
      };

      const subscriptionStatus: SubscriptionStatus = {
        active: response.data.subscription?.status === 'active' || false,
        currentPeriodEnd: response.data.subscription?.currentPeriodEnd ? convertFirestoreTimestampToDate(response.data.subscription.currentPeriodEnd).toISOString() : undefined,
        stripeAccountStatus: response.data.status || 'not_created',
        cancelAtPeriodEnd: response.data.subscription?.cancelAtPeriodEnd || false,
        details: response.data.details
      };

      setStatus(subscriptionStatus);
      
      // Show toast for status changes if this is a forced refresh
      if (forceRefresh) {
        if (subscriptionStatus.active && !subscriptionStatus.cancelAtPeriodEnd) {
          toast({
            title: "Subscription Active",
            description: "Your subscription is now active.",
            variant: "default"
          });
        } else if (subscriptionStatus.stripeAccountStatus === 'active' && response.data.statusChanged) {
          toast({
            title: "Payout Account Ready",
            description: "Your payout account is now set up and ready to receive payments.",
            variant: "default"
          });
        }
      }
    } catch (error) {
      console.error('Error fetching subscription status:', error);
      
      // Provide more specific error messages
      let errorMessage = "Failed to fetch your account status. Please try again.";
      
      if (error instanceof Error) {
        if (error.message.includes('network')) {
          errorMessage = "Network error. Please check your internet connection.";
        }
      }
      
      toast({
        title: "Status Update Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle subscription reactivation
  const handleReactivateSubscription = async () => {
    if (!user || !user.uid) {
      toast({
        title: "Authentication Error",
        description: "User information not available. Please log out and log back in.",
        variant: "destructive"
      });
      return;
    }

    setReactivateLoading(true);
    try {
      // Refresh the token before making the request
      const idToken = await auth.currentUser?.getIdToken(true);

      // Call the Express API endpoint to reactivate subscription
      const response = await axios.post(
        `${API_BASE_URL}/reactivate-subscription`,
        { 
          userId: user.uid,
          origin: getFormattedOriginUrl() // Use the helper function here
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          }
        }
      );

      // Show success message
      toast({
        title: "Subscription Reactivated",
        description: "Your subscription has been reactivated and will continue at the end of the current billing period.",
        variant: "default"
      });

      // Update local state
      setStatus(prev => prev ? {
        ...prev,
        cancelAtPeriodEnd: false
      } : null);
    } catch (error) {
      console.error('Error reactivating subscription:', error);
      
      // Provide more specific error messages
      let errorMessage = "Failed to reactivate subscription. Please try again.";
      
      if (error instanceof Error) {
        if (error.message.includes('authentication')) {
          errorMessage = "Authentication error. Please log out and log back in.";
        } else if (error.message.includes('network')) {
          errorMessage = "Network error. Please check your internet connection.";
        }
      }
      
      toast({
        title: "Reactivation Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setReactivateLoading(false);
    }
  };
  
  // Handle subscription cancellation
  const handleCancelSubscription = async () => {
    if (!user || !user.uid) {
      toast({
        title: "Authentication Error",
        description: "User information not available. Please log out and log back in.",
        variant: "destructive"
      });
      return;
    }

    setCancelLoading(true);
    try {
      // Refresh the token before making the request
      const idToken = await auth.currentUser?.getIdToken(true);

      // Call the Express API endpoint to cancel subscription
      const response = await axios.post(
        `${API_BASE_URL}/cancel-subscription`,
        { 
          userId: user.uid,
          origin: getFormattedOriginUrl() // Use the helper function here
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          }
        }
      );

      // Show success message
      toast({
        title: "Subscription Canceled",
        description: "Your subscription will end at the end of the current billing period.",
        variant: "default"
      });

      // Update local state
      setStatus(prev => prev ? {
        ...prev,
        cancelAtPeriodEnd: true
      } : null);

      // Close the dialog
      setCancelDialogOpen(false);
    } catch (error) {
      console.error('Error canceling subscription:', error);
      
      // Provide more specific error messages
      let errorMessage = "Failed to cancel subscription. Please try again.";
      
      if (error instanceof Error) {
        if (error.message.includes('authentication')) {
          errorMessage = "Authentication error. Please log out and log back in.";
        } else if (error.message.includes('network')) {
          errorMessage = "Network error. Please check your internet connection.";
        }
      }
      
      toast({
        title: "Cancellation Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setCancelLoading(false);
    }
  };

  // Initial fetch and periodic refresh
  useEffect(() => {
    if (user) {
      fetchStatus();

      // Refresh status every 30 seconds if page is kept open
      const intervalId = setInterval(() => fetchStatus(), 30000);

      return () => clearInterval(intervalId);
    } else {
      setLoading(false);
    }
  }, [user]);

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-4">Subscription Status</h2>
          {status?.active ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="text-green-500" />
                <span>Your subscription is active</span>
              </div>
              {status.currentPeriodEnd && (
                <p className="text-sm text-gray-600">
                  Next billing date: {new Date(status.currentPeriodEnd).toLocaleDateString()}
                </p>
              )}
              {status.cancelAtPeriodEnd ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-amber-600">
                    <AlertCircle />
                    <span>Your subscription will end at the current billing period</span>
                  </div>
                  <Button
                    onClick={handleReactivateSubscription}
                    disabled={reactivateLoading}
                  >
                    {reactivateLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <CreditCard className="h-4 w-4 mr-2" />
                    )}
                    Reactivate Subscription
                  </Button>
                </div>
              ) : (
                <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="destructive">
                      <XCircle className="h-4 w-4 mr-2" />
                      Cancel Subscription
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Cancel Subscription</DialogTitle>
                      <DialogDescription>
                        Are you sure you want to cancel your subscription? You'll continue to have access until the end of your current billing period.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
                        Keep Subscription
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleCancelSubscription}
                        disabled={cancelLoading}
                      >
                        {cancelLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <XCircle className="h-4 w-4 mr-2" />
                        )}
                        Confirm Cancellation
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-amber-600">
                <AlertCircle />
                <span>No active subscription</span>
              </div>
              <StripeConnect subscriptionActive={false} />
            </div>
          )}
        </Card>
      )}
    </div>
  );
}


