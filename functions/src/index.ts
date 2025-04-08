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
const productId = process.env.STRIPE_PRODUCT_ID || "prod_Rz6nxFBV3u49lT";
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
const validPriceIdPromise: Promise<string> | null = null;

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
  } else if (req.cookies) {
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


interface ConnectAccountRequest {
  userId: string;
  email: string;
  origin: string;
}


// Cancel subscription endpoint
app.post(
  '/cancel-subscription',
  validateFirebaseIdToken,
  async (
    req: RequestWithRawBody & { body: { userId: string }, user?: admin.auth.DecodedIdToken },
    res: Response
  ) => {
    try {
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      // Verify that the authenticated user is requesting their own data
      if (userId !== req.user?.uid) {
        return res.status(403).json({ error: 'Unauthorized access to user data' });
      }

      // Get the stylist document to find subscription ID
      const stylistRef = db.collection('stylists').doc(userId);
      const stylistDoc = await stylistRef.get();

      if (!stylistDoc.exists) {
        return res.status(404).json({ error: 'Stylist not found' });
      }

      const stylistData = stylistDoc.data();

      if (!stylistData?.subscription?.id) {
        return res.status(400).json({ error: 'No active subscription found' });
      }

      // Cancel the subscription at period end
      const subscription = await stripe.subscriptions.update(
        stylistData.subscription.id,
        { cancel_at_period_end: true }
      );

      // Update the stylist document with cancellation info
      await stylistRef.update({
        'subscription.cancelAtPeriodEnd': true,
        'subscription.canceledAt': admin.firestore.FieldValue.serverTimestamp(),
        'subscription.status': subscription.status,
        'subscription.updatedAt': admin.firestore.FieldValue.serverTimestamp(),
      });

      return res.status(200).json({
        success: true,
        message: 'Subscription will be canceled at the end of the billing period',
        subscription: {
          id: subscription.id,
          status: subscription.status,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString()
        }
      });
    } catch (error) {
      console.error('Error canceling subscription:', error);
      return res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error occurred',
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
      const subscriptionPriceId =await ensureValidPriceId()

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

      if (!userId || !email) {
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
          },
        });

        // Store the account ID in Firestore
        await stylistRef.update({
          stripeAccountId: account.id,
          stripeAccountStatus: 'pending',
          stripeAccountCreatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        accountId = account.id;
      }

      // Validate and sanitize the origin URL
      let validatedOrigin = origin;
      if (!validatedOrigin) {
        // Default to a fallback URL if none provided
        validatedOrigin = 'https://braidsnow.com';
      }
      
      // Ensure the origin is a valid URL
      try {
        new URL(validatedOrigin);
      } catch (error) {
        console.warn('Invalid origin URL provided:', validatedOrigin);
        // Use a fallback URL instead of failing
        validatedOrigin = 'https://braidsnow.com';
      }

      // Create an account link for onboarding
      const accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: `${validatedOrigin}/dashboard/stylist/payments?refresh=true`,
        return_url: `${validatedOrigin}/dashboard/stylist/payments?success=true`,
        type: 'account_onboarding',
      });

      return res.status(200).json({ url: accountLink.url });
    } catch (error) {
      console.error('Error creating Connect account:', error);
      return res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  }
);


interface PaymentToStylistRequest {
  userId: string;
  stylistId: string;
  amount: number;
  serviceDescription: string;
  successUrl?: string;
  cancelUrl?: string;
}

// Helper function to update stylist balance
async function updateStylistBalance(
  stylistId: string,
  amountInCents: number,
  description: string = 'Payment received'
) {
  try {
    const stylistRef = db.collection('stylists').doc(stylistId);
    let newBalance = 0;

    await db.runTransaction(async (transaction) => {
      const stylistDoc = await transaction.get(stylistRef);

      if (stylistDoc.exists) {
        const stylistData = stylistDoc.data();
        // Convert current balance to cents for calculation
        const currentBalanceInCents = (stylistData?.balance || 0) * 100;
        
        // Calculate new balance in cents
        const newBalanceInCents = currentBalanceInCents + amountInCents;

        // Prevent negative balance for withdrawals
        if (amountInCents < 0 && newBalanceInCents < 0) {
          throw new Error('Insufficient balance for withdrawal');
        }

        // Convert back to dollars for storage
        newBalance = newBalanceInCents / 100;

        const updateData: any = {
          balance: newBalance,
          balanceUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        if (!stylistData?.balanceCreatedAt) {
          updateData.balanceCreatedAt = admin.firestore.FieldValue.serverTimestamp();
        }

        transaction.update(stylistRef, updateData);

        console.log(`Updated balance for stylist ${stylistId}: ${currentBalanceInCents / 100} -> ${newBalance}`);
      } else {
        console.error(`Stylist ${stylistId} not found when updating balance`);
        throw new Error('Stylist not found');
      }
    });

    // Add a balance history record
    await stylistRef.collection('balanceHistory').add({
      amount: amountInCents / 100, // Original amount in dollars
      balanceAfter: newBalance,
      type: amountInCents > 0 ? 'credit' : 'debit',
      description,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return newBalance;
  } catch (error) {
    console.error('Error updating stylist balance:', error);
    throw error;
  }
}

app.post(
  '/create-payment-to-stylist',
  validateFirebaseIdToken,
  async (
    req: RequestWithRawBody & { body: PaymentToStylistRequest, user?: admin.auth.DecodedIdToken },
    res: Response
  ) => {
    try {
      const { 
        userId, 
        stylistId, 
        amount,
        serviceDescription, 
        successUrl, 
        cancelUrl,
        bookingData
      } = req.body;

      // Validate required fields
      if (!userId || !stylistId || !amount || !serviceDescription || !bookingData) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      // Verify authenticated user
      if (userId !== req.user?.uid) {
        return res.status(403).json({ error: 'Unauthorized access to user data' });
      }

      // Get stylist data
      const stylistRef = db.collection('stylists').doc(stylistId);
      const stylistDoc = await stylistRef.get();

      if (!stylistDoc.exists) {
        return res.status(404).json({ error: 'Stylist not found' });
      }

      const stylistData = stylistDoc.data();

      // Verify stylist's Stripe account
      if (!stylistData?.stripeAccountId || stylistData.stripeAccountStatus !== 'active') {
        return res.status(400).json({
          error: 'Stylist does not have an active payment account',
        });
      }

      // Get user email and handle customer creation
      const userRecord = await admin.auth().getUser(userId);
      const email = userRecord.email;

      if (!email) {
        return res.status(400).json({ error: 'User email not found' });
      }

      // Get or create Stripe customer
      const clientRef = db.collection('clients').doc(userId);
      const clientDoc = await clientRef.get();
      const clientData = clientDoc.data();

      let stripeCustomerId: string;

      if (!clientDoc.exists || !clientData?.stripeCustomerId) {
        const customer = await stripe.customers.create({
          email,
          metadata: { userId }
        });

        await clientRef.set({
          email,
          stripeCustomerId: customer.id,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });

        stripeCustomerId = customer.id;
      } else {
        stripeCustomerId = clientData.stripeCustomerId;
      }

      // Generate booking ID and prepare metadata
      const pendingBookingId = db.collection('bookings').doc().id;

      const metadata: Record<string, string> = {
        userId,
        stylistId,
        serviceDescription,
        pendingBookingId,
        paymentType: bookingData.paymentType,
        totalAmount: bookingData.totalAmount.toString(),
        depositAmount: bookingData.depositAmount?.toString() || '0'
      };

      // Store pending booking
      await db.collection('pendingBookings').doc(pendingBookingId).set({
        bookingData,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        expiresAt: admin.firestore.Timestamp.fromMillis(Date.now() + 3600000)
      });

      // Create Stripe checkout session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        customer: stripeCustomerId,
        payment_intent_data: {
          transfer_data: {
            destination: stylistData.stripeAccountId,
          },
          metadata
        },
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${bookingData.paymentType === 'deposit' ? 'Deposit for' : 'Full payment for'} ${serviceDescription}`,
              metadata
            },
            unit_amount: amount,
          },
          quantity: 1,
        }],
        success_url: successUrl 
          ? `${successUrl}?session_id={CHECKOUT_SESSION_ID}&booking_id=${pendingBookingId}`
          : `${req.headers.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}&booking_id=${pendingBookingId}`,
        cancel_url: cancelUrl
          ? `${cancelUrl}?booking_id=${pendingBookingId}`
          : `${req.headers.origin}/payment-canceled?booking_id=${pendingBookingId}`,
        metadata
      });

      // Create payment record
      const paymentRef = await db.collection('payments').add({
        clientId: userId,
        stylistId,
        amount,
        serviceDescription,
        status: 'pending',
        stripeSessionId: session.id,
        stripePaymentIntentId: session.payment_intent,
        pendingBookingId,
        bookingData,
        paymentType: bookingData.paymentType,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return res.status(200).json({ 
        sessionId: session.id,
        url: session.url,
        paymentId: paymentRef.id,
        pendingBookingId
      });

    } catch (error) {
      console.error('Error creating payment to stylist:', error);
      return res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  }
);

// Add a new endpoint to create a booking without payment
app.post(
  '/create-booking',
  validateFirebaseIdToken,
  async (
    req: RequestWithRawBody & { user?: admin.auth.DecodedIdToken },
    res: Response
  ) => {
    try {
      const bookingData = req.body;
      
      // Validate booking data
      if (!bookingData.stylistId || !bookingData.clientId || !bookingData.date || !bookingData.time) {
        return res.status(400).json({ error: 'Missing required booking information' });
      }
      
      // Verify that the authenticated user is the client
      if (bookingData.clientId !== req.user?.uid) {
        return res.status(403).json({ error: 'Unauthorized access to user data' });
      }
      
      // Create the booking
      const bookingRef = db.collection('bookings').doc();
      await bookingRef.set({
        ...bookingData,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Notify the stylist about the new booking
      await db.collection('notifications').add({
        userId: bookingData.stylistId,
        type: 'new_booking',
        title: 'New Booking',
        message: `You have a new booking for ${bookingData.serviceName} on ${bookingData.date} at ${bookingData.time}`,
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        data: {
          bookingId: bookingRef.id
        }
      });
      
      return res.status(200).json({ 
        success: true,
        bookingId: bookingRef.id
      });
    } catch (error) {
      console.error('Error creating booking:', error);
      return res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  }
);

// Add a webhook handler to create the booking when payment is successful
app.post('/webhook', async (req: RequestWithRawBody, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
  } catch (err) {
    console.error(`Webhook signature verification failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    return res.status(400).send(`Webhook Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }

  try {
    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const stylistId = session.metadata?.stylistId;
        const subscriptionId = session.subscription as string;
        const paymentIntentId = session.payment_intent as string;
        
        // Check if this is a booking-related payment
        if (session.metadata?.pendingBookingId) {
          const pendingBookingId = session.metadata.pendingBookingId;
          
          // Get the pending booking data
          const pendingBookingRef = db.collection('pendingBookings').doc(pendingBookingId);
          const pendingBookingDoc = await pendingBookingRef.get();
          
          if (pendingBookingDoc.exists) {
            const pendingBookingData = pendingBookingDoc.data();
            const bookingData = pendingBookingData?.bookingData;
            
            if (bookingData) {
              // Create the actual booking
              const bookingRef = db.collection('bookings').doc(pendingBookingId);
              await bookingRef.set({
                ...bookingData,
                status: 'confirmed',
                paymentStatus: 'paid',
                paymentId: session.payment_intent,
                stripeSessionId: session.id,
                depositAmount: session.amount_total ? session.amount_total / 100 : null,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                paymentCompletedAt: admin.firestore.FieldValue.serverTimestamp()
              });
              
              console.log(`Created booking ${pendingBookingId} after successful payment`);
              
              // Update the payment record
              const paymentsQuery = await db
                .collection('payments')
                .where('stripeSessionId', '==', session.id)
                .get();
              
              if (!paymentsQuery.empty) {
                await paymentsQuery.docs[0].ref.update({
                  status: 'completed',
                  bookingId: pendingBookingId,
                  completedAt: admin.firestore.FieldValue.serverTimestamp(),
                  balanceUpdated: true
                });
              }
              
              // Notify the stylist about the new booking
              await db.collection('notifications').add({
                userId: bookingData.stylistId,
                type: 'new_booking',
                title: 'New Booking with Deposit',
                message: `You have a new booking with deposit paid for ${bookingData.serviceName} on ${bookingData.date} at ${bookingData.time}`,
                read: false,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                data: {
                  bookingId: pendingBookingId,
                  amount: session.amount_total,
                  serviceName: bookingData.serviceName
                }
              });
              
              // Notify the client about the successful booking
              await db.collection('notifications').add({
                userId: bookingData.clientId,
                type: 'booking_confirmed',
                title: 'Booking Confirmed',
                message: `Your booking for ${bookingData.serviceName} on ${bookingData.date} at ${bookingData.time} has been confirmed.`,
                read: false,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                data: {
                  bookingId: pendingBookingId,
                  serviceName: bookingData.serviceName,
                  date: bookingData.date,
                  time: bookingData.time
                }
              });
              
              // Update stylist's balance
              if (stylistId) {
                const netAmount = (session.amount_total || 0) - (session.amount_total ? Math.round(session.amount_total * 0.1) : 0);
                await updateStylistBalance(
                  stylistId,
                  netAmount,
                  `Deposit payment for booking #${pendingBookingId.substring(0, 8)} - ${bookingData.serviceName}`,
                  
                );
                
                // Update stylist's earnings statistics
                const stylistRef = db.collection('stylists').doc(stylistId);
                await db.runTransaction(async (transaction) => {
                  const stylistDoc = await transaction.get(stylistRef);
                  if (stylistDoc.exists) {
                    const stylistData = stylistDoc.data();
                    const currentEarnings = stylistData?.earnings || 0;
                    const currentMonthlyEarnings = stylistData?.monthlyEarnings || 0;
                    const currentPaymentCount = stylistData?.paymentCount || 0;
                    const currentBookingCount = stylistData?.bookingCount || 0;

                    transaction.update(stylistRef, {
                      earnings: currentEarnings + netAmount,
                      monthlyEarnings: currentMonthlyEarnings + netAmount,
                      paymentCount: currentPaymentCount + 1,
                      bookingCount: currentBookingCount + 1,
                      lastPaymentAt: admin.firestore.FieldValue.serverTimestamp(),
                      lastBookingAt: admin.firestore.FieldValue.serverTimestamp()
                    });
                  }
                });
              }
              
              // Add payment to client's payment history
              if (userId) {
                await db.collection('clients').doc(userId).collection('paymentHistory').add({
                  paymentId: session.payment_intent,
                  stylistId: stylistId,
                  bookingId: pendingBookingId,
                  amount: session.amount_total,
                  description: `Deposit for ${bookingData.serviceName}`,
                  status: 'completed',
                  createdAt: admin.firestore.FieldValue.serverTimestamp(),
                  completedAt: admin.firestore.FieldValue.serverTimestamp()
                });
                
                // Update client's booking count
                const clientRef = db.collection('clients').doc(userId);
                await db.runTransaction(async (transaction) => {
                  const clientDoc = await transaction.get(clientRef);
                  if (clientDoc.exists) {
                    const clientData = clientDoc.data();
                    const currentBookingCount = clientData?.bookingCount || 0;
                    
                    transaction.update(clientRef, {
                      bookingCount: currentBookingCount + 1,
                      lastBookingAt: admin.firestore.FieldValue.serverTimestamp()
                    });
                  }
                });
              }
              
              // Clean up the pending booking
              await pendingBookingRef.delete();
            }
          }
        }

        console.log(`Checkout session completed: ${session.id}`);

        // Handle subscription checkout
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

        // Handle payment to stylist checkout
        if (userId && stylistId && paymentIntentId && !session.metadata?.pendingBookingId) {
          // Find the payment record
          const paymentsQuery = await db
            .collection('payments')
            .where('stripeSessionId', '==', session.id)
            .get();

          if (!paymentsQuery.empty) {
            const paymentDoc = paymentsQuery.docs[0];
            const paymentData = paymentDoc.data();

            // Update payment status
            await paymentDoc.ref.update({
              status: 'completed',
              completedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            console.log(`Updated payment status for session ${session.id} to completed`);

            // Add a notification for the stylist
            await db.collection('notifications').add({
              userId: stylistId,
              type: 'payment_received',
              title: 'Payment Received',
              message: `You received a payment of $${(session.amount_total || 0) / 100} for ${session.metadata?.serviceDescription}`,
              read: false,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              data: {
                paymentId: paymentDoc.id,
                amount: session.amount_total,
                clientId: userId
              }
            });

            // Update stylist's balance
            const netAmount = (session.amount_total || 0) - (paymentData.applicationFeeAmount || 0);
            await updateStylistBalance(
              stylistId,
              netAmount,
              `Payment received for ${session.metadata?.serviceDescription}`
            );

            // Update stylist's earnings statistics
            const stylistRef = db.collection('stylists').doc(stylistId);
            await db.runTransaction(async (transaction) => {
              const stylistDoc = await transaction.get(stylistRef);
              if (stylistDoc.exists) {
                const stylistData = stylistDoc.data();
                const currentEarnings = stylistData?.earnings || 0;
                const currentMonthlyEarnings = stylistData?.monthlyEarnings || 0;
                const currentPaymentCount = stylistData?.paymentCount || 0;

                transaction.update(stylistRef, {
                  earnings: currentEarnings + netAmount,
                  monthlyEarnings: currentMonthlyEarnings + netAmount,
                  paymentCount: currentPaymentCount + 1,
                  lastPaymentAt: admin.firestore.FieldValue.serverTimestamp()
                });
              }
            });

            // Add payment to client's payment history
            await db.collection('clients').doc(userId).collection('paymentHistory').add({
              paymentId: paymentDoc.id,
              stylistId: stylistId,
              amount: session.amount_total,
              description: session.metadata?.serviceDescription,
              status: 'completed',
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              completedAt: admin.firestore.FieldValue.serverTimestamp()
            });
          }
        }
        break;
      }
      
      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Find the payment in Firestore
        const paymentsQuery = await db
          .collection('payments')
          .where('stripeSessionId', '==', session.id)
          .get();
        
        if (!paymentsQuery.empty) {
          const paymentDoc = paymentsQuery.docs[0];
          const paymentData = paymentDoc.data();
          
          // Update payment status
          await paymentDoc.ref.update({
            status: 'expired',
            expiredAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          
          console.log(`Payment ${paymentDoc.id} marked as expired`);
          
          // Check if this is a booking-related payment
          if (session.metadata?.pendingBookingId) {
            const pendingBookingId = session.metadata.pendingBookingId;
            
            // Clean up the pending booking
            const pendingBookingRef = db.collection('pendingBookings').doc(pendingBookingId);
            const pendingBookingDoc = await pendingBookingRef.get();
            
            if (pendingBookingDoc.exists) {
              const pendingBookingData = pendingBookingDoc.data();
              const bookingData = pendingBookingData?.bookingData;
              
              if (bookingData) {
                // Create a failed booking record
                const bookingRef = db.collection('bookings').doc(pendingBookingId);
                await bookingRef.set({
                  ...bookingData,
                  status: 'failed',
                  paymentStatus: 'failed',
                  paymentId: session.payment_intent,
                  stripeSessionId: session.id,
                  depositAmount: session.amount_total ? session.amount_total / 100 : null,
                  createdAt: admin.firestore.FieldValue.serverTimestamp(),
                  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                  paymentFailedAt: admin.firestore.FieldValue.serverTimestamp(),
                  paymentFailureReason: 'Payment session expired'
                });
                
                console.log(`Created failed booking ${pendingBookingId} after payment session expired`);
                
                // Notify the client about the failed booking
                await db.collection('notifications').add({
                  userId: bookingData.clientId,
                  type: 'booking_payment_failed',
                  title: 'Booking Payment Failed',
                  message: `Your payment for booking ${bookingData.serviceName} on ${bookingData.date} at ${bookingData.time} has expired. Please try again.`,
                  read: false,
                  createdAt: admin.firestore.FieldValue.serverTimestamp(),
                  data: {
                    bookingId: pendingBookingId,
                    serviceName: bookingData.serviceName,
                    date: bookingData.date,
                    time: bookingData.time
                  }
                });
              }
              
              // Delete the pending booking
              await pendingBookingRef.delete();
            }
          }
        }
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const userId = paymentIntent.metadata?.userId;
        const stylistId = paymentIntent.metadata?.stylistId;
        const bookingId = paymentIntent.metadata?.bookingId;

        if (userId && stylistId) {
          // Find the payment record
          const paymentsQuery = await db
            .collection('payments')
            .where('stripePaymentIntentId', '==', paymentIntent.id)
            .get();

          if (!paymentsQuery.empty) {
            const paymentDoc = paymentsQuery.docs[0];
            const paymentData = paymentDoc.data();

            // Only process if payment is not already completed
            if (paymentData.status !== 'completed') {
              await paymentDoc.ref.update({
                status: 'completed',
                completedAt: admin.firestore.FieldValue.serverTimestamp(),
              });

              console.log(`Updated payment status for payment intent ${paymentIntent.id} to completed`);
              
              // If this payment is for a booking, update the booking
              if (bookingId) {
                const bookingRef = db.collection('bookings').doc(bookingId);
                const bookingDoc = await bookingRef.get();
                
                if (bookingDoc.exists) {
                  await bookingRef.update({
                    paymentStatus: 'paid',
                    status: 'confirmed',
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    paymentCompletedAt: admin.firestore.FieldValue.serverTimestamp()
                  });
                  
                  console.log(`Updated booking ${bookingId} payment status to paid`);
                }
              }

              // Add a notification for the stylist
              await db.collection('notifications').add({
                userId: stylistId,
                type: 'payment_received',
                title: 'Payment Received',
                message: `You received a payment of $${paymentIntent.amount / 100} for ${paymentIntent.description}`,
                read: false,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                data: {
                  paymentId: paymentDoc.id,
                  amount: paymentIntent.amount,
                  clientId: userId,
                  bookingId: bookingId
                }
              });

              // Update stylist's balance - only if not already processed in checkout.session.completed
              if (!paymentData.balanceUpdated) {
                const netAmount = paymentIntent.amount - (paymentData.applicationFeeAmount || 0);
                await updateStylistBalance(
                  stylistId,
                  netAmount,
                  `Payment received for ${paymentIntent.description}`
                );

                // Mark as balance updated
                await paymentDoc.ref.update({
                  balanceUpdated: true
                });

                // Update stylist's earnings statistics
                const stylistRef = db.collection('stylists').doc(stylistId);
                await db.runTransaction(async (transaction) => {
                  const stylistDoc = await transaction.get(stylistRef);
                  if (stylistDoc.exists) {
                    const stylistData = stylistDoc.data();
                    const currentEarnings = stylistData?.earnings || 0;
                    const currentMonthlyEarnings = stylistData?.monthlyEarnings || 0;
                    const currentPaymentCount = stylistData?.paymentCount || 0;

                    transaction.update(stylistRef, {
                      earnings: currentEarnings + netAmount,
                      monthlyEarnings: currentMonthlyEarnings + netAmount,
                      paymentCount: currentPaymentCount + 1,
                      lastPaymentAt: admin.firestore.FieldValue.serverTimestamp()
                    });
                  }
                });
              }

              // Add payment to client's payment history if not already added
              const clientPaymentHistoryQuery = await db
                .collection('clients')
                .doc(userId)
                .collection('paymentHistory')
                .where('paymentId', '==', paymentDoc.id)
                .get();

              if (clientPaymentHistoryQuery.empty) {
                await db.collection('clients').doc(userId).collection('paymentHistory').add({
                  paymentId: paymentDoc.id,
                  stylistId: stylistId,
                  bookingId: bookingId,
                  amount: paymentIntent.amount,
                  description: paymentIntent.description,
                  status: 'completed',
                  createdAt: admin.firestore.FieldValue.serverTimestamp(),
                  completedAt: admin.firestore.FieldValue.serverTimestamp()
                });
              }
            }
          }
        }
        break;
      }
      
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const userId = paymentIntent.metadata?.userId;
        const stylistId = paymentIntent.metadata?.stylistId;
        const bookingId = paymentIntent.metadata?.bookingId;
        
        if (userId) {
          // Find the payment record
          const paymentsQuery = await db
            .collection('payments')
            .where('stripePaymentIntentId', '==', paymentIntent.id)
            .get();
            
          if (!paymentsQuery.empty) {
            const paymentDoc = paymentsQuery.docs[0];
            
            // Update payment status
            await paymentDoc.ref.update({
              status: 'failed',
              failedAt: admin.firestore.FieldValue.serverTimestamp(),
              failureMessage: paymentIntent.last_payment_error?.message || 'Payment failed'
            });
            
            console.log(`Updated payment status for payment intent ${paymentIntent.id} to failed`);
            
            // If this payment is for a booking, update the booking
            if (bookingId) {
              const bookingRef = db.collection('bookings').doc(bookingId);
              const bookingDoc = await bookingRef.get();
              
              if (bookingDoc.exists) {
                await bookingRef.update({
                  paymentStatus: 'failed',
                  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                  paymentFailedAt: admin.firestore.FieldValue.serverTimestamp(),
                  paymentFailureReason: paymentIntent.last_payment_error?.message || 'Payment failed'
                });
                
                console.log(`Updated booking ${bookingId} payment status to failed`);
                
                // Notify the client about the failed payment
                const bookingData = bookingDoc.data();
                await db.collection('notifications').add({
                  userId: bookingData?.clientId,
                  type: 'payment_failed',
                  title: 'Payment Failed',
                  message: `Your payment for ${bookingData?.serviceName} failed: ${paymentIntent.last_payment_error?.message || 'Unknown error'}. Please try again.`,
                  read: false,
                  createdAt: admin.firestore.FieldValue.serverTimestamp(),
                  data: {
                    bookingId: bookingId,
                    paymentId: paymentDoc.id,
                    errorMessage: paymentIntent.last_payment_error?.message
                  }
                });
              }
            }
            
            // Notify the client about the failed payment
            await db.collection('notifications').add({
              userId: userId,
              type: 'payment_failed',
              title: 'Payment Failed',
              message: `Your payment of $${paymentIntent.amount / 100} failed: ${paymentIntent.last_payment_error?.message || 'Unknown error'}. Please try again.`,
              read: false,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              data: {
                paymentId: paymentDoc.id,
                amount: paymentIntent.amount,
                errorMessage: paymentIntent.last_payment_error?.message
              }
            });
          }
        }
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;
        const customerId = invoice.customer as string;

        if (subscriptionId && customerId) {
          // Find the stylist with this customer ID
          const stylistsQuery = await db
            .collection('stylists')
            .where('stripeCustomerId', '==', customerId)
            .get();

          if (!stylistsQuery.empty) {
            const stylistDoc = stylistsQuery.docs[0];
            const stylistId = stylistDoc.id;

            // Get subscription details
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);

            // Update the stylist document with subscription details
            await stylistDoc.ref.update({
              'subscription.status': subscription.status,
              'subscription.currentPeriodStart': admin.firestore.Timestamp.fromMillis(
                subscription.current_period_start * 1000
              ),
              'subscription.currentPeriodEnd': admin.firestore.Timestamp.fromMillis(
                subscription.current_period_end * 1000
              ),
              'subscription.updatedAt': admin.firestore.FieldValue.serverTimestamp(),
            });

            console.log(`Updated subscription status for stylist ${stylistId} to ${subscription.status}`);

            // Add a notification for the stylist
            await db.collection('notifications').add({
              userId: stylistId,
              type: 'subscription_renewed',
              title: 'Subscription Renewed',
              message: `Your subscription has been renewed for $${invoice.amount_paid / 100}. It will be active until ${new Date(subscription.current_period_end * 1000).toLocaleDateString()}.`,
              read: false,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              data: {
                subscriptionId: subscription.id,
                amount: invoice.amount_paid,
                periodEnd: subscription.current_period_end
              }
            });

            // Add subscription payment to payment history
            await db.collection('subscriptionPayments').add({
              stylistId: stylistId,
              subscriptionId: subscription.id,
              invoiceId: invoice.id,
              amount: invoice.amount_paid,
              status: 'paid',
              periodStart: admin.firestore.Timestamp.fromMillis(subscription.current_period_start * 1000),
              periodEnd: admin.firestore.Timestamp.fromMillis(subscription.current_period_end * 1000),
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;
        const customerId = invoice.customer as string;

        if (subscriptionId && customerId) {
          // Find the stylist with this customer ID
          const stylistsQuery = await db
            .collection('stylists')
            .where('stripeCustomerId', '==', customerId)
            .get();

          if (!stylistsQuery.empty) {
            const stylistDoc = stylistsQuery.docs[0];
            const stylistId = stylistDoc.id;

            // Get subscription details
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);

            // Update the stylist document with subscription details
            await stylistDoc.ref.update({
              'subscription.status': subscription.status,
              'subscription.updatedAt': admin.firestore.FieldValue.serverTimestamp(),
            });

            console.log(`Updated subscription status for stylist ${stylistId} to ${subscription.status}`);

            // Add a notification for the stylist
            await db.collection('notifications').add({
              userId: stylistId,
              type: 'subscription_payment_failed',
              title: 'Subscription Payment Failed',
              message: `Your subscription payment of $${invoice.amount_due / 100} failed. Please update your payment method to keep your subscription active.`,
              read: false,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              data: {
                subscriptionId: subscription.id,
                amount: invoice.amount_due,
                invoiceUrl: invoice.hosted_invoice_url
              }
            });

            // Add failed payment to payment history
            await db.collection('subscriptionPayments').add({
              stylistId: stylistId,
              subscriptionId: subscription.id,
              invoiceId: invoice.id,
              amount: invoice.amount_due,
              status: 'failed',
              failureMessage: invoice.last_payment_error?.message || 'Payment failed',
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
          }
        }
        break;
      }
      
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Find the stylist with this customer ID
        const stylistsQuery = await db
          .collection('stylists')
          .where('stripeCustomerId', '==', customerId)
          .get();

        if (!stylistsQuery.empty) {
          const stylistDoc = stylistsQuery.docs[0];
          const stylistId = stylistDoc.id;

          // Update the stylist document with subscription details
          await stylistDoc.ref.update({
            'subscription.status': subscription.status,
            'subscription.currentPeriodStart': admin.firestore.Timestamp.fromMillis(
              subscription.current_period_start * 1000
            ),
            'subscription.currentPeriodEnd': admin.firestore.Timestamp.fromMillis(
              subscription.current_period_end * 1000
            ),
            'subscription.cancelAtPeriodEnd': subscription.cancel_at_period_end,
            'subscription.updatedAt': admin.firestore.FieldValue.serverTimestamp(),
          });

          console.log(`Updated subscription status for stylist ${stylistId} to ${subscription.status}`);

          // Handle subscription status notifications
          if (stylistDoc.data()?.subscription?.cancelAtPeriodEnd === true && 
              subscription.cancel_at_period_end === false) {
            // Subscription was reactivated
            await db.collection('notifications').add({
              userId: stylistId,
              type: 'subscription_reactivated',
              title: 'Subscription Reactivated',
              message: 'Your subscription has been reactivated and will continue at the end of the current billing period.',
              read: false,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              data: {
                subscriptionId: subscription.id
              }
            });
          } else if (subscription.cancel_at_period_end) {
            // Subscription was canceled
            await db.collection('notifications').add({
              userId: stylistId,
              type: 'subscription_cancellation_scheduled',
              title: 'Subscription Cancellation Scheduled',
              message: `Your subscription will be canceled on ${new Date(subscription.current_period_end * 1000).toLocaleDateString()}. You can continue using the service until then.`,
              read: false,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              data: {
                subscriptionId: subscription.id,
                periodEnd: subscription.current_period_end
              }
            });
          }
        }
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Find the stylist with this customer ID
        const stylistsQuery = await db
          .collection('stylists')
          .where('stripeCustomerId', '==', customerId)
          .get();

        if (!stylistsQuery.empty) {
          const stylistDoc = stylistsQuery.docs[0];
          const stylistId = stylistDoc.id;

          // Update the stylist document with subscription details
          await stylistDoc.ref.update({
            'subscription.status': 'canceled',
            'subscription.canceledAt': admin.firestore.FieldValue.serverTimestamp(),
            'subscription.updatedAt': admin.firestore.FieldValue.serverTimestamp(),
          });

          console.log(`Updated subscription status for stylist ${stylistId} to canceled`);

          // Add a notification for the stylist
          await db.collection('notifications').add({
            userId: stylistId,
            type: 'subscription_canceled',
            title: 'Subscription Canceled',
            message: 'Your subscription has been canceled. Some features may no longer be available.',
            read: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            data: {
              subscriptionId: subscription.id
            }
          });
        }
        break;
      }
      case 'transfer.created': {
        const transfer = event.data.object as Stripe.Transfer;
        const withdrawalId = transfer.metadata?.withdrawal_id;
        const stylistId = transfer.metadata?.stylist_id;

        if (withdrawalId) {
          // This is a withdrawal transfer
          const withdrawalRef = db.collection('withdrawals').doc(withdrawalId);
          const withdrawalDoc = await withdrawalRef.get();

          if (withdrawalDoc.exists) {
            const withdrawalData = withdrawalDoc.data();
            
            // Update withdrawal status
            await withdrawalRef.update({
              status: 'completed',
              stripeTransferId: transfer.id,
              completedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            
            console.log(`Updated withdrawal ${withdrawalId} status to completed`);
            
            // Add a notification for the stylist
            if (stylistId) {
              await db.collection('notifications').add({
                userId: stylistId,
                type: 'withdrawal_completed',
                title: 'Withdrawal Completed',
                message: `Your withdrawal of $${transfer.amount / 100} has been processed and is on its way to your bank account.`,
                read: false,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                data: {
                  withdrawalId: withdrawalId,
                  amount: transfer.amount,
                  transferId: transfer.id
                }
              });
              
              // Add to stylist's transfers collection
              await db.collection('stylists').doc(stylistId).collection('transfers').add({
                withdrawalId: withdrawalId,
                transferId: transfer.id,
                amount: transfer.amount,
                description: withdrawalData?.description || 'Withdrawal to bank account',
                status: 'completed',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                completedAt: admin.firestore.FieldValue.serverTimestamp()
              });
            }
          }
        }
        break;
      }
      
      case 'transfer.failed': {
        const transfer = event.data.object as Stripe.Transfer;
        const withdrawalId = transfer.metadata?.withdrawal_id;
        const stylistId = transfer.metadata?.stylist_id;
        
        if (withdrawalId) {
          // This is a withdrawal transfer that failed
          const withdrawalRef = db.collection('withdrawals').doc(withdrawalId);
          const withdrawalDoc = await withdrawalRef.get();
          
          if (withdrawalDoc.exists) {
            const withdrawalData = withdrawalDoc.data();
            
            // Update withdrawal status
            await withdrawalRef.update({
              status: 'failed',
              stripeTransferId: transfer.id,
              failedAt: admin.firestore.FieldValue.serverTimestamp(),
              failureReason: transfer.failure_message || 'Transfer failed'
            });
            
            console.log(`Updated withdrawal ${withdrawalId} status to failed`);
            
            // Refund the amount back to stylist's balance
            if (stylistId) {
              const amount = withdrawalData?.amount || 0;
              
              // Update stylist's balance
              await updateStylistBalance(
                stylistId,
                amount,
                `Refund for failed withdrawal #${withdrawalId.substring(0, 8)}`
              );
              
              // Add a notification for the stylist
              await db.collection('notifications').add({
                userId: stylistId,
                type: 'withdrawal_failed',
                title: 'Withdrawal Failed',
                message: `Your withdrawal of $${amount / 100} has failed: ${transfer.failure_message || 'Unknown error'}. The amount has been returned to your balance.`,
                read: false,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                data: {
                  withdrawalId: withdrawalId,
                  amount: amount,
                  transferId: transfer.id,
                  failureReason: transfer.failure_message
                }
              });
              
              // Add to stylist's transfers collection
              await db.collection('stylists').doc(stylistId).collection('transfers').add({
                withdrawalId: withdrawalId,
                transferId: transfer.id,
                amount: amount,
                description: withdrawalData?.description || 'Failed withdrawal to bank account',
                status: 'failed',
                failureReason: transfer.failure_message || 'Transfer failed',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                failedAt: admin.firestore.FieldValue.serverTimestamp()
              });
            }
          }
        }
        break;
      }
      
      case 'payout.created': {
        const payout = event.data.object as Stripe.Payout;
        const accountId = payout.destination as string;
        
        // Find the stylist with this account ID
        const stylistsQuery = await db
          .collection('stylists')
          .where('stripeAccountId', '==', accountId)
          .get();
          
        if (!stylistsQuery.empty) {
          const stylistDoc = stylistsQuery.docs[0];
          const stylistId = stylistDoc.id;
          
          // Add to stylist's payouts collection
          await db.collection('stylists').doc(stylistId).collection('payouts').add({
            payoutId: payout.id,
            amount: payout.amount,
            currency: payout.currency,
            arrivalDate: admin.firestore.Timestamp.fromMillis(payout.arrival_date * 1000),
            status: payout.status,
            method: payout.type,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          });
          
          console.log(`Added payout ${payout.id} to stylist ${stylistId}`);
          
          // Add a notification for the stylist
          await db.collection('notifications').add({
            userId: stylistId,
            type: 'payout_created',
            title: 'Payout Initiated',
            message: `A payout of $${payout.amount / 100} has been initiated to your bank account. It should arrive by ${new Date(payout.arrival_date * 1000).toLocaleDateString()}.`,
            read: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            data: {
              payoutId: payout.id,
              amount: payout.amount,
              arrivalDate: payout.arrival_date
            }
          });
        }
        break;
      }
      
      case 'payout.paid': {
        const payout = event.data.object as Stripe.Payout;
        const accountId = payout.destination as string;
        
        // Find the stylist with this account ID
        const stylistsQuery = await db
          .collection('stylists')
          .where('stripeAccountId', '==', accountId)
          .get();
          
        if (!stylistsQuery.empty) {
          const stylistDoc = stylistsQuery.docs[0];
          const stylistId = stylistDoc.id;
          
          // Find the payout in Firestore
          const payoutsQuery = await db
            .collection('stylists')
            .doc(stylistId)
            .collection('payouts')
            .where('payoutId', '==', payout.id)
            .get();
            
          if (!payoutsQuery.empty) {
            const payoutDoc = payoutsQuery.docs[0];
            
            // Update payout status
            await payoutDoc.ref.update({
              status: 'paid',
              paidAt: admin.firestore.FieldValue.serverTimestamp()
            });
            
            console.log(`Updated payout ${payout.id} status to paid`);
            
            // Add a notification for the stylist
            await db.collection('notifications').add({
              userId: stylistId,
              type: 'payout_paid',
              title: 'Payout Completed',
              message: `Your payout of $${payout.amount / 100} has been deposited to your bank account.`,
              read: false,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              data: {
                payoutId: payout.id,
                amount: payout.amount
              }
            });
          } else {
            // Payout not found in Firestore, create a new record
            await db.collection('stylists').doc(stylistId).collection('payouts').add({
              payoutId: payout.id,
              amount: payout.amount,
              currency: payout.currency,
              arrivalDate: admin.firestore.Timestamp.fromMillis(payout.arrival_date * 1000),
              status: 'paid',
              method: payout.type,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              paidAt: admin.firestore.FieldValue.serverTimestamp()
            });
            
            console.log(`Created new paid payout record ${payout.id} for stylist ${stylistId}`);
            
            // Add a notification for the stylist
            await db.collection('notifications').add({
              userId: stylistId,
              type: 'payout_paid',
              title: 'Payout Completed',
              message: `Your payout of $${payout.amount / 100} has been deposited to your bank account.`,
              read: false,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              data: {
                payoutId: payout.id,
                amount: payout.amount
              }
            });
          }
        }
        break;
      }
      
      case 'payout.failed': {
        const payout = event.data.object as Stripe.Payout;
        const accountId = payout.destination as string;
        
        // Find the stylist with this account ID
        const stylistsQuery = await db
          .collection('stylists')
          .where('stripeAccountId', '==', accountId)
          .get();
          
        if (!stylistsQuery.empty) {
          const stylistDoc = stylistsQuery.docs[0];
          const stylistId = stylistDoc.id;
          
          // Find the payout in Firestore
          const payoutsQuery = await db
            .collection('stylists')
            .doc(stylistId)
            .collection('payouts')
            .where('payoutId', '==', payout.id)
            .get();
            
          if (!payoutsQuery.empty) {
            const payoutDoc = payoutsQuery.docs[0];
            
            // Update payout status
            await payoutDoc.ref.update({
              status: 'failed',
              failedAt: admin.firestore.FieldValue.serverTimestamp(),
              failureReason: payout.failure_message || 'Payout failed'
            });
            
            console.log(`Updated payout ${payout.id} status to failed`);
            
            // Add a notification for the stylist
            await db.collection('notifications').add({
              userId: stylistId,
              type: 'payout_failed',
              title: 'Payout Failed',
              message: `Your payout of $${payout.amount / 100} has failed: ${payout.failure_message || 'Unknown error'}. The funds will remain in your Stripe account.`,
              read: false,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              data: {
                payoutId: payout.id,
                amount: payout.amount,
                failureReason: payout.failure_message
              }
            });
          } else {
            // Payout not found in Firestore, create a new record
            await db.collection('stylists').doc(stylistId).collection('payouts').add({
              payoutId: payout.id,
              amount: payout.amount,
              currency: payout.currency,
              arrivalDate: admin.firestore.Timestamp.fromMillis(payout.arrival_date * 1000),
              status: 'failed',
              method: payout.type,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              failedAt: admin.firestore.FieldValue.serverTimestamp(),
              failureReason: payout.failure_message || 'Payout failed'
            });
            
            console.log(`Created new failed payout record ${payout.id} for stylist ${stylistId}`);
            
            // Add a notification for the stylist
            await db.collection('notifications').add({
              userId: stylistId,
              type: 'payout_failed',
              title: 'Payout Failed',
              message: `Your payout of $${payout.amount / 100} has failed: ${payout.failure_message || 'Unknown error'}. The funds will remain in your Stripe account.`,
              read: false,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              data: {
                payoutId: payout.id,
                amount: payout.amount,
                failureReason: payout.failure_message
              }
            });
          }
        }
        break;
      }
      
      case 'account.updated': {
        const account = event.data.object as Stripe.Account;
        
        // Find the stylist with this account ID
        const stylistsQuery = await db
          .collection('stylists')
          .where('stripeAccountId', '==', account.id)
          .get();
          
        if (!stylistsQuery.empty) {
          const stylistDoc = stylistsQuery.docs[0];
          const stylistId = stylistDoc.id;
          
          // Extract requirements information
          const requirements = {
            currentlyDue: account.requirements?.currently_due || [],
            eventuallyDue: account.requirements?.eventually_due || [],
            pendingVerification: account.requirements?.pending_verification || [],
            disabled: account.requirements?.disabled_reason || null,
            chargesEnabled: account.charges_enabled,
            payoutsEnabled: account.payouts_enabled,
            detailsSubmitted: account.details_submitted
          };
          
          // Determine account status
          let accountStatus = 'pending';
          if (account.charges_enabled && account.payouts_enabled) {
            accountStatus = 'active';
          }
          
          // Update the stylist document with the latest account information
          await stylistDoc.ref.update({
            stripeAccountStatus: accountStatus,
            stripeAccountRequirements: requirements,
            stripeAccountUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          
          console.log(`Updated account status for stylist ${stylistId} to ${accountStatus}`);
          
          // If account was just activated, send a notification
          if (accountStatus === 'active' && stylistDoc.data()?.stripeAccountStatus !== 'active') {
            await db.collection('notifications').add({
              userId: stylistId,
              type: 'account_activated',
              title: 'Account Activated',
              message: 'Your Stripe account has been fully activated. You can now receive payments and process withdrawals.',
              read: false,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              data: {
                accountId: account.id
              }
            });
          }
          
          // If there are new requirements, send a notification
          if (requirements.currentlyDue.length > 0) {
            await db.collection('notifications').add({
              userId: stylistId,
              type: 'account_requirements',
              title: 'Account Information Needed',
              message: 'Your Stripe account requires additional information. Please visit your dashboard to complete the requirements.',
              read: false,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              data: {
                accountId: account.id,
                requirements: requirements.currentlyDue
              }
            });
          }
        }
        break;
      }
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error(`Error processing webhook: ${err instanceof Error ? err.message : 'Unknown error'}`);
    return res.status(500).send(`Webhook Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
});


// Get stylist balance endpoint
app.get(
  '/stylist-balance',
  validateFirebaseIdToken,
  async (
    req: RequestWithRawBody & { query: { stylistId: string }, user?: admin.auth.DecodedIdToken },
    res: Response
  ) => {
    try {
      const { stylistId } = req.query;

      if (!stylistId) {
        return res.status(400).json({ error: 'Stylist ID is required' });
      }

      // Verify that the authenticated user is requesting their own data
      if (stylistId !== req.user?.uid) {
        return res.status(403).json({ error: 'Unauthorized access to user data' });
      }

      const stylistDoc = await db.collection('stylists').doc(stylistId).get();

      if (!stylistDoc.exists) {
        return res.status(404).json({ error: 'Stylist not found' });
      }

      const stylistData = stylistDoc.data();

      // Get recent balance history
      const balanceHistoryQuery = await db
        .collection('stylists')
        .doc(stylistId)
        .collection('balanceHistory')
        .orderBy('createdAt', 'desc')
        .limit(10)
        .get();

      const balanceHistory = balanceHistoryQuery.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Get recent transfers
      const transfersQuery = await db
        .collection('stylists')
        .doc(stylistId)
        .collection('transfers')
        .orderBy('createdAt', 'desc')
        .limit(10)
        .get();

      const transfers = transfersQuery.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Get recent payouts
      const payoutsQuery = await db
        .collection('stylists')
        .doc(stylistId)
        .collection('payouts')
        .orderBy('createdAt', 'desc')
        .limit(10)
        .get();

      const payouts = payoutsQuery.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return res.status(200).json({
        balance:stylistData?.balance || 0,
        balanceUpdatedAt: stylistData?.balanceUpdatedAt,
        balanceCreatedAt: stylistData?.balanceCreatedAt,
        balanceHistory,
        transfers,
        payouts
      });
    } catch (error) {
      console.error('Error fetching stylist balance:', error);
      return res.status(500).json({
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  }
);

// Reactivate subscription endpoint
app.post(
  '/reactivate-subscription',
  validateFirebaseIdToken,
  async (
    req: RequestWithRawBody & { body: { userId: string }, user?: admin.auth.DecodedIdToken },
    res: Response
  ) => {
    try {
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      // Verify that the authenticated user is requesting their own data
      if (userId !== req.user?.uid) {
        return res.status(403).json({ error: 'Unauthorized access to user data' });
      }

      // Get the stylist document
      const stylistDoc = await db.collection('stylists').doc(userId).get();
      if (!stylistDoc.exists) {
        return res.status(404).json({ error: 'Stylist not found' });
      }

      const stylistData = stylistDoc.data();
      
      // Check if there's an existing subscription
      if (!stylistData?.subscription?.stripeSubscriptionId) {
        // No subscription found - redirect to create a new subscription
        return res.status(200).json({ 
          success: false, 
          needsNewSubscription: true,
          message: "No active subscription found. Please create a new subscription."
        });
      }

      // Verify subscription status allows reactivation
      if (!stylistData.subscription.cancelAtPeriodEnd) {
        return res.status(400).json({ error: 'Subscription is already active' });
      }

      // Get current subscription from Stripe to verify status
      const currentSubscription = await stripe.subscriptions.retrieve(
        stylistData.subscription.stripeSubscriptionId
      );

      if (currentSubscription.status !== 'active') {
        // Subscription exists but is not active (e.g., canceled, unpaid)
        return res.status(200).json({ 
          success: false, 
          needsNewSubscription: true,
          message: `Cannot reactivate subscription - current status is ${currentSubscription.status}. Please create a new subscription.`
        });
      }

      // Reactivate the subscription in Stripe
      const subscription = await stripe.subscriptions.update(
        stylistData.subscription.stripeSubscriptionId,
        { cancel_at_period_end: false }
      );

      // Update the subscription in Firestore
      await stylistDoc.ref.update({
        'subscription.cancelAtPeriodEnd': false,
        'subscription.status': subscription.status,
        'subscription.updatedAt': admin.firestore.FieldValue.serverTimestamp(),
      });

      // Add a notification for the stylist
      await db.collection('notifications').add({
        userId: userId,
        type: 'subscription_reactivated',
        title: 'Subscription Reactivated',
        message: 'Your subscription has been successfully reactivated and will continue at the end of the current billing period.',
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        data: {
          subscriptionId: subscription.id,
          currentPeriodEnd: subscription.current_period_end
        }
      });

      console.log(`Successfully reactivated subscription for stylist ${userId}`);

      return res.status(200).json({
        success: true,
        subscription: {
          id: subscription.id,
          status: subscription.status,
          currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString()
        }
      });
    } catch (error) {
      console.error('Error reactivating subscription:', error);
      return res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  }
);

// ... existing code ...

// Create a login link for an existing Connect account
app.post(
  '/create-account-link',
  cors({ origin: true }),
  async (req: Request, res: Response) => {
    try {
      // Verify authentication
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const idToken = authHeader.split('Bearer ')[1];
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const userId = decodedToken.uid;

      // Validate request body
      const { origin } = req.body;
      if (!origin) {
        return res.status(400).json({ error: 'Origin URL is required' });
      }

      // Get the stylist document
      const stylistRef = db.collection('stylists').doc(userId);
      const stylistDoc = await stylistRef.get();

      if (!stylistDoc.exists) {
        return res.status(404).json({ error: 'Stylist not found' });
      }

      // Get the Stripe account ID
      const stylistData = stylistDoc.data();
      const accountId = stylistData?.stripeAccountId;

      if (!accountId) {
        return res.status(400).json({ error: 'No Stripe account found' });
      }

      // Validate and sanitize the origin URL
      let validatedOrigin = origin;
      try {
        new URL(validatedOrigin);
      } catch (error) {
        console.warn('Invalid origin URL provided:', validatedOrigin);
        validatedOrigin = 'https://braidsnow.com';
      }

      // Create a login link for the dashboard
      const loginLink = await stripe.accounts.createLoginLink(accountId);

      return res.status(200).json({ url: loginLink.url });
    } catch (error) {
      console.error('Error creating account login link:', error);
      return res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  }
);

// Add this endpoint to check account requirements
app.post(
  '/check-account-requirements',
  cors({ origin: true }),
  async (req: Request, res: Response) => {
    try {
      // Verify authentication
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const idToken = authHeader.split('Bearer ')[1];
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const userId = decodedToken.uid;

      // Get the stylist document
      const stylistRef = db.collection('stylists').doc(userId);
      const stylistDoc = await stylistRef.get();

      if (!stylistDoc.exists) {
        return res.status(404).json({ error: 'Stylist not found' });
      }

      // Get the Stripe account ID
      const stylistData = stylistDoc.data();
      const accountId = stylistData?.stripeAccountId;

      if (!accountId) {
        return res.status(400).json({ error: 'No Stripe account found' });
      }

      // Retrieve the account details from Stripe
      const account = await stripe.accounts.retrieve(accountId);

      // Extract requirements information
      const requirements = {
        currentlyDue: account.requirements?.currently_due || [],
        eventuallyDue: account.requirements?.eventually_due || [],
        pendingVerification: account.requirements?.pending_verification || [],
        disabled: account.requirements?.disabled_reason || null,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        detailsSubmitted: account.details_submitted
      };

      // Update the stylist document with the latest requirements
      await stylistRef.update({
        stripeAccountRequirements: requirements,
        stripeAccountUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      return res.status(200).json({ requirements });
    } catch (error) {
      console.error('Error checking account requirements:', error);
      return res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  }
);

// Update the check-account-status endpoint to include more detailed account information
app.post(
  '/check-account-status',
  cors({ origin: true }),
  async (req: Request, res: Response) => {
    try {
      // Verify authentication
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const idToken = authHeader.split('Bearer ')[1];
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const userId = decodedToken.uid;

      // Get the stylist document
      const stylistRef = db.collection('stylists').doc(userId);
      const stylistDoc = await stylistRef.get();

      if (!stylistDoc.exists) {
        return res.status(404).json({ error: 'Stylist not found' });
      }

      const stylistData = stylistDoc.data();
      let statusChanged = false;
      let accountDetails = null;

      // Check Stripe Connect account status if it exists
      if (stylistData?.stripeAccountId) {
        try {
          const account = await stripe.accounts.retrieve(stylistData.stripeAccountId);
          
          // Determine account status
          let accountStatus = 'pending';
          if (account.charges_enabled && account.payouts_enabled) {
            accountStatus = 'active';
          }
          
          // Check if status has changed
          if (stylistData.stripeAccountStatus !== accountStatus) {
            await stylistRef.update({
              stripeAccountStatus: accountStatus,
              stripeAccountUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            statusChanged = true;
          }
          
          // Get detailed requirements information
          accountDetails = {
            chargesEnabled: account.charges_enabled,
            payoutsEnabled: account.payouts_enabled,
            requirementsPending: account.requirements?.currently_due?.length > 0,
            requirementsCurrentlyDue: account.requirements?.currently_due || [],
            detailsSubmitted: account.details_submitted,
            balance: account.balance
          };
        } catch (error) {
          console.error('Error retrieving Stripe account:', error);
        }
      }

      // Get subscription information
      const subscriptionData = stylistData?.subscription || null;
      
      // Return the combined status
      return res.status(200).json({
        status: stylistData?.stripeAccountStatus || 'not_created',
        subscription: subscriptionData,
        details: accountDetails,
        statusChanged,
        priceInfo: {
          amount: 1999, // $19.99 in cents
          currency: 'usd',
          interval: 'month'
        }
      });
    } catch (error) {
      console.error('Error checking account status:', error);
      return res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  }
);



// Get payment details
app.get(
  '/payment-details',
  cors({ origin: true }),
  async (req: Request, res: Response) => {
    try {
      // Verify authentication
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const idToken = authHeader.split('Bearer ')[1];
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const userId = decodedToken.uid;
      
      const sessionId = req.query.sessionId as string;
      
      if (!sessionId) {
        return res.status(400).json({ error: 'Session ID is required' });
      }

      // Get the session from Stripe
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      
      // Verify that this session belongs to the authenticated user
      if (session.metadata?.userId !== userId) {
        return res.status(403).json({ error: 'Unauthorized access to payment data' });
      }

      // Get the payment from Firestore
      const paymentsQuery = await db
        .collection('payments')
        .where('stripeSessionId', '==', sessionId)
        .get();

      if (paymentsQuery.empty) {
        return res.status(404).json({ error: 'Payment not found' });
      }

      const paymentDoc = paymentsQuery.docs[0];
      const paymentData = paymentDoc.data();
      
      // Return the payment details
      return res.status(200).json({
        id: paymentDoc.id,
        amount: paymentData.amount,
        description: paymentData.serviceDescription,
        status: paymentData.status,
        createdAt: paymentData.createdAt,
        completedAt: paymentData.completedAt
      });
    } catch (error) {
      console.error('Error getting payment details:', error);
      return res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  }
);



// Export the Express app as a Firebase Function
export const api = functions.https.onRequest(app);
