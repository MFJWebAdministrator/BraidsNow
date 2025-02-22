import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe with your publishable key
export const stripe = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// Function to create a payment intent
export async function createPaymentIntent(amount: number) {
  try {
    const response = await fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amount }),
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
}

// Function to handle payment completion
export async function handlePaymentCompletion(paymentIntentId: string) {
  try {
    const response = await fetch('/api/confirm-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ paymentIntentId }),
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    return await response.json();
  } catch (error) {
    console.error('Error confirming payment:', error);
    throw error;
  }
}