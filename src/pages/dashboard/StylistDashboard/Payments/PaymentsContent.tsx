import React, { useEffect, useState } from 'react';
import { loadStripe, StripeConnect } from '@/components/StylistCommunity/StripeConnect';
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
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [reactivateLoading, setReactivateLoading] = useState(false);
  const [connectLoading, setConnectLoading] = useState(false);

  // Check for success or canceled URL parameters
  useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');

    if (success === 'true') {
      toast({
        title: 'Subscription Activated',
        description: 'Your subscription has been successfully activated.',
        variant: 'default',
      });
    } else if (canceled === 'true') {
      toast({
        title: 'Subscription Canceled',
        description: 'Your subscription setup was canceled.',
        variant: 'destructive',
      });
    }

    // Check for account setup success or failure
    const accountSuccess = searchParams.get('account_success');
    const accountCanceled = searchParams.get('account_canceled');

    if (accountSuccess === 'true') {
      toast({
        title: 'Account Setup Complete',
        description: 'Your payout account has been successfully set up.',
        variant: 'default',
      });
    } else if (accountCanceled === 'true') {
      toast({
        title: 'Account Setup Canceled',
        description: 'Your payout account setup was canceled.',
        variant: 'destructive',
      });
    }
  }, [searchParams, toast]);

  // Fetch subscription status
  useEffect(() => {
    const fetchStatus = async () => {
      if (!user || !user.uid) return;

      try {
        setLoading(true);
        
        // Get fresh ID token
        const idToken = await auth.currentUser?.getIdToken(true);
        
        // Call the Express API endpoint
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
        
        setStatus(response.data);
      } catch (error) {
        console.error('Error fetching subscription status:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch subscription status. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, [user, toast]);

  // Handle canceling a subscription
  const handleCancelSubscription = async () => {
    if (!user || !user.uid) {
      toast({
        title: 'Authentication Error',
        description: 'User information not available. Please log out and log back in.',
        variant: 'destructive',
      });
      return;
    }

    setCancelLoading(true);
    try {
      // Get fresh ID token
      const idToken = await auth.currentUser?.getIdToken(true);
      
      // Call the Express API endpoint
      await axios.post(
        `${API_BASE_URL}/cancel-subscription`,
        { userId: user.uid },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          }
        }
      );
      
      // Update local state
      setStatus(prev => prev ? { 
        ...prev, 
        cancelAtPeriodEnd: true 
      } : null);
      
      // Close the dialog
      setCancelDialogOpen(false);
      
      toast({
        title: 'Subscription Canceled',
        description: 'Your subscription has been canceled and will end at the current billing period.',
        variant: 'default',
      });
    } catch (error) {
      console.error('Error canceling subscription:', error);
      toast({
        title: 'Error',
        description: 'Failed to cancel subscription. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setCancelLoading(false);
    }
  };

  // Handle reactivating a subscription
  const handleReactivateSubscription = async () => {
    if (!user || !user.uid) {
      toast({
        title: 'Authentication Error',
        description: 'User information not available. Please log out and log back in.',
        variant: 'destructive',
      });
      return;
    }

    setReactivateLoading(true);
    try {
      // Get fresh ID token
      const idToken = await auth.currentUser?.getIdToken(true);
      
      // Call the Express API endpoint
      await axios.post(
        `${API_BASE_URL}/reactivate-subscription`,
        { userId: user.uid },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          }
        }
      );
      
      // Update local state
      setStatus(prev => prev ? { 
        ...prev, 
        cancelAtPeriodEnd: false 
      } : null);
      
      toast({
        title: 'Subscription Reactivated',
        description: 'Your subscription has been reactivated and will continue at the end of the current billing period.',
        variant: 'default',
      });
    } catch (error) {
      console.error('Error reactivating subscription:', error);
      toast({
        title: 'Error',
        description: 'Failed to reactivate subscription. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setReactivateLoading(false);
    }
  };

  // Format requirement strings to be more user-friendly
  const formatRequirement = (requirement: string): string => {
    const formattedRequirements: Record<string, string> = {
      'external_account': 'Bank account information',
      'individual.address.city': 'City',
      'individual.address.line1': 'Address',
      'individual.address.postal_code': 'Postal code',
      'individual.address.state': 'State',
      'individual.dob.day': 'Date of birth (day)',
      'individual.dob.month': 'Date of birth (month)',
      'individual.dob.year': 'Date of birth (year)',
      'individual.email': 'Email address',
      'individual.first_name': 'First name',
      'individual.last_name': 'Last name',
      'individual.phone': 'Phone number',
      'individual.ssn_last_4': 'Last 4 digits of SSN',
      'business_profile.url': 'Business website',
      'business_profile.mcc': 'Business category',
      'tos_acceptance.date': 'Terms of service acceptance',
      'tos_acceptance.ip': 'Terms of service acceptance IP'
    };

    return formattedRequirements[requirement] || requirement;
  };

  // Handle connecting a Stripe account
  const handleConnectStripeAccount = async () => {
    if (!user || !user.uid) {
      toast({
        title: "Authentication Error",
        description: "User information not available. Please log out and log back in.",
        variant: "destructive"
      });
      return;
    }

    setConnectLoading(true);
    try {
      // Refresh the token before making the request
      const idToken = await auth.currentUser?.getIdToken(true);

      // Call the Express API endpoint to create a Connect account
      const response = await axios.post(
        `${API_BASE_URL}/create-connect-account`,
        { 
          userId: user.uid,
          email: user.email || '',
          origin: getFormattedOriginUrl()
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          }
        }
      );

      // Redirect to the Stripe Connect onboarding URL
      window.location.href = response.data.url;
    } catch (error) {
      console.error('Error creating Connect account:', error);
      
      // Provide more specific error messages
      let errorMessage = "Failed to set up payout account. Please try again.";
      
      if (error instanceof Error) {
        if (error.message.includes('authentication')) {
          errorMessage = "Authentication error. Please log out and log back in.";
        } else if (error.message.includes('network')) {
          errorMessage = "Network error. Please check your internet connection.";
        } else if (error.message.includes('subscription')) {
          errorMessage = "Active subscription required to set up payouts.";
        }
      }
      
      toast({
        title: "Setup Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setConnectLoading(false);
    }
  };

  // Handle viewing Stripe account dashboard
  const handleViewStripeAccount = async () => {
    if (!user || !user.uid) {
      toast({
        title: "Authentication Error",
        description: "User information not available. Please log out and log back in.",
        variant: "destructive"
      });
      return;
    }

    setConnectLoading(true);
    try {
      // Refresh the token before making the request
      const idToken = await auth.currentUser?.getIdToken(true);

      // Call the Express API endpoint to get a dashboard link
      const response = await axios.post(
        `${API_BASE_URL}/create-account-link`,
        { 
          userId: user.uid,
          origin: getFormattedOriginUrl()
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          }
        }
      );

      // Redirect to the Stripe dashboard
      window.location.href = response.data.url;
    } catch (error) {
      console.error('Error getting account dashboard:', error);
      
      toast({
        title: "Error",
        description: "Failed to access your payout account dashboard. Please try again.",
        variant: "destructive"
      });
    } finally {
      setConnectLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <>
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Subscription Status</h2>
            {status?.active ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="text-green-500" />
                  <span className="font-medium">Your subscription is active</span>
                </div>
                
                {/* Subscription details card */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-700">Plan:</span>
                    <span className="font-medium">Professional Stylist</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-700">Price:</span>
                    <span className="font-medium">$19.99/month</span>
                  </div>
                  {status.currentPeriodEnd && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Next billing date:</span>
                      <span className="font-medium">{new Date(status.currentPeriodEnd).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
                
                {status.cancelAtPeriodEnd ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-amber-600">
                      <AlertCircle />
                      <span>Your subscription will end on {status.currentPeriodEnd ? new Date(status.currentPeriodEnd).toLocaleDateString() : 'the current billing period'}</span>
                    </div>
                    <Button
                      onClick={handleReactivateSubscription}
                      disabled={reactivateLoading}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {reactivateLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <CreditCard className="h-4 w-4 mr-2" />
                      )}
                      Continue Subscription
                    </Button>
                  </div>
                ) : (
                  <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="text-red-500 border-red-200 hover:bg-red-50">
                        <XCircle className="h-4 w-4 mr-2" />
                        Cancel Subscription
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Cancel Subscription</DialogTitle>
                        <DialogDescription>
                          Are you sure you want to cancel your subscription? You'll still have access until the end of your current billing period.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="bg-amber-50 p-3 rounded-md border border-amber-200 text-amber-800 text-sm mb-4">
                        <p>Your subscription will remain active until {status.currentPeriodEnd ? new Date(status.currentPeriodEnd).toLocaleDateString() : 'the end of your current billing period'}.</p>
                      </div>
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
                <StripeConnect 
                  subscriptionActive={false} 
                  subscriptionPrice={19.99}
                  subscriptionInterval="month"
                />
              </div>
            )}
          </Card>
          
          {/* Only show Stripe Connect account section if subscription is active */}
          {status?.active && (
            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-4">Payout Account</h2>
              <div className="space-y-4">
                {status.stripeAccountStatus === 'active' ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle />
                      <span className="font-medium">Your payout account is active</span>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <h3 className="font-medium mb-2">Account Details</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Status:</span>
                          <span className="font-medium text-green-600">Ready to receive payments</span>
                        </div>
                        {status.details?.payoutsEnabled && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Payouts:</span>
                            <span className="font-medium text-green-600">Enabled</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={handleViewStripeAccount}
                      className="w-full"
                    >
                      <DollarSign className="h-4 w-4 mr-2" />
                      Manage Payout Settings
                    </Button>
                  </div>
                ) : status.stripeAccountStatus === 'pending' ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-amber-600">
                      <AlertCircle />
                      <span>Your payout account setup is incomplete</span>
                    </div>
                    {status.details?.requirementsPending && (
                      <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                        <h3 className="font-medium mb-2 text-amber-800">Required Information</h3>
                        <p className="text-sm text-amber-700 mb-2">
                          Please complete your account setup to receive payments from clients.
                        </p>
                        {status.details.requirementsCurrentlyDue && status.details.requirementsCurrentlyDue.length > 0 && (
                          <ul className="list-disc pl-5 text-sm text-amber-700 space-y-1">
                            {status.details.requirementsCurrentlyDue.map((req, index) => (
                              <li key={index}>{formatRequirement(req)}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                    <Button 
                      onClick={handleConnectStripeAccount}
                      disabled={connectLoading}
                      className="w-full"
                    >
                      {connectLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <DollarSign className="h-4 w-4 mr-2" />
                      )}
                      {status.stripeAccountStatus === 'not_created' 
                        ? 'Set Up Payout Account' 
                        : 'Complete Account Setup'}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-amber-600">
                      <AlertCircle />
                      <span>No payout account set up</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Set up a payout account to receive payments from clients directly to your bank account.
                    </p>
                    <Button 
                      onClick={handleConnectStripeAccount}
                      disabled={connectLoading}
                      className="w-full"
                    >
                      {connectLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <DollarSign className="h-4 w-4 mr-2" />
                      )}
                      Set Up Payout Account
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}




