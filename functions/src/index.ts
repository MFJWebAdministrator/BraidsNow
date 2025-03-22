// @ts-nocheck
// Load environment variables from .env file
import * as dotenv from 'dotenv';
dotenv.config();

import cors from 'cors';
import express, { Request, Response } from 'express';
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import Stripe from 'stripe';

const app = express();

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// Initialize Stripe with your secret key
// @ts-ignore
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2022-11-15',
});

// Access environment variables
const priceId = process.env.STRIPE_PRICE_ID;
const productId = process.env.STRIPE_PRODUCT_ID||"prod_Rz6nxFBV3u49lT";
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_uD5UVYJitxHFVXEpFRd7lMT66zOCnqiX';

// Function to ensure a valid price ID exists
async function ensureValidPriceId() {
  try {
    // First try to use the environment variable price ID
    if (priceId) {
      try {
        // Verify the price exists and is recurring
        const price = await stripe.prices.retrieve(priceId);
        if (price && price.recurring) {
          console.log('Using existing price ID from environment:', priceId);
          return priceId;
        }
      } catch (error) {
        console.log('Price ID from environment not found or not valid:', error);
      }
    }
    
    // If we get here, we need to find or create a valid price
    // First, try to list existing recurring prices
    const prices = await stripe.prices.list({
      active: true,
      type: 'recurring',
      limit: 1
    });
    
    if (prices.data.length > 0) {
      console.log('Using existing recurring price:', prices.data[0].id);
      return prices.data[0].id;
    }
    
    // If no existing prices, create a new product and price
    let productToUse = productId;
    
    if (!productToUse) {
      // Create a new product if none exists
      const product = await stripe.products.create({
        name: 'BraidsNow Professional Subscription',
        description: 'Monthly subscription for professional stylists',
      });
      productToUse = product.id;
      console.log('Created new product:', productToUse);
    }
    
    // Create a new recurring price
    const newPrice = await stripe.prices.create({
      product: productToUse,
      unit_amount: 1999, // $19.99
      currency: 'usd',
      recurring: {
        interval: 'month',
      },
      metadata: {
        auto_created: 'true',
      },
    });
    
    console.log('Created new recurring price:', newPrice.id);
    return newPrice.id;
  } catch (error) {
    console.error('Error ensuring valid price ID:', error);
    // Fallback to a hardcoded price ID as last resort
    return 'price_1R58ZdJLOzBZfrz5ZZuxBFZ3';
  }
}

// Cache the valid price ID
let validPriceIdPromise: Promise<string> | null = null;

// Middleware
app.use(cors({ origin: true }));
app.use(express.json());

interface RequestWithRawBody extends Request {
  rawBody?: Buffer;
  user?: admin.auth.DecodedIdToken;
}

interface CheckoutSessionRequest {
  userId: string;
  email: string;
  successUrl?: string;
  cancelUrl?: string;
}

// Add middleware to verify Firebase Auth token
const validateFirebaseIdToken = async (req: RequestWithRawBody, res: Response, next: Function) => {
  console.log('Check if request is authorized with Firebase ID token');

  if ((!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) &&
      !(req.cookies && req.cookies.__session)) {
    console.error('No Firebase ID token was passed as a Bearer token in the Authorization header.',
        'Make sure you authorize your request by providing the following HTTP header:',
        'Authorization: Bearer <Firebase ID Token>',
        'or by passing a "__session" cookie.');
    res.status(403).send('Unauthorized');
    return;
  }

  let idToken;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    console.log('Found "Authorization" header');
    // Read the ID Token from the Authorization header.
    idToken = req.headers.authorization.split('Bearer ')[1];
  } else if(req.cookies) {
    console.log('Found "__session" cookie');
    // Read the ID Token from cookie.
    idToken = req.cookies.__session;
  } else {
    // No cookie
    res.status(403).send('Unauthorized');
    return;
  }

  try {
    const decodedIdToken = await admin.auth().verifyIdToken(idToken);
    console.log('ID Token correctly decoded', decodedIdToken);
    req.user = decodedIdToken;
    next();
    return;
  } catch (error) {
    console.error('Error while verifying Firebase ID token:', error);
    res.status(403).send('Unauthorized');
    return;
  }
};

// Create checkout session for subscription (Express endpoint)
app.post(
  '/create-checkout-session',
  validateFirebaseIdToken,
  async (
    req: RequestWithRawBody & { body: CheckoutSessionRequest },
    res: Response
  ) => {
    try {
      const { userId, email, successUrl, cancelUrl } = req.body;

      if (!userId || !email) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      // Verify that the authenticated user is requesting their own data
      if (userId !== req.user?.uid) {
        return res.status(403).json({ error: 'Unauthorized access to user data' });
      }

      // Ensure we have a valid price ID
      if (!validPriceIdPromise) {
        validPriceIdPromise = ensureValidPriceId();
      }
      const subscriptionPriceId = await validPriceIdPromise;
      console.log('Using subscription price ID:', subscriptionPriceId);

      // Check if user already exists in Stripe
      const stylistRef = db.collection('stylists').doc(userId);
      const stylistDoc = await stylistRef.get();
      const stylistData = stylistDoc.data();

      let stripeCustomerId: string;

      if (!stylistDoc.exists || !stylistData?.stripeCustomerId) {
        // Create a new customer in Stripe
        const customer = await stripe.customers.create({
          email,
          metadata: { userId },
        });

        // Update or create the stylist document
        await stylistRef.set(
          {
            email,
            stripeCustomerId: customer.id,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );

        stripeCustomerId = customer.id;
      } else {
        stripeCustomerId = stylistData.stripeCustomerId as string;
      }

      // Create checkout session with proper error handling
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'subscription',
        customer: stripeCustomerId,
        line_items: [{ price: subscriptionPriceId, quantity: 1 }],
        success_url:
          successUrl ||
          `${req.headers.origin}/dashboard/stylist/payments?success=true`,
        cancel_url:
          cancelUrl ||
          `${req.headers.origin}/dashboard/stylist/payments?canceled=true`,
        metadata: { userId },
        allow_promotion_codes: true,
        billing_address_collection: 'required',
      });

      return res.status(200).json({ sessionId: session.id });
    } catch (error) {
      console.error('Error creating checkout session:', error);
      return res.status(500).json({
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  }
);

interface ConnectAccountRequest {
  userId: string;
  email: string;
  origin: string;
}

// Create Connect account (Express endpoint)
app.post(
  '/create-connect-account',
  validateFirebaseIdToken,
  async (
    req: RequestWithRawBody & { body: ConnectAccountRequest },
    res: Response
  ) => {
    try {
      const { userId, email, origin } = req.body;

      if (!userId || !email || !origin) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      // Verify that the authenticated user is requesting their own data
      if (userId !== req.user?.uid) {
        return res.status(403).json({ error: 'Unauthorized access to user data' });
      }

      // Get the stylist document
      const stylistRef = db.collection('stylists').doc(userId);
      const stylistDoc = await stylistRef.get();

      if (!stylistDoc.exists) {
        return res.status(404).json({ error: 'Stylist not found' });
      }

      // Check if subscription is active
      const stylistData = stylistDoc.data();
      if (
        !stylistData?.subscription ||
        stylistData.subscription.status !== 'active'
      ) {
        return res.status(400).json({
          error: 'Active subscription required to create Connect account',
        });
      }

      // Create a Connect account if not already created
      let accountId = stylistData.stripeAccountId as string | undefined;

      if (!accountId) {
        const account = await stripe.accounts.create({
          type: 'express',
          email,
          metadata: { userId },
          capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
          },
          business_type: 'individual',
          business_profile: {
            mcc: '7230', // Beauty and barber shops
            url: origin,
          },
        });

        accountId = account.id;

        // Update the stylist document
        await stylistRef.update({
          stripeAccountId: accountId,
          stripeAccountStatus: 'pending',
          stripeAccountCreatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      // Create account link for onboarding
      const accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: `${origin}/dashboard/stylist/payments?refresh=true`,
        return_url: `${origin}/dashboard/stylist/payments?success=true`,
        type: 'account_onboarding',
      });

      return { url: accountLink.url };
    } catch (error) {
      console.error('Error creating Connect account:', error);
      throw new functions.https.HttpsError(
        'internal',
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
    }
  }
);

export const checkAccountStatus = functions.https.onCall(
  async (data: { userId: string }) => {
    try {
      // Modify logging to avoid circular references
      console.log('Checking account status with data:', {
        userId: data?.userId
      });
      
      // Validate the data object exists
      if (!data) {
        console.error('No data provided to checkAccountStatus');
        throw new functions.https.HttpsError(
          'invalid-argument',
          'No data provided'
        );
      }
      
      const { userId } = data;
      console.log('Checking account status for user:', userId);
      
      if (!userId) {
        console.error('Missing userId in checkAccountStatus');
        throw new functions.https.HttpsError(
          'invalid-argument',
          'User ID is required'
        );
      }

      const stylistDoc = await db.collection('stylists').doc(userId).get();
      if (!stylistDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Stylist not found');
      }

      const stylistData = stylistDoc.data();

      if (!stylistData?.stripeAccountId) {
        return {
          status: 'not_created',
          subscription: stylistData?.subscription || null,
        };
      }

      // Get the latest account details from Stripe
      const account = await stripe.accounts.retrieve(
        stylistData.stripeAccountId as string
      );

      // Update the account status in Firestore
      const accountStatus = account.charges_enabled ? 'active' : 'pending';

      if (accountStatus !== stylistData.stripeAccountStatus) {
        await stylistDoc.ref.update({
          stripeAccountStatus: accountStatus,
          stripeAccountUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      return {
        status: accountStatus,
        subscription: stylistData.subscription || null,
        details: {
          chargesEnabled: account.charges_enabled,
          payoutsEnabled: account.payouts_enabled,
          requirementsPending:
            account.requirements?.pending_verification?.length > 0 || false,
          requirementsCurrentlyDue: account.requirements?.currently_due || [],
        },
      };
    } catch (error) {
      console.error('Error checking account status:', error);
      throw new functions.https.HttpsError(
        'internal',
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
    }
  }
);

// Update check-account-status endpoint
app.post(
  '/check-account-status',
  validateFirebaseIdToken,
  async (req: RequestWithRawBody & { body: any, user?: admin.auth.DecodedIdToken }, res: Response) => {
    try {
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      // Verify that the authenticated user is requesting their own data
      if (userId !== req.user?.uid) {
        return res.status(403).json({ error: 'Unauthorized access to user data' });
      }

      const stylistDoc = await db.collection('stylists').doc(userId).get();
      if (!stylistDoc.exists) {
        return res.status(404).json({ error: 'Stylist not found' });
      }

      const stylistData = stylistDoc.data();

      if (!stylistData?.stripeAccountId) {
        return res.json({
          status: 'not_created',
          subscription: stylistData?.subscription || null,
        });
      }

      // Get the latest account details from Stripe
      const account = await stripe.accounts.retrieve(
        stylistData.stripeAccountId as string
      );

      // Update the account status in Firestore
      const accountStatus = account.charges_enabled ? 'active' : 'pending';

      if (accountStatus !== stylistData.stripeAccountStatus) {
        await stylistDoc.ref.update({
          stripeAccountStatus: accountStatus,
          stripeAccountUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      return res.json({
        status: accountStatus,
        subscription: stylistData.subscription || null,
        details: {
          chargesEnabled: account.charges_enabled,
          payoutsEnabled: account.payouts_enabled,
          requirementsPending:
            account.requirements?.pending_verification?.length > 0 || false,
          requirementsCurrentlyDue: account.requirements?.currently_due || [],
        },
      });
    } catch (error) {
      console.error('Error checking account status:', error);
      return res.status(500).json({
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  }
);

// Update create-checkout-session endpoint
app.post(
  '/create-checkout-session',
  validateFirebaseIdToken,
  async (
    req: RequestWithRawBody & { body: CheckoutSessionRequest, user?: admin.auth.DecodedIdToken },
    res: Response
  ) => {
    try {
      const { userId, email, successUrl, cancelUrl } = req.body;

      if (!userId || !email) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      // Verify that the authenticated user is requesting their own data
      if (userId !== req.user?.uid) {
        return res.status(403).json({ error: 'Unauthorized access to user data' });
      }

      // Use environment variable or fallback to a default price ID
      const subscriptionPriceId = priceId || 'price_1R58ZdJLOzBZfrz5ZZuxBFZ3';

      // Check if user already exists in Stripe
      const stylistRef = db.collection('stylists').doc(userId);
      const stylistDoc = await stylistRef.get();
      const stylistData = stylistDoc.data();

      let stripeCustomerId: string;

      if (!stylistDoc.exists || !stylistData?.stripeCustomerId) {
        // Create a new customer in Stripe
        const customer = await stripe.customers.create({
          email,
          metadata: { userId },
        });

        // Update or create the stylist document
        await stylistRef.set(
          {
            email,
            stripeCustomerId: customer.id,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );

        stripeCustomerId = customer.id;
      } else {
        stripeCustomerId = stylistData.stripeCustomerId as string;
      }

      // Create checkout session with proper error handling
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'subscription',
        customer: stripeCustomerId,
        line_items: [{ price: subscriptionPriceId, quantity: 1 }],
        success_url:
          successUrl ||
          `${req.headers.origin}/dashboard/stylist/payments?success=true`,
        cancel_url:
          cancelUrl ||
          `${req.headers.origin}/dashboard/stylist/payments?canceled=true`,
        metadata: { userId },
        allow_promotion_codes: true,
        billing_address_collection: 'required',
      });

      return res.status(200).json({ sessionId: session.id });
    } catch (error) {
      console.error('Error creating checkout session:', error);
      return res.status(500).json({
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  }
);

// Update create-connect-account endpoint
app.post(
  '/create-connect-account',
  validateFirebaseIdToken,
  async (
    req: RequestWithRawBody & { body: ConnectAccountRequest, user?: admin.auth.DecodedIdToken },
    res: Response
  ) => {
    try {
      const { userId, email, origin } = req.body;

      if (!userId || !email || !origin) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      // Verify that the authenticated user is requesting their own data
      if (userId !== req.user?.uid) {
        return res.status(403).json({ error: 'Unauthorized access to user data' });
      }

      // Get the stylist document
      const stylistRef = db.collection('stylists').doc(userId);
      const stylistDoc = await stylistRef.get();

      if (!stylistDoc.exists) {
        return res.status(404).json({ error: 'Stylist not found' });
      }

      // Check if subscription is active
      const stylistData = stylistDoc.data();
      if (
        !stylistData?.subscription ||
        stylistData.subscription.status !== 'active'
      ) {
        return res.status(400).json({
          error: 'Active subscription required to create Connect account',
        });
      }

      // Create a Connect account if not already created
      let accountId = stylistData.stripeAccountId as string | undefined;

      if (!accountId) {
        const account = await stripe.accounts.create({
          type: 'express',
          email,
          metadata: { userId },
          capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
          },
          business_type: 'individual',
          business_profile: {
            mcc: '7230', // Beauty and barber shops
            url: origin,
          },
        });

        accountId = account.id;

        // Update the stylist document
        await stylistRef.update({
          stripeAccountId: accountId,
          stripeAccountStatus: 'pending',
          stripeAccountCreatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      // Create account link for onboarding
      const accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: `${origin}/dashboard/stylist/payments?refresh=true`,
        return_url: `${origin}/dashboard/stylist/payments?success=true`,
        type: 'account_onboarding',
      });

      return res.status(200).json({ url: accountLink.url });
    } catch (error) {
      console.error('Error creating Connect account:', error);
      return res.status(500).json({
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  }
);

// Webhook handler for Stripe events
app.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  async (req: RequestWithRawBody, res: Response) => {
    const sig = req.headers['stripe-signature'];
    let event: Stripe.Event;

    try {
      if (!sig || !req.rawBody) {
        throw new Error('Missing signature or raw body');
      }
      
      event = stripe.webhooks.constructEvent(
        req.rawBody,
        sig as string,
        webhookSecret
      );
      
      console.log('Webhook received:', event.type);
    } catch (err) {
      const error = err as Error;
      console.error(`Webhook signature verification failed: ${error.message}`);
      return res.status(400).send(`Webhook Error: ${error.message}`);
    }

    // Handle the event
    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          const userId = session.metadata?.userId;
          const subscriptionId = session.subscription as string;

          console.log(`Checkout session completed for user ${userId}, subscription ${subscriptionId}`);

          if (userId && subscriptionId) {
            // Get subscription details
            const subscription = await stripe.subscriptions.retrieve(
              subscriptionId
            );

            // Update the stylist document with subscription details
            await db
              .collection('stylists')
              .doc(userId)
              .update({
                subscription: {
                  id: subscription.id,
                  status: subscription.status,
                  currentPeriodStart: admin.firestore.Timestamp.fromMillis(
                    subscription.current_period_start * 1000
                  ),
                  currentPeriodEnd: admin.firestore.Timestamp.fromMillis(
                    subscription.current_period_end * 1000
                  ),
                  priceId: subscription.items.data[0].price.id,
                  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                },
              });
              
            console.log(`Updated subscription status for user ${userId} to ${subscription.status}`);
          }
          break;
        }
        
        case 'invoice.payment_succeeded': {
          const invoice = event.data.object as Stripe.Invoice;
          const subscriptionId = invoice.subscription as string;
          const customerId = invoice.customer as string;
          
          console.log(`Invoice payment succeeded for subscription ${subscriptionId}`);
          
          if (subscriptionId && customerId) {
            // Find the user with this customer ID
            const stylistQuery = await db
              .collection('stylists')
              .where('stripeCustomerId', '==', customerId)
              .get();
              
            if (!stylistQuery.empty) {
              const stylistDoc = stylistQuery.docs[0];
              const subscription = await stripe.subscriptions.retrieve(subscriptionId);
              
              await stylistDoc.ref.update({
                subscription: {
                  id: subscription.id,
                  status: subscription.status,
                  currentPeriodStart: admin.firestore.Timestamp.fromMillis(
                    subscription.current_period_start * 1000
                  ),
                  currentPeriodEnd: admin.firestore.Timestamp.fromMillis(
                    subscription.current_period_end * 1000
                  ),
                  priceId: subscription.items.data[0].price.id,
                  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                },
              });
              
              console.log(`Updated subscription for user ${stylistDoc.id} after successful payment`);
            }
          }
          break;
        }
        
        case 'invoice.payment_failed': {
          const invoice = event.data.object as Stripe.Invoice;
          const subscriptionId = invoice.subscription as string;
          const customerId = invoice.customer as string;
          
          console.log(`Invoice payment failed for subscription ${subscriptionId}`);
          
          if (subscriptionId && customerId) {
            // Find the user with this customer ID
            const stylistQuery = await db
              .collection('stylists')
              .where('stripeCustomerId', '==', customerId)
              .get();
              
            if (!stylistQuery.empty) {
              const stylistDoc = stylistQuery.docs[0];
              const subscription = await stripe.subscriptions.retrieve(subscriptionId);
              
              await stylistDoc.ref.update({
                subscription: {
                  id: subscription.id,
                  status: subscription.status, // Will be 'past_due' or 'unpaid'
                  currentPeriodStart: admin.firestore.Timestamp.fromMillis(
                    subscription.current_period_start * 1000
                  ),
                  currentPeriodEnd: admin.firestore.Timestamp.fromMillis(
                    subscription.current_period_end * 1000
                  ),
                  priceId: subscription.items.data[0].price.id,
                  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                  lastPaymentError: invoice.last_payment_error?.message || 'Payment failed',
                },
              });
              
              console.log(`Updated subscription for user ${stylistDoc.id} after failed payment`);
            }
          }
          break;
        }

        case 'customer.subscription.updated':
        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;
          console.log(`Subscription ${subscription.id} ${event.type === 'customer.subscription.updated' ? 'updated' : 'deleted'} to status: ${subscription.status}`);

          // Find the user with this subscription
          const subscriptionQuery = await db
            .collection('stylists')
            .where('subscription.id', '==', subscription.id)
            .get();

          if (!subscriptionQuery.empty) {
            const stylistDoc = subscriptionQuery.docs[0];

            await stylistDoc.ref.update({
              subscription: {
                id: subscription.id,
                status: subscription.status,
                currentPeriodStart: admin.firestore.Timestamp.fromMillis(
                  subscription.current_period_start * 1000
                ),
                currentPeriodEnd: admin.firestore.Timestamp.fromMillis(
                  subscription.current_period_end * 1000
                ),
                priceId: subscription.items.data[0].price.id,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              },
            });
            
            console.log(`Updated subscription status for user ${stylistDoc.id} to ${subscription.status}`);
          } else {
            console.log(`No stylist found with subscription ID ${subscription.id}`);
          }
          break;
        }

        case 'account.updated': {
          const account = event.data.object as Stripe.Account;
          const accountUserId = account.metadata?.userId;
          
          console.log(`Stripe Connect account updated for user ${accountUserId}`);

          if (accountUserId) {
            const accountStatus = account.charges_enabled
              ? 'active'
              : 'pending';

            await db.collection('stylists').doc(accountUserId).update({
              stripeAccountStatus: accountStatus,
              stripeAccountUpdatedAt:
                admin.firestore.FieldValue.serverTimestamp(),
            });
            
            console.log(`Updated Connect account status for user ${accountUserId} to ${accountStatus}`);
          }
          break;
        }
      }

      res.json({ received: true });
    } catch (error) {
      console.error(
        `Error processing webhook: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
      return res
        .status(500)
        .send(
          `Webhook processing error: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        );
    }
  }
);

// Export the Express app as a Firebase Function
export const api = functions.https.onRequest(app);

// Create callable functions for client-side integration
export const createCheckoutSession = functions.https.onCall(
  async (data: CheckoutSessionRequest) => {
    try {
      // Modify logging to avoid circular references
      console.log('Creating checkout session with data:', {
        userId: data?.userId,
        email: data?.email,
        successUrl: data?.successUrl,
        cancelUrl: data?.cancelUrl
      });
      
      // Validate the data object exists
      if (!data) {
        console.error('No data provided to createCheckoutSession');
        throw new functions.https.HttpsError(
          'invalid-argument',
          'No data provided'
        );
      }
      
      const { userId, email, successUrl, cancelUrl } = data;

      if (!userId) {
        console.error('Missing userId in createCheckoutSession');
        throw new functions.https.HttpsError(
          'invalid-argument',
          'User ID is required'
        );
      }
      
      if (!email) {
        console.error('Missing email in createCheckoutSession');
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Email is required'
        );
      }

      // ... rest of the function remains the same ...
      } catch (error) {
        console.error('Error creating checkout session:', error);
        throw new functions.https.HttpsError(
          'internal',
          error instanceof Error ? error.message : 'Unknown error occurred'
        );
      }
    }
  );