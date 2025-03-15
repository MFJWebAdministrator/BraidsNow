// Load environment variables from .env file
require('dotenv').config();

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });
const express = require('express');
const app = express();

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// Initialize Stripe with your secret key
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Access environment variables
const priceId = process.env.STRIPE_PRICE_ID;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Middleware
app.use(cors);
app.use(express.json());

// Create checkout session for subscription (Express endpoint)
app.post("/create-checkout-session", async (req, res) => {
  try {
    const { userId, email, successUrl, cancelUrl } = req.body;
    
    if (!userId || !email) {
      return res.status(400).json({ error: "Missing required parameters" });
    }
    
    // Use environment variable or fallback to a default price ID
    const subscriptionPriceId = priceId || "price_1R2y3eJLOzBZfrz5wv6XYs8O";

    // Check if user already exists in Stripe
    const stylistRef = db.collection("stylists").doc(userId);
    const stylistDoc = await stylistRef.get();
    
    let stripeCustomerId;
    
    if (!stylistDoc.exists || !stylistDoc.data().stripeCustomerId) {
      // Create a new customer in Stripe
      const customer = await stripe.customers.create({ 
        email,
        metadata: { userId }
      });
      
      // Update or create the stylist document
      await stylistRef.set({
        email,
        stripeCustomerId: customer.id,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
      
      stripeCustomerId = customer.id;
    } else {
      stripeCustomerId = stylistDoc.data().stripeCustomerId;
    }

    // Create checkout session with proper error handling
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      customer: stripeCustomerId,
      line_items: [{ price: subscriptionPriceId, quantity: 1 }],
      success_url: successUrl || `${req.headers.origin}/dashboard/stylist/payments?success=true`,
      cancel_url: cancelUrl || `${req.headers.origin}/dashboard/stylist/payments?canceled=true`,
      metadata: { userId },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
    });

    return res.status(200).json({ sessionId: session.id });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return res.status(500).json({ error: error.message });
  }
});

// Create Connect account (Express endpoint)
app.post("/create-connect-account", async (req, res) => {
  try {
    const { userId, email, origin } = req.body;
    
    if (!userId || !email || !origin) {
      return res.status(400).json({ error: "Missing required parameters" });
    }
    
    // Get the stylist document
    const stylistRef = db.collection("stylists").doc(userId);
    const stylistDoc = await stylistRef.get();
    
    if (!stylistDoc.exists) {
      return res.status(404).json({ error: "Stylist not found" });
    }
    
    // Check if subscription is active
    const stylistData = stylistDoc.data();
    if (!stylistData.subscription || stylistData.subscription.status !== 'active') {
      return res.status(400).json({ error: "Active subscription required to create Connect account" });
    }
    
    // Create a Connect account if not already created
    let accountId = stylistData.stripeAccountId;
    
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
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
        stripeAccountStatus: "pending",
        stripeAccountCreatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
    
    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${origin}/dashboard/stylist/payments?refresh=true`,
      return_url: `${origin}/dashboard/stylist/payments?success=true`,
      type: "account_onboarding",
    });

    return res.status(200).json({ url: accountLink.url });
  } catch (error) {
    console.error("Error creating Connect account:", error);
    return res.status(500).json({ error: error.message });
  }
});

// Check account status (Express endpoint)
app.post("/check-account-status", async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }
    
    const stylistDoc = await db.collection("stylists").doc(userId).get();
    if (!stylistDoc.exists) {
      return res.status(404).json({ error: "Stylist not found" });
    }
    
    const stylistData = stylistDoc.data();
    
    if (!stylistData.stripeAccountId) {
      return res.json({ status: "not_created" });
    }
    
    // Get the latest account details from Stripe
    const account = await stripe.accounts.retrieve(stylistData.stripeAccountId);
    
    // Update the account status in Firestore
    const accountStatus = account.charges_enabled ? "active" : "pending";
    
    if (accountStatus !== stylistData.stripeAccountStatus) {
      await stylistDoc.ref.update({
        stripeAccountStatus: accountStatus,
        stripeAccountUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
    
    return res.json({
      status: accountStatus,
      details: {
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        requirementsDisabled: account.requirements.disabled,
        requirementsPending: account.requirements.pending_verification,
        requirementsCurrentlyDue: account.requirements.currently_due,
      }
    });
  } catch (error) {
    console.error("Error checking account status:", error);
    return res.status(500).json({ error: error.message });
  }
});

// Webhook handler for Stripe events
app.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.rawBody || req.body, sig, webhookSecret);
  } catch (err) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  try {
    switch (event.type) {
      case "checkout.session.completed":
        const session = event.data.object;
        
        // Get the customer ID and user ID
        const customerId = session.customer;
        const userId = session.metadata.userId;
        
        if (userId) {
          // Get subscription details
          const subscription = await stripe.subscriptions.retrieve(session.subscription);
          
          // Update the stylist document with subscription details
          await db.collection("stylists").doc(userId).update({
            subscription: {
              id: subscription.id,
              status: subscription.status,
              currentPeriodStart: admin.firestore.Timestamp.fromMillis(subscription.current_period_start * 1000),
              currentPeriodEnd: admin.firestore.Timestamp.fromMillis(subscription.current_period_end * 1000),
              priceId: subscription.items.data[0].price.id,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            }
          });
        }
        break;
        
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        const subscription = event.data.object;
        
        // Find the user with this subscription
        const subscriptionQuery = await db.collection("stylists")
          .where("subscription.id", "==", subscription.id)
          .get();
        
        if (!subscriptionQuery.empty) {
          const stylistDoc = subscriptionQuery.docs[0];
          
          await stylistDoc.ref.update({
            subscription: {
              id: subscription.id,
              status: subscription.status,
              currentPeriodStart: admin.firestore.Timestamp.fromMillis(subscription.current_period_start * 1000),
              currentPeriodEnd: admin.firestore.Timestamp.fromMillis(subscription.current_period_end * 1000),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            }
          });
        }
        break;
        
      case "account.updated":
        const account = event.data.object;
        const accountUserId = account.metadata.userId;
        
        if (accountUserId) {
          const accountStatus = account.charges_enabled ? "active" : "pending";
          
          await db.collection("stylists").doc(accountUserId).update({
            stripeAccountStatus: accountStatus,
            stripeAccountUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
        break;
    }

    res.json({ received: true });
  } catch (error) {
    console.error(`Error processing webhook: ${error.message}`);
    return res.status(500).send(`Webhook processing error: ${error.message}`);
  }
});

// Export the Express app as a Firebase Function
exports.api = functions.https.onRequest(app);

// Create callable functions for client-side integration
exports.createCheckoutSession = functions.https.onCall(async (data, context) => {
  // Ensure user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');
  }

  const { userId, email, successUrl, cancelUrl } = data;
  
  if (!userId || !email) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required parameters');
  }
  
  try {
    // Use environment variable or fallback to a default price ID
    const subscriptionPriceId = priceId || "price_1R2y3eJLOzBZfrz5wv6XYs8O";

    // Check if user already exists in Stripe
    const stylistRef = db.collection("stylists").doc(userId);
    const stylistDoc = await stylistRef.get();
    
    let stripeCustomerId;
    
    if (!stylistDoc.exists || !stylistDoc.data().stripeCustomerId) {
      // Create a new customer in Stripe
      const customer = await stripe.customers.create({ 
        email,
        metadata: { userId }
      });
      
      // Update or create the stylist document
      await stylistRef.set({
        email,
        stripeCustomerId: customer.id,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
      
      stripeCustomerId = customer.id;
    } else {
      stripeCustomerId = stylistDoc.data().stripeCustomerId;
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      customer: stripeCustomerId,
      line_items: [{ price: subscriptionPriceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { userId },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
    });

    return { sessionId: session.id };
  } catch (error) {
    console.error("Error creating checkout session:", error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

exports.createConnectAccount = functions.https.onCall(async (data, context) => {
  // Ensure user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');
  }

  const { userId, email, origin } = data;
  
  if (!userId || !email || !origin) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required parameters');
  }
  
  try {
    // Get the stylist document
    const stylistRef = db.collection("stylists").doc(userId);
    const stylistDoc = await stylistRef.get();
    
    if (!stylistDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Stylist not found');
    }
    
    // Check if subscription is active
    const stylistData = stylistDoc.data();
    if (!stylistData.subscription || stylistData.subscription.status !== 'active') {
      throw new functions.https.HttpsError('failed-precondition', 'Active subscription required to create Connect account');
    }
    
    // Create a Connect account if not already created
    let accountId = stylistData.stripeAccountId;
    
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
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
        stripeAccountStatus: "pending",
        stripeAccountCreatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
    
    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${origin}/dashboard/stylist/payments?refresh=true`,
      return_url: `${origin}/dashboard/stylist/payments?success=true`,
      type: "account_onboarding",
    });

    return { url: accountLink.url };
  } catch (error) {
    console.error("Error creating Connect account:", error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

exports.checkAccountStatus = functions.https.onCall(async (data, context) => {
  // Ensure user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');
  }

  const { userId } = data;
  
  if (!userId) {
    throw new functions.https.HttpsError('invalid-argument', 'User ID is required');
  }
  
  try {
    const stylistDoc = await db.collection("stylists").doc(userId).get();
    if (!stylistDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Stylist not found');
    }
    
    const stylistData = stylistDoc.data();
    
    if (!stylistData.stripeAccountId) {
      return { status: "not_created", subscription: stylistData.subscription || null };
    }
    
    // Get the latest account details from Stripe
    const account = await stripe.accounts.retrieve(stylistData.stripeAccountId);
    
    // Update the account status in Firestore
    const accountStatus = account.charges_enabled ? "active" : "pending";
    
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
        requirementsDisabled: account.requirements.disabled,
        requirementsPending: account.requirements.pending_verification,
        requirementsCurrentlyDue: account.requirements.currently_due,
      }
    };
  } catch (error) {
    console.error("Error checking account status:", error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});