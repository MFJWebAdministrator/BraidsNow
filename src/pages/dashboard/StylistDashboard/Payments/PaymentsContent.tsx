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
        title: "Success",
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
    } catch (error) {
      console.error('Error fetching subscription status:', error);
      toast({
        title: "Error",
        description: "Failed to fetch subscription status. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle subscription cancellation
  const handleCancelSubscription = async () => {
    if (!user || !user.uid) {
      toast({
        title: "Error",
        description: "User information not available",
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
        { userId: user.uid },
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
      toast({
        title: "Error",
        description: "Failed to cancel subscription. Please try again.",
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
  }, [user, toast]);

  if (loading) {
    return (
      <div className="space-y-8">
        {/* Skeleton for Subscription Status */}
        <Card className="p-6 animate-pulse">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-5 h-5 bg-gray-300 rounded-full"></div>
            <div className="h-6 bg-gray-300 rounded w-1/3"></div>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <div className="h-4 bg-gray-300 rounded w-1/4"></div>
                <div className="h-6 bg-gray-300 rounded w-1/2 mt-2"></div>
              </div>
              <div className="text-right">
                <div className="h-4 bg-gray-300 rounded w-1/4"></div>
                <div className="h-6 bg-gray-300 rounded w-1/3 mt-2"></div>
              </div>
            </div>
            <div className="h-4 bg-gray-300 rounded w-full mt-4"></div>
          </div>
        </Card>

        {/* Skeleton for Payment Account */}
        <Card className="p-6 animate-pulse">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-5 h-5 bg-gray-300 rounded-full"></div>
            <div className="h-6 bg-gray-300 rounded w-1/3"></div>
          </div>
          <div className="h-4 bg-gray-300 rounded w-full mt-4"></div>
          <div className="h-4 bg-gray-300 rounded w-3/4 mt-2"></div>
        </Card>
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
                {status.cancelAtPeriodEnd && (
                  <p className="text-sm mt-1 text-amber-600">
                    Your subscription will end at the end of the current billing period.
                  </p>
                )}
                {status.currentPeriodEnd && !isNaN(new Date(status.currentPeriodEnd).getTime()) ? (
                  <p className="text-sm mt-1">
                    Next payment due: {new Date(status.currentPeriodEnd).toLocaleDateString()}
                  </p>
                ) : (
                  <p className="text-sm mt-1">
                    Next payment due: Date not available
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
          
          {/* Subscription Management Buttons */}
          {status?.active && !status.cancelAtPeriodEnd && (
            <div className="mt-4">
              <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600">
                    <XCircle className="w-4 h-4 mr-2" />
                    Cancel Subscription
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Cancel Subscription</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your current billing period.
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
                      {cancelLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Yes, Cancel Subscription
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}
          
          {/* Reactivate Subscription Button */}
          {status?.active && status.cancelAtPeriodEnd && (
            <div className="mt-4">
              <Button variant="default" className="bg-[#3F0052] hover:bg-[#2A0038]">
                Reactivate Subscription
              </Button>
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
      {(!status?.active || (status?.active && !status?.stripeAccountStatus)) && (
        <StripeConnect 
          subscriptionActive={status?.active || false} 
          connectAccountStatus={status?.stripeAccountStatus || 'not_created'} 
          useExpressApi={true} // Add this prop to indicate we're using Express API
        />
      )}
    </div>
  );
}