import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
});

// Initialize Firebase Admin
admin.initializeApp();

// Create Connect Account
export const createConnectAccount = functions.https.onRequest(async (req, res) => {
  try {
    const { userId } = req.body;

    // Create a Stripe Connect account
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'US',
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });

    // Store the account ID in Firestore
    await admin.firestore()
      .collection('stylists')
      .doc(userId)
      .update({
        stripeAccountId: account.id
      });

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${req.headers.origin}/dashboard/stylist/payments`,
      return_url: `${req.headers.origin}/dashboard/stylist/payments`,
      type: 'account_onboarding',
    });

    res.json({ url: accountLink.url });
  } catch (error) {
    console.error('Error creating Connect account:', error);
    res.status(500).json({ error: 'Failed to create Connect account' });
  }
});

// Create Subscription
export const createSubscription = functions.https.onRequest(async (req, res) => {
  try {
    const { userId, priceId, successUrl, cancelUrl } = req.body;

    // Get user data
    const userDoc = await admin.firestore()
      .collection('stylists')
      .doc(userId)
      .get();

    if (!userDoc.exists) {
      throw new Error('Stylist not found');
    }

    // Create Stripe customer if not exists
    let customerId = userDoc.data()?.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userDoc.data()?.email,
        metadata: {
          firebaseUID: userId
        }
      });
      customerId = customer.id;

      // Save customer ID
      await userDoc.ref.update({ stripeCustomerId: customerId });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    res.json({ sessionId: session.id });
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({ error: 'Failed to create subscription' });
  }
});

// Handle Stripe Webhooks
export const handleStripeWebhook = functions.https.onRequest(async (req, res) => {
  const sig = req.headers['stripe-signature']!;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  try {
    const event = stripe.webhooks.constructEvent(
      req.rawBody,
      sig,
      webhookSecret
    );

    // Handle subscription events
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        
        // Get Firebase user ID from customer metadata
        const customer = await stripe.customers.retrieve(customerId);
        const userId = customer.metadata.firebaseUID;

        // Update subscription status in Firestore
        await admin.firestore()
          .collection('stylists')
          .doc(userId)
          .update({
            subscription: {
              status: subscription.status,
              currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString()
            }
          });
        break;

      case 'account.updated':
        const account = event.data.object as Stripe.Account;
        // Update Connect account status
        const stylistQuery = await admin.firestore()
          .collection('stylists')
          .where('stripeAccountId', '==', account.id)
          .get();
        
        if (!stylistQuery.empty) {
          await stylistQuery.docs[0].ref.update({
            stripeAccountStatus: account.charges_enabled ? 'active' : 'pending'
          });
        }
        break;
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
});