import { getAuth } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';

// Use environment variables for API URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/braidsnow/us-central1/api';

// Initialize Firebase Functions
const functions = getFunctions();

/**
 * Set up a subscription for the current user
 */
export async function setupSubscription() {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    // Use Firebase Functions HTTP callable
    const createCheckoutSession = httpsCallable(functions, 'createCheckoutSession');
    const response = await createCheckoutSession({
      userId: user.uid,
      email: user.email,
      successUrl: `${window.location.origin}/dashboard/stylist/payments?success=true`,
      cancelUrl: `${window.location.origin}/dashboard/stylist/payments?canceled=true`
    });
    
    const { sessionId } = response.data as { sessionId: string };
    
    // Load Stripe.js dynamically
    const stripe = await loadStripe();
    
    if (!stripe) {
      throw new Error('Failed to load Stripe');
    }
    
    // Redirect to Checkout
    const result = await stripe.redirectToCheckout({
      sessionId
    });
    
    if (result.error) {
      throw new Error(result.error.message || 'Failed to redirect to checkout');
    }
    
    return sessionId;
  } catch (error) {
    console.error('Error setting up subscription:', error);
    throw error;
  }
}

/**
 * Create a Stripe Connect account for the current user
 */
export async function createConnectAccount() {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    // Use Firebase Functions HTTP callable
    const createConnectAccountFn = httpsCallable(functions, 'createConnectAccount');
    const response = await createConnectAccountFn({
      userId: user.uid,
      email: user.email,
      origin: window.location.origin
    });
    
    const { url } = response.data as { url: string };
    window.location.href = url;
  } catch (error) {
    console.error('Error creating Connect account:', error);
    throw error;
  }
}

/**
 * Check the subscription status for the current user
 */
export async function checkSubscriptionStatus(userId: string) {
  try {
    // Use Firebase Functions HTTP callable
    const checkAccountStatus = httpsCallable(functions, 'checkAccountStatus');
    const response = await checkAccountStatus({ userId });
    
    const data = response.data as any;
    
    return {
      active: data.subscription?.status === 'active',
      currentPeriodEnd: data.subscription?.currentPeriodEnd,
      stripeAccountStatus: data.status
    };
  } catch (error) {
    console.error('Error checking subscription status:', error);
    return { active: false };
  }
}

/**
 * Load Stripe.js dynamically
 */
async function loadStripe() {
  if (!window.Stripe) {
    const script = document.createElement('script');
    script.src = 'https://js.stripe.com/v3/';
    script.async = true;
    document.body.appendChild(script);
    
    await new Promise((resolve) => {
      script.onload = resolve;
    });
  }
  
  return window.Stripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
}

// Add Stripe to the Window interface
declare global {
  interface Window {
    Stripe?: any;
  }
}