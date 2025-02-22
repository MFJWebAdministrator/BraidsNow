import { loadStripe } from '@stripe/stripe-js';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase/config';

// Initialize Stripe with your publishable key
export const stripe = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// Product ID for stylist subscription
const SUBSCRIPTION_PRODUCT_ID = 'prod_Rj9onIzGhaeuYk';

// Function to create a Stripe Connect account
export async function createConnectAccount() {
  try {
    // Redirect to your backend endpoint that handles Stripe Connect
    const response = await fetch('/api/stripe/create-connect-account', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to create Connect account');
    }

    const { url } = await response.json();
    window.location.href = url;
  } catch (error) {
    console.error('Error creating Connect account:', error);
    throw error;
  }
}

// Function to set up subscription
export async function setupSubscription() {
  try {
    // Redirect to your backend endpoint that creates Stripe Checkout session
    const response = await fetch('/api/stripe/create-subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        priceId: SUBSCRIPTION_PRODUCT_ID,
        successUrl: `${window.location.origin}/dashboard/stylist/payments`,
        cancelUrl: `${window.location.origin}/dashboard/stylist/payments`
      })
    });

    if (!response.ok) {
      throw new Error('Failed to set up subscription');
    }

    const { sessionId } = await response.json();
    
    // Redirect to Stripe Checkout
    const stripeInstance = await stripe;
    if (!stripeInstance) {
      throw new Error('Stripe not initialized');
    }
    
    const { error } = await stripeInstance.redirectToCheckout({
      sessionId
    });

    if (error) {
      throw error;
    }

    return sessionId;
  } catch (error) {
    console.error('Error setting up subscription:', error);
    throw error;
  }
}

// Function to check subscription status
export async function checkSubscriptionStatus(userId: string) {
  try {
    // Check subscription status in Firestore
    const stylistRef = doc(db, 'stylists', userId);
    const stylistDoc = await getDoc(stylistRef);

    if (!stylistDoc.exists()) {
      return { active: false };
    }

    const data = stylistDoc.data();
    const subscription = data.subscription;

    if (!subscription) {
      return { active: false };
    }

    // Check if subscription is active
    if (subscription.status === 'active' && subscription.currentPeriodEnd) {
      const periodEndDate = new Date(subscription.currentPeriodEnd);
      if (periodEndDate > new Date()) {
        return {
          active: true,
          currentPeriodEnd: subscription.currentPeriodEnd,
        };
      }
    }

    return { active: false };
  } catch (error) {
    console.error('Error checking subscription status:', error);
    throw error;
  }
}