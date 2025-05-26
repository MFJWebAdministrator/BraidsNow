import { httpsCallable } from 'firebase/functions';
import { doc, getDoc } from 'firebase/firestore';
import { loadStripe } from '@stripe/stripe-js';
import { auth, db, functions } from './firebase/config';

/**
 * Set up a subscription for the current user
 */
export async function setupSubscription(userId: string) {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    console.log('Setting up subscription for user:', userId);
    
    // Use Firebase Functions HTTP callable
    const createCheckoutSession = httpsCallable(functions, 'createCheckoutSession');
    const response = await createCheckoutSession({
      userId: userId,
      email: user.email || '',
      successUrl: `${window.location.origin}/dashboard/stylist/payments?success=true`,
      cancelUrl: `${window.location.origin}/dashboard/stylist/payments?canceled=true`
    });
    
    console.log('Checkout session created:', response.data);
    const { sessionId } = response.data as { sessionId: string };
    
    // Load Stripe
    const stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
    
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
export async function createConnectAccount(userId: string) {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    console.log('Creating Connect account for user:', userId);
    
    // Use Firebase Functions HTTP callable
    const createConnectAccountFn = httpsCallable(functions, 'createConnectAccount');
    const response = await createConnectAccountFn({
      userId: userId,
      email: user.email || '',
      origin: window.location.origin
    });
    
    console.log('Connect account created:', response.data);
    const { url } = response.data as { url: string };
    window.location.href = url;
    return url;
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
    if (!userId) {
      console.error('User ID is required');
      throw new Error('User ID is required');
    }
    
    console.log('Checking subscription status for user:', userId);
    
    // First try to get data from Firestore for better performance
    const stylistRef = doc(db, 'stylists', userId);
    const stylistDoc = await getDoc(stylistRef);
    
    if (stylistDoc.exists()) {
      const data = stylistDoc.data();
      const subscription = data.subscription;
      
      if (subscription) {
        return {
          active: subscription.status === 'active',
          currentPeriodEnd: subscription.currentPeriodEnd?.toDate?.() 
            ? subscription.currentPeriodEnd.toDate().toISOString() 
            : subscription.currentPeriodEnd,
          stripeAccountStatus: data.stripeAccountStatus || 'not_created',
        };
      }
      
      if (data.stripeAccountStatus) {
        return {
          active: false,
          stripeAccountStatus: data.stripeAccountStatus
        };
      }
    }
    
    // If we couldn't determine status from Firestore, use the Firebase Function
    console.log('Calling checkAccountStatus function with userId:', userId);
    const checkAccountStatusFn = httpsCallable(functions, 'checkAccountStatus');
    const response = await checkAccountStatusFn({ userId });
    
    console.log('Subscription status response from function:', response.data);
    const data = response.data as any;
    
    return {
      active: data.subscription?.status === 'active',
      currentPeriodEnd: data.subscription?.currentPeriodEnd,
      stripeAccountStatus: data.status
    };
  } catch (error) {
    console.error('Error checking subscription status:', error);
    // Return a default status object instead of throwing
    return { active: false };
  }
}

/**
 * Load Stripe.js dynamically
 */
// async function loadStripeX() {
//   if (!window.Stripe) {
//     const script = document.createElement('script');
//     script.src = 'https://js.stripe.com/v3/';
//     script.async = true;
//     document.body.appendChild(script);
    
//     await new Promise((resolve) => {
//       script.onload = resolve;
//     });
//   }
  
//   return window.Stripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
// }

// Add Stripe to the Window interface
declare global {
  interface Window {
    Stripe?: any;
  }
}