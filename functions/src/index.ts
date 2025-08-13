// Load environment variables from .env file
import * as dotenv from "dotenv";
dotenv.config();

import cors from "cors";
import express, { Request, Response } from "express";
import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import Stripe from "stripe";
import { EmailService } from "./services/email-service";
import { SmsService } from "./services/sms-service";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { getBookingExpiresAt } from "./utils/utils";
import { format } from "date-fns";

const app = express();

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// Initialize Stripe with your secret key

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
    apiVersion: "2022-11-15",
});

// Access environment variables
const priceId = process.env.STRIPE_PRICE_ID;
const productId = process.env.STRIPE_PRODUCT_ID || "prod_Rz6nxFBV3u49lT";
const webhookSecret =
    process.env.STRIPE_WEBHOOK_SECRET ||
    "whsec_uD5UVYJitxHFVXEpFRd7lMT66zOCnqiX";

// Function to ensure a valid price ID exists
async function ensureValidPriceId() {
    try {
        // First try to use the environment variable price ID
        if (priceId) {
            try {
                // Verify the price exists and is recurring
                const price = await stripe.prices.retrieve(priceId);
                if (price && price.recurring) {
                    console.log(
                        "Using existing price ID from environment:",
                        priceId
                    );
                    return priceId;
                }
            } catch (error) {
                console.log(
                    "Price ID from environment not found or not valid:",
                    error
                );
            }
        }

        // If we get here, we need to find or create a valid price
        // First, try to list existing recurring prices
        const prices = await stripe.prices.list({
            active: true,
            type: "recurring",
            limit: 1,
        });

        if (prices.data.length > 0) {
            console.log("Using existing recurring price:", prices.data[0].id);
            return prices.data[0].id;
        }

        // If no existing prices, create a new product and price
        let productToUse = productId;

        if (!productToUse) {
            // Create a new product if none exists
            const product = await stripe.products.create({
                name: "BraidsNow.com Professional Subscription",
                description: "Monthly subscription for professional stylists",
            });
            productToUse = product.id;
            console.log("Created new product:", productToUse);
        }

        // Create a new recurring price
        const newPrice = await stripe.prices.create({
            product: productToUse,
            unit_amount: 1999, // $19.99
            currency: "usd",
            recurring: {
                interval: "month",
            },
            metadata: {
                auto_created: "true",
            },
        });

        console.log("Created new recurring price:", newPrice.id);
        return newPrice.id;
    } catch (error) {
        console.error("Error ensuring valid price ID:", error);
        // Fallback to a hardcoded price ID as last resort
        return "price_1R58ZdJLOzBZfrz5ZZuxBFZ3";
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
const validateFirebaseIdToken = async (
    req: RequestWithRawBody,
    res: Response,
    next
) => {
    console.log("Check if request is authorized with Firebase ID token");

    if (
        (!req.headers.authorization ||
            !req.headers.authorization.startsWith("Bearer ")) &&
        !(req.cookies && req.cookies.__session)
    ) {
        console.error(
            "No Firebase ID token was passed as a Bearer token in the Authorization header.",
            "Make sure you authorize your request by providing the following HTTP header:",
            "Authorization: Bearer <Firebase ID Token>",
            'or by passing a "__session" cookie.'
        );
        res.status(403).send("Unauthorized");
        return;
    }

    let idToken;
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer ")
    ) {
        console.log('Found "Authorization" header');
        // Read the ID Token from the Authorization header.
        idToken = req.headers.authorization.split("Bearer ")[1];
    } else if (req.cookies) {
        console.log('Found "__session" cookie');
        // Read the ID Token from cookie.
        idToken = req.cookies.__session;
    } else {
        // No cookie
        res.status(403).send("Unauthorized");
        return;
    }

    try {
        const decodedIdToken = await admin.auth().verifyIdToken(idToken);
        console.log("ID Token correctly decoded", decodedIdToken);
        req.user = decodedIdToken;
        next();
        return;
    } catch (error) {
        console.error("Error while verifying Firebase ID token:", error);
        res.status(403).send("Unauthorized");
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
    "/cancel-subscription",
    validateFirebaseIdToken,
    async (
        req: RequestWithRawBody & {
            body: { userId: string };
            user?: admin.auth.DecodedIdToken;
        },
        res: Response
    ) => {
        try {
            const { userId } = req.body;

            if (!userId) {
                return res
                    .status(400)
                    .json({ error: "Missing required parameters" });
            }

            // Verify that the authenticated user is requesting their own data
            if (userId !== req.user?.uid) {
                return res
                    .status(403)
                    .json({ error: "Unauthorized access to user data" });
            }

            // Get the stylist document to find subscription ID
            const stylistRef = db.collection("stylists").doc(userId);
            const stylistDoc = await stylistRef.get();

            if (!stylistDoc.exists) {
                return res.status(404).json({ error: "Stylist not found" });
            }

            const stylistData = stylistDoc.data();

            if (!stylistData?.subscription?.id) {
                return res
                    .status(400)
                    .json({ error: "No active subscription found" });
            }

            // Cancel the subscription at period end
            const subscription = await stripe.subscriptions.update(
                stylistData.subscription.id,
                { cancel_at_period_end: true }
            );

            // Update the stylist document with cancellation info
            await stylistRef.update({
                "subscription.cancelAtPeriodEnd": true,
                "subscription.canceledAt":
                    admin.firestore.FieldValue.serverTimestamp(),
                "subscription.status": subscription.status,
                "subscription.updatedAt":
                    admin.firestore.FieldValue.serverTimestamp(),
            });

            return res.status(200).json({
                success: true,
                message:
                    "Subscription will be canceled at the end of the billing period",
                subscription: {
                    id: subscription.id,
                    status: subscription.status,
                    cancelAtPeriodEnd: subscription.cancel_at_period_end,
                    currentPeriodEnd: new Date(
                        subscription.current_period_end * 1000
                    ).toISOString(),
                },
            });
        } catch (error) {
            console.error("Error canceling subscription:", error);
            return res.status(500).json({
                error:
                    error instanceof Error
                        ? error.message
                        : "Unknown error occurred",
            });
        }
    }
);
// Update create-checkout-session endpoint
app.post(
    "/create-checkout-session",
    validateFirebaseIdToken,
    async (
        req: RequestWithRawBody & {
            body: CheckoutSessionRequest;
            user?: admin.auth.DecodedIdToken;
        },
        res: Response
    ) => {
        try {
            const { userId, email, successUrl, cancelUrl } = req.body;

            if (!userId || !email) {
                return res
                    .status(400)
                    .json({ error: "Missing required parameters" });
            }

            // Verify that the authenticated user is requesting their own data
            if (userId !== req.user?.uid) {
                return res
                    .status(403)
                    .json({ error: "Unauthorized access to user data" });
            }

            // Use environment variable or fallback to a default price ID
            const subscriptionPriceId = await ensureValidPriceId();

            // Check if user already exists in Stripe
            const stylistRef = db.collection("stylists").doc(userId);
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
                payment_method_types: ["card"],
                mode: "subscription",
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
                billing_address_collection: "required",
            });

            return res.status(200).json({ sessionId: session.id });
        } catch (error) {
            console.error("Error creating checkout session:", error);
            return res.status(500).json({
                error:
                    error instanceof Error
                        ? error.message
                        : "Unknown error occurred",
            });
        }
    }
);

// Update create-connect-account endpoint
app.post(
    "/create-connect-account",
    validateFirebaseIdToken,
    async (
        req: RequestWithRawBody & {
            body: ConnectAccountRequest;
            user?: admin.auth.DecodedIdToken;
        },
        res: Response
    ) => {
        try {
            const { userId, email, origin } = req.body;

            if (!userId || !email) {
                return res
                    .status(400)
                    .json({ error: "Missing required parameters" });
            }

            // Verify that the authenticated user is requesting their own data
            if (userId !== req.user?.uid) {
                return res
                    .status(403)
                    .json({ error: "Unauthorized access to user data" });
            }

            // Get the stylist document
            const stylistRef = db.collection("stylists").doc(userId);
            const stylistDoc = await stylistRef.get();

            if (!stylistDoc.exists) {
                return res.status(404).json({ error: "Stylist not found" });
            }

            // Check if subscription is active
            const stylistData = stylistDoc.data();
            if (
                !stylistData?.subscription ||
                stylistData.subscription.status !== "active"
            ) {
                return res.status(400).json({
                    error: "Active subscription required to create Connect account",
                });
            }

            // Create a Connect account if not already created
            let accountId = stylistData.stripeAccountId as string | undefined;

            if (!accountId) {
                const account = await stripe.accounts.create({
                    type: "express",
                    email,
                    metadata: { userId },
                    capabilities: {
                        card_payments: { requested: true },
                        transfers: { requested: true },
                    },
                    business_type: "individual",
                    business_profile: {
                        mcc: "7230", // Beauty and barber shops
                    },
                });

                // Store the account ID in Firestore
                await stylistRef.update({
                    stripeAccountId: account.id,
                    stripeAccountStatus: "pending",
                    stripeAccountCreatedAt:
                        admin.firestore.FieldValue.serverTimestamp(),
                });

                accountId = account.id;
            }

            // Validate and sanitize the origin URL
            let validatedOrigin = origin;
            if (!validatedOrigin) {
                // Default to a fallback URL if none provided
                validatedOrigin = "https://braidsnow.com";
            }

            // Ensure the origin is a valid URL
            try {
                new URL(validatedOrigin);
            } catch (error) {
                console.warn("Invalid origin URL provided:", validatedOrigin);
                // Use a fallback URL instead of failing
                validatedOrigin = "https://braidsnow.com";
            }

            // Create an account link for onboarding
            const accountLink = await stripe.accountLinks.create({
                account: accountId,
                refresh_url: `${validatedOrigin}/dashboard/stylist/payments?refresh=true`,
                return_url: `${validatedOrigin}/dashboard/stylist/payments?success=true`,
                type: "account_onboarding",
            });

            return res.status(200).json({ url: accountLink.url });
        } catch (error) {
            console.error("Error creating Connect account:", error);
            return res.status(500).json({
                error:
                    error instanceof Error
                        ? error.message
                        : "Unknown error occurred",
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
    description: string = "Payment received"
) {
    try {
        const stylistRef = db.collection("stylists").doc(stylistId);
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
                    throw new Error("Insufficient balance for withdrawal");
                }

                // Convert back to dollars for storage
                newBalance = newBalanceInCents / 100;

                const updateData: any = {
                    balance: newBalance,
                    balanceUpdatedAt:
                        admin.firestore.FieldValue.serverTimestamp(),
                };

                if (!stylistData?.balanceCreatedAt) {
                    updateData.balanceCreatedAt =
                        admin.firestore.FieldValue.serverTimestamp();
                }

                transaction.update(stylistRef, updateData);

                console.log(
                    `Updated balance for stylist ${stylistId}: ${currentBalanceInCents / 100} -> ${newBalance}`
                );
            } else {
                console.error(
                    `Stylist ${stylistId} not found when updating balance`
                );
                throw new Error("Stylist not found");
            }
        });

        // Add a balance history record
        await stylistRef.collection("balanceHistory").add({
            amount: amountInCents / 100, // Original amount in dollars
            balanceAfter: newBalance,
            type: amountInCents > 0 ? "credit" : "debit",
            description,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        return newBalance;
    } catch (error) {
        console.error("Error updating stylist balance:", error);
        throw error;
    }
}

app.post(
    "/create-payment-to-stylist",
    validateFirebaseIdToken,
    async (
        req: RequestWithRawBody & {
            body: PaymentToStylistRequest;
            user?: admin.auth.DecodedIdToken;
        },
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
                bookingData,
            } = req.body;

            // Validate required fields
            if (
                !userId ||
                !stylistId ||
                !amount ||
                !serviceDescription ||
                !bookingData
            ) {
                return res
                    .status(400)
                    .json({ error: "Missing required parameters" });
            }

            // Verify authenticated user
            if (userId !== req.user?.uid) {
                return res
                    .status(403)
                    .json({ error: "Unauthorized access to user data" });
            }

            // Get stylist data
            const stylistRef = db.collection("stylists").doc(stylistId);
            const stylistDoc = await stylistRef.get();

            if (!stylistDoc.exists) {
                return res.status(404).json({ error: "Stylist not found" });
            }

            const stylistData = stylistDoc.data();

            // Verify stylist's Stripe account
            if (
                !stylistData?.stripeAccountId ||
                stylistData.stripeAccountStatus !== "active"
            ) {
                return res.status(400).json({
                    error: "Stylist does not have an active payment account",
                });
            }

            // Get user email and handle customer creation
            const userRecord = await admin.auth().getUser(userId);
            const email = userRecord.email;

            if (!email) {
                return res.status(400).json({ error: "User email not found" });
            }

            // Get or create Stripe customer
            const clientRef = db.collection("clients").doc(userId);
            const clientDoc = await clientRef.get();
            const clientData = clientDoc.data();

            let stripeCustomerId: string;

            if (!clientDoc.exists || !clientData?.stripeCustomerId) {
                const customer = await stripe.customers.create({
                    email,
                    metadata: { userId },
                });

                await clientRef.set(
                    {
                        email,
                        stripeCustomerId: customer.id,
                        createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    },
                    { merge: true }
                );

                stripeCustomerId = customer.id;
            } else {
                stripeCustomerId = clientData.stripeCustomerId;
            }

            // Generate booking ID and prepare metadata
            const pendingBookingId = db.collection("bookings").doc().id;

            const metadata: Record<string, string> = {
                userId,
                stylistId,
                serviceDescription,
                pendingBookingId,
                paymentType: bookingData.paymentType,
                totalAmount: bookingData.totalAmount.toString(),
                depositAmount: bookingData.depositAmount?.toString() || "0",
            };

            // Store pending booking
            await db
                .collection("pendingBookings")
                .doc(pendingBookingId)
                .set({
                    bookingData,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(), // TODO
                    expiresAt: admin.firestore.Timestamp.fromMillis(
                        Date.now() + 3600000
                    ),
                });

            // Create Stripe checkout session
            const session = await stripe.checkout.sessions.create({
                payment_method_types: ["card"],
                mode: "payment",
                customer: stripeCustomerId,
                payment_intent_data: {
                    // transfer_data: {
                    //     destination: stylistData.stripeAccountId,
                    // },
                    metadata,
                    // application_fee_amount: amount * 0.05, // 5% fee,
                    capture_method: "manual",
                },
                line_items: [
                    {
                        price_data: {
                            currency: "usd",
                            product_data: {
                                name: `${bookingData.paymentType === "deposit" ? "Deposit for" : "Full payment for"} ${serviceDescription}`,
                                metadata,
                            },
                            unit_amount: amount,
                        },
                        quantity: 1,
                    },
                ],
                success_url: successUrl
                    ? `${successUrl}?session_id={CHECKOUT_SESSION_ID}&booking_id=${pendingBookingId}`
                    : `${req.headers.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}&booking_id=${pendingBookingId}`,
                cancel_url: cancelUrl
                    ? `${cancelUrl}?booking_id=${pendingBookingId}`
                    : `${req.headers.origin}/payment-canceled?booking_id=${pendingBookingId}`,
                metadata,
            });

            console.log("session in create-payment-to-stylist", session);

            // Create payment record
            const paymentRef = await db.collection("payments").add({
                clientId: userId,
                stylistId,
                amount,
                serviceDescription,
                status: "pending",
                stripeSessionId: session.id,
                stripePaymentIntentId: session.payment_intent,
                pendingBookingId,
                bookingData,
                paymentType: bookingData.paymentType,
                createdAt: admin.firestore.FieldValue.serverTimestamp(), // TODO
            });

            return res.status(200).json({
                sessionId: session.id,
                url: session.url,
                paymentId: paymentRef.id,
                pendingBookingId,
            });
        } catch (error) {
            console.error("Error creating payment to stylist:", error);
            return res.status(500).json({
                error:
                    error instanceof Error
                        ? error.message
                        : "Unknown error occurred",
            });
        }
    }
);

// Add a new endpoint to create a booking without payment
app.post(
    "/create-booking",
    validateFirebaseIdToken,
    async (
        req: RequestWithRawBody & { user?: admin.auth.DecodedIdToken },
        res: Response
    ) => {
        try {
            const bookingData = req.body;

            // Validate booking data
            if (
                !bookingData.stylistId ||
                !bookingData.clientId ||
                !bookingData.date ||
                !bookingData.time
            ) {
                return res
                    .status(400)
                    .json({ error: "Missing required booking information" });
            }

            // Verify that the authenticated user is the client
            if (bookingData.clientId !== req.user?.uid) {
                return res
                    .status(403)
                    .json({ error: "Unauthorized access to user data" });
            }

            // Fetch stylist's schedule from Firestore
            const scheduleSnap = await db
                .collection("stylists")
                .doc(bookingData.stylistId)
                .collection("settings")
                .doc("schedule")
                .get();
            if (!scheduleSnap.exists) {
                return res
                    .status(400)
                    .json({ error: "Stylist schedule not found" });
            }
            const schedule = scheduleSnap.data();
            // Determine day of week
            const bookingDate = new Date(bookingData.date);
            const dayOfWeek = bookingDate
                .toLocaleDateString("en-US", { weekday: "long" })
                .toLowerCase();
            const workHours = schedule.workHours[dayOfWeek];
            if (!workHours || !workHours.isEnabled) {
                return res
                    .status(400)
                    .json({ error: "Stylist is not available on this day" });
            }
            // Parse booking start time
            const [hour, minute] = bookingData.time.split(":").map(Number);
            const start = new Date(bookingDate);
            start.setHours(hour, minute, 0, 0);

            // Calculate total service duration (minutes)
            const duration =
                (bookingData.service?.duration?.hours || 0) * 60 +
                (bookingData.service?.duration?.minutes || 0);
            const bufferBefore = schedule.bufferTime?.before || 0;
            const bufferAfter = schedule.bufferTime?.after || 0;
            const totalDuration = duration + bufferBefore + bufferAfter;

            // Calculate end time
            const end = new Date(start.getTime() + totalDuration * 60000);
            // Stylist closing time
            const closing = new Date(bookingDate);
            closing.setHours(workHours.end.hour, workHours.end.minute, 0, 0);
            // Prevent overtime
            if (end > closing) {
                return res.status(400).json({
                    error: "This service will run past the stylist's available hours. Please select an earlier time.",
                });
            }

            // Create the booking
            const bookingRef = db.collection("bookings").doc();
            const expiresAt = getBookingExpiresAt(
                bookingData.date,
                bookingData.time
            );

            await bookingRef.set({
                ...bookingData,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                expiresAt,
            });

            // Notify the stylist about the new booking
            await db.collection("notifications").add({
                userId: bookingData.stylistId,
                type: "new_booking",
                title: "New Booking",
                message: `You have a new booking for ${bookingData.serviceName} on ${bookingData.date} at ${bookingData.time}`,
                read: false,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                data: {
                    bookingId: bookingRef.id,
                },
            });

            return res.status(200).json({
                success: true,
                bookingId: bookingRef.id,
            });
        } catch (error) {
            console.error("Error creating booking:", error);
            return res.status(500).json({
                error:
                    error instanceof Error
                        ? error.message
                        : "Unknown error occurred",
            });
        }
    }
);

// Add a new endpoint to accept a booking
app.post(
    "/accept-booking",
    validateFirebaseIdToken,
    async (req: RequestWithRawBody, res: Response) => {
        try {
            const { bookingId } = req.body;
            const userId = req.user?.uid;

            if (!bookingId) {
                return res
                    .status(400)
                    .json({ error: "Booking ID is required" });
            }

            if (!userId) {
                return res
                    .status(401)
                    .json({ error: "User not authenticated" });
            }

            // Check if the user is a stylist
            const stylistDoc = await db
                .collection("stylists")
                .doc(userId)
                .get();

            if (!stylistDoc.exists) {
                return res
                    .status(403)
                    .json({ error: "Only stylists can accept bookings" });
            }

            // Get the booking document
            const bookingRef = db.collection("bookings").doc(bookingId);
            const bookingDoc = await bookingRef.get();

            if (!bookingDoc.exists) {
                return res.status(404).json({ error: "Booking not found" });
            }

            const bookingData = bookingDoc.data();

            // Verify that the booking belongs to this stylist
            if (bookingData?.stylistId !== userId) {
                return res.status(403).json({
                    error: "You can only accept bookings assigned to you",
                });
            }

            // Check if the booking is in pending status
            if (bookingData?.status !== "pending") {
                return res.status(400).json({
                    error: "Only pending bookings can be accepted",
                    currentStatus: bookingData?.status,
                });
            }

            // Check if the booking has a payment ID for capture
            if (!bookingData?.paymentId) {
                return res.status(400).json({
                    error: "No payment found for this booking",
                    bookingId: bookingId,
                });
            }

            try {
                console.log(
                    `Payment captured successfully for booking ${bookingId}:`
                );

                // Update payment document status
                const paymentRef = await db
                    .collection("payments")
                    .where("bookingId", "==", bookingId)
                    .get();

                if (paymentRef.empty) {
                    return res.status(400).json({
                        error: "Payment document not found",
                        bookingId: bookingId,
                    });
                }

                const paymentDoc = paymentRef.docs[0];
                if (!paymentDoc.exists) {
                    return res.status(400).json({
                        error: "Payment not found",
                        bookingId: bookingId,
                    });
                }

                // Capture the authorized payment from Stripe
                const paymentIntent = await stripe.paymentIntents.capture(
                    bookingData.paymentId
                );

                // Update the booking status to confirmed
                await bookingRef.update({
                    status: "confirmed",
                    paymentStatus: "paid",
                    acceptedAt: admin.firestore.FieldValue.serverTimestamp(),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    paymentCapturedAt:
                        admin.firestore.FieldValue.serverTimestamp(),
                    stripeCaptureId: paymentIntent.latest_charge,
                    expiresAt: null,
                });

                const date = format(bookingData.dateTime, "yyyy-MM-dd");
                const time = format(bookingData.dateTime, "HH:mm");

                await paymentRef.docs[0].ref.update({
                    status: "paid",
                    completedAt: admin.firestore.FieldValue.serverTimestamp(),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    stripeCaptureId: paymentIntent.latest_charge,
                });

                // Create notification for the client about booking acceptance
                await db.collection("notifications").add({
                    userId: bookingData.clientId,
                    type: "booking_accepted",
                    title: "Booking Accepted",
                    message: `Your booking for ${bookingData.serviceName} on ${bookingData.date} at ${bookingData.time} has been accepted by ${bookingData.stylistName}.`,
                    read: false,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    data: {
                        bookingId: bookingId,
                        serviceName: bookingData.serviceName,
                        date,
                        time,
                        stylistName: bookingData.stylistName,
                    },
                });

                // Create notification for the stylist about booking acceptance
                await db.collection("notifications").add({
                    userId: userId,
                    type: "booking_accepted_stylist",
                    title: "Booking Accepted",
                    message: `You have accepted the booking for ${bookingData.serviceName} on ${bookingData.date} at ${bookingData.time} with ${bookingData.clientName}.`,
                    read: false,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    data: {
                        bookingId: bookingId,
                        serviceName: bookingData.serviceName,
                        date,
                        time,
                        clientName: bookingData.clientName,
                    },
                });

                // Send email/sms notification
                setTimeout(async () => {
                    try {
                        await EmailService.sendAppointmentConfirmationClient({
                            clientName: bookingData.clientName,
                            clientEmail: bookingData.clientEmail,
                            stylistName: bookingData.stylistName,
                            appointmentDate: date,
                            appointmentTime: time + " UTC",
                            serviceName: bookingData.serviceName,
                        });
                    } catch (error) {
                        console.log(
                            "Error sending appointment confirmation email to client: ",
                            error
                        );
                    }
                }, 0);

                setTimeout(async () => {
                    try {
                        await SmsService.sendAppointmentAcceptedClientSms({
                            clientName: bookingData.clientName,
                            phoneNumber: bookingData.clientPhone,
                            stylistName: bookingData.stylistName,
                            appointmentDate: date,
                            appointmentTime: time + " UTC",
                            serviceName: bookingData.serviceName,
                        });
                    } catch (error) {
                        console.error(
                            "Error sending appointment accepted sms to client:",
                            error
                        );
                    }
                }, 0);

                console.log(
                    `Booking ${bookingId} accepted by stylist ${userId}`
                );

                return res.status(200).json({
                    success: true,
                    message:
                        "Payment captured and booking accepted successfully",
                    bookingId: bookingId,
                    paymentIntentId: paymentIntent.id,
                    captureId: paymentIntent.latest_charge,
                });
            } catch (stripeError) {
                console.error(
                    "Stripe capture failed for booking:",
                    bookingId,
                    stripeError
                );

                return res.status(400).json({
                    error: "Failed to capture payment",
                    details:
                        stripeError instanceof Error
                            ? stripeError.message
                            : "Unknown Stripe error",
                    bookingId: bookingId,
                });
            }
        } catch (error) {
            console.error("Error accepting booking:", error);
            return res.status(500).json({
                error:
                    error instanceof Error
                        ? error.message
                        : "Unknown error occurred",
            });
        }
    }
);

// Add a new endpoint to reject a booking
app.post(
    "/reject-booking",
    validateFirebaseIdToken,
    async (req: RequestWithRawBody, res: Response) => {
        try {
            const { bookingId } = req.body;
            const userId = req.user?.uid;

            if (!bookingId) {
                return res
                    .status(400)
                    .json({ error: "Booking ID is required" });
            }

            if (!userId) {
                return res
                    .status(401)
                    .json({ error: "User not authenticated" });
            }

            // Check if the user is a stylist
            const stylistDoc = await db
                .collection("stylists")
                .doc(userId)
                .get();
            if (!stylistDoc.exists) {
                return res
                    .status(403)
                    .json({ error: "Only stylists can reject bookings" });
            }

            // Get the booking document
            const bookingRef = db.collection("bookings").doc(bookingId);
            const bookingDoc = await bookingRef.get();

            if (!bookingDoc.exists) {
                return res.status(404).json({ error: "Booking not found" });
            }

            const bookingData = bookingDoc.data();

            // Verify that the booking belongs to this stylist
            if (bookingData?.stylistId !== userId) {
                return res.status(403).json({
                    error: "You can only reject bookings assigned to you",
                });
            }

            // Check if the booking is in pending status
            if (bookingData?.status !== "pending") {
                return res.status(400).json({
                    error: "Only pending bookings can be rejected",
                    currentStatus: bookingData?.status,
                });
            }

            // Check if the booking has a payment ID for cancellation
            if (!bookingData?.paymentId) {
                return res.status(400).json({
                    error: "No payment found for this booking",
                    bookingId: bookingId,
                });
            }

            try {
                console.log(
                    `Payment cancelled successfully for booking ${bookingId}:`
                );

                // Update payment document status
                const paymentRef = await db
                    .collection("payments")
                    .where("bookingId", "==", bookingId)
                    .get();

                if (paymentRef.empty) {
                    return res.status(400).json({
                        error: "Payment document not found",
                        bookingId: bookingId,
                    });
                }

                // Cancel the payment intent in Stripe (this will release the hold)
                const paymentIntent = await stripe.paymentIntents.cancel(
                    bookingData.paymentId
                );

                await paymentRef.docs[0].ref.update({
                    status: "cancelled",
                    cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    stripeCancellationId: paymentIntent.latest_charge,
                    expiresAt: null,
                });

                const date = format(bookingData.dateTime, "yyyy-MM-dd");
                const time = format(bookingData.dateTime, "HH:mm");

                // Update the booking status to rejected
                await bookingRef.update({
                    status: "rejected",
                    paymentStatus: "cancelled",
                    rejectedAt: admin.firestore.FieldValue.serverTimestamp(),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    paymentCancelledAt:
                        admin.firestore.FieldValue.serverTimestamp(),
                    stripeCancellationId: paymentIntent.latest_charge,
                });

                // Create notification for the client about booking rejection
                await db.collection("notifications").add({
                    userId: bookingData.clientId,
                    type: "booking_rejected",
                    title: "Booking Rejected",
                    message: `Your booking for ${bookingData.serviceName} on ${bookingData.date} at ${bookingData.time} has been rejected by ${bookingData.stylistName}.`,
                    read: false,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    data: {
                        bookingId: bookingId,
                        serviceName: bookingData.serviceName,
                        date,
                        time,
                        stylistName: bookingData.stylistName,
                    },
                });

                // Create notification for the stylist about booking rejection
                await db.collection("notifications").add({
                    userId: userId,
                    type: "booking_rejected_stylist",
                    title: "Booking Rejected",
                    message: `You have rejected the booking for ${bookingData.serviceName} on ${bookingData.date} at ${bookingData.time} with ${bookingData.clientName}.`,
                    read: false,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    data: {
                        bookingId: bookingId,
                        serviceName: bookingData.serviceName,
                        date,
                        time,
                        clientName: bookingData.clientName,
                    },
                });

                // Send email/sms notification to client
                setTimeout(async () => {
                    try {
                        await EmailService.sendAppointmentDeniedClient({
                            clientEmail: bookingData.clientEmail,
                            clientName: bookingData.clientName,
                            serviceName: bookingData.serviceName,
                            stylistName: bookingData.stylistName,
                            appointmentDate: date,
                            appointmentTime: time + " UTC",
                        });
                    } catch (error) {
                        console.log(
                            "Error sending appointment rejected email to client: ",
                            error
                        );
                    }
                }, 0);

                setTimeout(async () => {
                    try {
                        await SmsService.sendAppointmentRejectedClientSms({
                            clientName: bookingData.clientName,
                            phoneNumber: bookingData.clientPhone,
                            stylistName: bookingData.stylistName,
                            appointmentDate: date,
                            appointmentTime: time + " UTC",
                            serviceName: bookingData.serviceName,
                        });
                    } catch (error) {
                        console.error(
                            "Error sending appointment rejected sms to client:",
                            error
                        );
                    }
                }, 0);

                console.log(
                    `Booking ${bookingId} rejected by stylist ${userId}`
                );

                return res.status(200).json({
                    success: true,
                    message:
                        "Payment cancelled and booking rejected successfully",
                    bookingId: bookingId,
                    paymentIntentId: paymentIntent.id,
                    cancellationId: paymentIntent.latest_charge,
                });
            } catch (stripeError) {
                console.error(
                    "Stripe cancellation failed for booking:",
                    bookingId,
                    stripeError
                );

                return res.status(400).json({
                    error: "Failed to cancel payment",
                    details:
                        stripeError instanceof Error
                            ? stripeError.message
                            : "Unknown Stripe error",
                    bookingId: bookingId,
                });
            }
        } catch (error) {
            console.error("Error rejecting booking:", error);
            return res.status(500).json({
                error:
                    error instanceof Error
                        ? error.message
                        : "Unknown error occurred",
            });
        }
    }
);

// Add a new endpoint to cancel a booking by client
app.post(
    "/cancel-booking-by-client",
    validateFirebaseIdToken,
    async (req: RequestWithRawBody, res: Response) => {
        try {
            const { bookingId } = req.body;
            const userId = req.user?.uid;

            if (!bookingId) {
                return res
                    .status(400)
                    .json({ error: "Booking ID is required" });
            }

            if (!userId) {
                return res
                    .status(401)
                    .json({ error: "User not authenticated" });
            }

            // Get the booking document
            const bookingRef = db.collection("bookings").doc(bookingId);
            const bookingDoc = await bookingRef.get();

            if (!bookingDoc.exists) {
                return res.status(404).json({ error: "Booking not found" });
            }

            const bookingData = bookingDoc.data();

            // Step 1: Verify Appointment Ownership
            if (bookingData?.clientId !== userId) {
                return res.status(403).json({
                    error: "You can only cancel your own appointments",
                });
            }

            // Step 2: Check if booking is already cancelled
            // only for confirmed bookings status
            if (bookingData?.status !== "confirmed") {
                return res.status(400).json({
                    error: "This booking cannot be cancelled in its current status",
                });
            }

            // Step 3: Check Time Constraint - Only allow cancellation if current time is before appointment start time
            const appointmentDateTime = new Date(
                `${bookingData.date}T${bookingData.time}`
            );
            const currentTime = admin.firestore.Timestamp.now();
            console.log("currentDateTime", currentTime.toDate());

            if (
                currentTime.toDate().getTime() >= appointmentDateTime.getTime()
            ) {
                return res.status(400).json({
                    error: "Cannot cancel appointments that have already started or passed",
                });
            }

            // Step 4: Calculate Refund
            const paymentAmount = bookingData.paymentAmount;
            const cancellationFeePercentage = 0.04; // 4%
            const cancellationFee = paymentAmount * cancellationFeePercentage;
            const refundAmount = paymentAmount - cancellationFee;

            // Step 5: Process Refund through Stripe
            let refundResult = null;
            const paymentIntentId = bookingData.paymentId;

            if (paymentIntentId) {
                try {
                    // Get the payment intent to check its status
                    const paymentIntent =
                        await stripe.paymentIntents.retrieve(paymentIntentId);

                    if (paymentIntent.status === "succeeded") {
                        // Payment was captured, create a refund
                        refundResult = await stripe.refunds.create({
                            payment_intent: paymentIntentId,
                            amount: refundAmount * 100, // Convert to cents
                            reason: "requested_by_customer",
                            metadata: {
                                bookingId: bookingId,
                                cancellationFee: cancellationFee * 100,
                                refundAmount: refundAmount * 100,
                            },
                        });
                    } else if (paymentIntent.status === "requires_capture") {
                        // Payment not yet captured, cancel the payment intent
                        await stripe.paymentIntents.cancel(paymentIntentId);
                        refundResult = { status: "cancelled" };
                    } else {
                        console.log(
                            `Payment cannot be refunded in its current state: ${paymentIntent.status}`
                        );
                        return res.status(400).json({
                            error: `Payment cannot be refunded in its current state`,
                        });
                    }
                } catch (error) {
                    console.error("Error processing refund:", error);
                    return res.status(500).json({
                        error: "Failed to process refund. Please contact support.",
                    });
                }
            }

            // Step 6: Update Booking Status
            await bookingRef.update({
                status: "cancelled",
                cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                paymentStatus: "refunded",
                cancelledBy: "client",
                refundAmount: refundAmount,
                refundId: refundResult?.id || null,
            });

            // Step 7: Update Payment Document
            if (paymentIntentId) {
                const paymentQuery = await db
                    .collection("payments")
                    .where("bookingId", "==", bookingId)
                    .get();

                if (!paymentQuery.empty) {
                    const paymentDoc = paymentQuery.docs[0];
                    await paymentDoc.ref.update({
                        status: "refunded",
                        cancelledBy: "client",
                        cancelledAt:
                            admin.firestore.FieldValue.serverTimestamp(),
                        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                        refundAmount: refundAmount,
                        refundId: refundResult?.id || null,
                    });
                }
            }

            // Step 8: Log the Refund & Fee
            await db.collection("refunds").add({
                bookingId: bookingId,
                clientId: userId,
                stylistId: bookingData.stylistId,
                originalPaidAmount: paymentAmount,
                cancellationFee: cancellationFee,
                refundAmount: refundAmount,
                refundStripeId: refundResult?.id || null,
                reason: "client_cancellation",
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            const date = format(bookingData.dateTime, "yyyy-MM-dd");
            const time = format(bookingData.dateTime, "HH:mm") + " UTC";

            // Send email to client
            setTimeout(async () => {
                try {
                    await EmailService.sendAppointmentCancelledEmailForClient({
                        clientName: bookingData.clientName,
                        clientEmail: bookingData.clientEmail,
                        stylistName: bookingData.stylistName,
                        serviceName: bookingData.serviceName,
                        appointmentDate: date,
                        appointmentTime: time,
                    });
                } catch (error) {
                    console.error(
                        "Error sending cancellation email to client:",
                        error
                    );
                }
            }, 0);

            // Send email to stylist
            setTimeout(async () => {
                try {
                    await EmailService.sendAppointmentCancelledEmailForStylist({
                        stylistName: bookingData.stylistName || "Stylist",
                        stylistEmail: bookingData.stylistEmail,
                        clientName: bookingData.clientName || "Client",
                        serviceName: bookingData.serviceName,
                        appointmentDate: date,
                        appointmentTime: time,
                    });
                } catch (error) {
                    console.error(
                        "Error sending cancellation email to stylist:",
                        error
                    );
                }
            }, 0);

            // Send SMS to stylist
            setTimeout(async () => {
                try {
                    await SmsService.sendAppointmentCancelledSmsForStylist({
                        stylistName: bookingData.stylistName || "Stylist",
                        phoneNumber: bookingData.stylistPhone,
                        clientName: bookingData.clientName || "Client",
                        serviceName: bookingData.serviceName,
                        appointmentDate: bookingData.date,
                        appointmentTime: bookingData.time,
                    });
                } catch (error) {
                    console.error(
                        "Error sending cancellation SMS to stylist:",
                        error
                    );
                }
            }, 0);

            // Send SMS to client
            setTimeout(async () => {
                try {
                    await SmsService.sendAppointmentCancelledSmsForClient({
                        clientName: bookingData.clientName || "Client",
                        phoneNumber: bookingData.clientPhone,
                        stylistName: bookingData.stylistName || "Stylist",
                        serviceName: bookingData.serviceName,
                        appointmentDate: date,
                        appointmentTime: time,
                    });
                } catch (error) {
                    console.error(
                        "Error sending cancellation SMS to client:",
                        error
                    );
                }
            }, 0);

            // TODO: send push notification to stylist and client

            return res.status(200).json({
                success: true,
                message: "Booking cancelled successfully",
                refundAmount: refundAmount,
                cancellationFee: cancellationFee,
                refundId: refundResult?.id || null,
            });
        } catch (error) {
            console.error("Error cancelling booking:", error);
            return res.status(500).json({
                error:
                    error instanceof Error
                        ? error.message
                        : "Unknown error occurred",
            });
        }
    }
);

// Add a new endpoint to cancel a booking by stylist
app.post(
    "/cancel-booking-by-stylist",
    validateFirebaseIdToken,
    async (req: RequestWithRawBody, res: Response) => {
        try {
            const { bookingId } = req.body;
            const userId = req.user?.uid;

            if (!bookingId) {
                return res
                    .status(400)
                    .json({ error: "Booking ID is required" });
            }

            if (!userId) {
                return res
                    .status(401)
                    .json({ error: "User not authenticated" });
            }

            // Get the booking document
            const bookingRef = db.collection("bookings").doc(bookingId);
            const bookingDoc = await bookingRef.get();

            if (!bookingDoc.exists) {
                return res.status(404).json({ error: "Booking not found" });
            }

            const bookingData = bookingDoc.data();

            // Step 1: Verify Stylist Ownership
            if (bookingData?.stylistId !== userId) {
                return res.status(403).json({
                    error: "You can only cancel appointments assigned to you",
                });
            }

            // Step 2: Check if booking is confirmed
            if (bookingData?.status !== "confirmed") {
                return res.status(400).json({
                    error: "This booking cannot be cancelled in its current status",
                });
            }

            // Step 3: Check Time Constraint - Only allow cancellation if current time is before appointment start time
            const appointmentDateTime = new Date(
                `${bookingData.date}T${bookingData.time}`
            );
            // current time in UTC using firebase timestamp
            const currentTime = admin.firestore.Timestamp.now();

            if (
                currentTime.toDate().getTime() >= appointmentDateTime.getTime()
            ) {
                return res.status(400).json({
                    error: "Cannot cancel appointments that have already started or passed",
                });
            }

            // Step 4: Calculate Stylist Fine
            const paymentAmount = bookingData.paymentAmount;
            const stylistFinePercentage = 0.04; // 4%
            const stylistFine = paymentAmount * stylistFinePercentage;

            // Step 5: Process Payment Cancellation/Refund
            let refundResult = null;
            const paymentIntentId = bookingData.paymentId;

            if (paymentIntentId) {
                try {
                    // Get the payment intent to check its status
                    const paymentIntent =
                        await stripe.paymentIntents.retrieve(paymentIntentId);

                    if (paymentIntent.status === "succeeded") {
                        // Payment was captured, create a full refund to client
                        refundResult = await stripe.refunds.create({
                            payment_intent: paymentIntentId,
                            reason: "requested_by_customer",
                            metadata: {
                                bookingId: bookingId,
                                stylistFine: stylistFine * 100,
                                refundType: "stylist_cancellation_full_refund",
                            },
                        });
                    } else if (paymentIntent.status === "requires_capture") {
                        // Payment not yet captured, cancel the payment intent
                        await stripe.paymentIntents.cancel(paymentIntentId);
                        refundResult = { status: "cancelled" };
                    } else {
                        console.log(
                            `Payment cannot be refunded in its current state: ${paymentIntent.status}`
                        );
                        return res.status(400).json({
                            error: `Payment cannot be refunded in its current state`,
                        });
                    }
                } catch (error) {
                    console.error(
                        "Error processing payment cancellation:",
                        error
                    );
                    return res.status(500).json({
                        error: "Failed to process payment cancellation. Please contact support.",
                    });
                }
            }

            // Step 6: Update Booking Status
            await bookingRef.update({
                status: "cancelled",
                cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                paymentStatus: "refunded",
                cancelledBy: "stylist",
                stylistFine: stylistFine,
                refundAmount: paymentAmount,
                refundId: refundResult?.id || null,
            });

            // Step 7: Update Payment Document
            if (paymentIntentId) {
                const paymentQuery = await db
                    .collection("payments")
                    .where("bookingId", "==", bookingId)
                    .get();

                if (!paymentQuery.empty) {
                    const paymentDoc = paymentQuery.docs[0];
                    await paymentDoc.ref.update({
                        status: "refunded",
                        cancelledBy: "stylist",
                        cancelledAt:
                            admin.firestore.FieldValue.serverTimestamp(),
                        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                        stylistFine: stylistFine,
                        refundAmount: paymentAmount,
                        refundId: refundResult?.id || null,
                    });
                }
            }

            // add a new document to the refunds collection
            const refundDoc = await db.collection("refunds").add({
                bookingId: bookingId,
                clientId: bookingData.clientId,
                stylistId: userId,
                originalPaidAmount: paymentAmount,
                refundAmount: paymentAmount,
                cancellationFee: stylistFine,
                refundStripeId: refundResult?.id || null,
                reason: "stylist_cancellation",
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            // Step 8: Log the Stylist Fine and Refund
            await db.collection("stylist_fines").add({
                bookingId: bookingId,
                stylistId: userId,
                clientId: bookingData.clientId,
                originalPaidAmount: paymentAmount,
                fineAmount: stylistFine,
                deductedAmount: 0,
                remainingAmount: stylistFine,
                refundId: refundDoc.id,
                reason: "stylist_cancellation",
                status: "pending", // Will be deducted from next payout
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            const date = format(bookingData.dateTime, "yyyy-MM-dd");
            const time = format(bookingData.dateTime, "HH:mm") + " UTC";

            // Send email to client
            setTimeout(async () => {
                try {
                    await EmailService.sendAppointmentCancelledEmailForClient({
                        clientName: bookingData.clientName || "Client",
                        clientEmail: bookingData.clientEmail,
                        stylistName: bookingData.stylistName || "Stylist",
                        serviceName: bookingData.serviceName,
                        appointmentDate: date,
                        appointmentTime: time,
                    });
                } catch (error) {
                    console.error(
                        "Error sending cancellation email to client:",
                        error
                    );
                }
            }, 0);

            // Send email to stylist
            setTimeout(async () => {
                try {
                    await EmailService.sendAppointmentCancelledEmailForStylist({
                        stylistName: bookingData.stylistName || "Stylist",
                        stylistEmail: bookingData.stylistEmail,
                        clientName: bookingData.clientName || "Client",
                        serviceName: bookingData.serviceName,
                        appointmentDate: date,
                        appointmentTime: time,
                    });
                } catch (error) {
                    console.error(
                        "Error sending cancellation email to stylist:",
                        error
                    );
                }
            }, 0);

            // Send SMS Notifications
            // Send SMS to client
            setTimeout(async () => {
                try {
                    await SmsService.sendAppointmentCancelledSmsForClient({
                        clientName: bookingData.clientName || "Client",
                        phoneNumber: bookingData.clientPhone,
                        stylistName: bookingData.stylistName || "Stylist",
                        serviceName: bookingData.serviceName,
                        appointmentDate: date,
                        appointmentTime: time,
                    });
                } catch (error) {
                    console.error(
                        "Error sending cancellation SMS to client:",
                        error
                    );
                }
            }, 0);

            // Send SMS to stylist
            setTimeout(async () => {
                try {
                    await SmsService.sendAppointmentCancelledSmsForStylist({
                        stylistName: bookingData.stylistName || "Stylist",
                        phoneNumber: bookingData.stylistPhone,
                        clientName: bookingData.clientName || "Client",
                        serviceName: bookingData.serviceName,
                        appointmentDate: date,
                        appointmentTime: time,
                    });
                } catch (error) {
                    console.error(
                        "Error sending cancellation SMS to stylist:",
                        error
                    );
                }
            }, 0);

            // TODO: send push notification to stylist and client

            return res.status(200).json({
                success: true,
                message: "Booking cancelled successfully",
                stylistFine: stylistFine,
                refundAmount: paymentAmount,
                refundId: refundResult?.id || null,
            });
        } catch (error) {
            console.error("Error cancelling booking:", error);
            return res.status(500).json({
                error:
                    error instanceof Error
                        ? error.message
                        : "Unknown error occurred",
            });
        }
    }
);

// scheduled function to check for expired bookings and cancel them
export const cronJob = onSchedule(
    {
        schedule: "every 5 minutes",
    },
    async (context) => {
        try {
            console.log(
                "Running scheduled function to expire pending bookings",
                new Date().toISOString()
            );

            const now = admin.firestore.Timestamp.now();
            const expiredBookingsQuery = await db
                .collection("bookings")
                .where("status", "==", "pending")
                .where("expiresAt", "<=", now)
                .get();

            if (!expiredBookingsQuery.empty) {
                console.log("No expired pending bookings found.");
            } else {
                const expiredBookingIds: string[] = [];
                const errors: any[] = [];

                await Promise.all(
                    expiredBookingsQuery.docs.map(async (doc) => {
                        const bookingId = doc.id;
                        const bookingData = doc.data();
                        expiredBookingIds.push(bookingId);
                        let paymentCancelled = false;
                        let paymentError = null;
                        const paymentIntentId = bookingData.paymentId;

                        // Find the payment document
                        let paymentDoc = null;
                        let paymentDocRef = null;
                        if (paymentIntentId) {
                            const paymentQuery = await db
                                .collection("payments")
                                .where("bookingId", "==", bookingId)
                                .get();
                            if (!paymentQuery.empty) {
                                paymentDoc = paymentQuery.docs[0].data();
                                paymentDocRef = paymentQuery.docs[0].ref;
                            }
                        }

                        // Cancel the payment intent in Stripe if exists
                        if (paymentIntentId) {
                            console.log(
                                `Cancelling paymentIntent ${paymentIntentId} for booking ${bookingId}`
                            );
                            try {
                                await stripe.paymentIntents.cancel(
                                    paymentIntentId
                                );
                                paymentCancelled = true;
                                console.log(
                                    `PaymentIntent ${paymentIntentId} cancelled successfully for booking ${bookingId}`
                                );
                            } catch (err) {
                                paymentError =
                                    err instanceof Error ? err.message : err;
                                console.error(
                                    `Failed to cancel paymentIntent ${paymentIntentId} for booking ${bookingId}:`,
                                    paymentError
                                );
                            }
                        }

                        // Update booking document
                        await doc.ref.update({
                            status: "auto-cancelled",
                            paymentStatus: "auto-cancelled",
                            updatedAt:
                                admin.firestore.FieldValue.serverTimestamp(),
                            paymentCancelledAt:
                                admin.firestore.FieldValue.serverTimestamp(),
                        });

                        // Update payment document
                        if (paymentDocRef) {
                            await paymentDocRef.update({
                                status: "auto-cancelled",
                                cancelledAt:
                                    admin.firestore.FieldValue.serverTimestamp(),
                                updatedAt:
                                    admin.firestore.FieldValue.serverTimestamp(),
                            });
                        }

                        // Send email/sms notifications to client
                        const date = format(bookingData.dateTime, "yyyy-MM-dd");
                        const time =
                            format(bookingData.dateTime, "HH:mm") + " UTC";

                        //TODO: email
                        setTimeout(async () => {
                            try {
                                await EmailService.sendAppointmentAutoCancelledForClient(
                                    {
                                        clientName: bookingData.clientName,
                                        clientEmail: bookingData.clientPhone,
                                        stylistName: bookingData.stylistName,
                                        appointmentDate: date,
                                        appointmentTime: time,
                                        serviceName: bookingData.serviceName,
                                    }
                                );
                            } catch (error) {
                                console.log(
                                    `Error sending sms to client ${bookingData.clientName} for booking ${bookingId}: `,
                                    error
                                );
                            }
                        }, 0);

                        setTimeout(async () => {
                            try {
                                await EmailService.sendAppointmentAutoCancelledForStylist(
                                    {
                                        clientName: bookingData.clientName,
                                        stylistEmail: bookingData.clientPhone,
                                        stylistName: bookingData.stylistName,
                                        appointmentDate: date,
                                        appointmentTime: time,
                                        serviceName: bookingData.serviceName,
                                    }
                                );
                            } catch (error) {
                                console.log(
                                    `Error sending sms to stylist ${bookingData.stylistName} for booking ${bookingId}: `,
                                    error
                                );
                            }
                        }, 0);

                        setTimeout(async () => {
                            try {
                                await SmsService.sendAppointmentAutoCancelledClientSms(
                                    {
                                        clientName: bookingData.clientName,
                                        phoneNumber: bookingData.clientPhone,
                                        stylistName: bookingData.stylistName,
                                        appointmentDate: date,
                                        appointmentTime: time,
                                        serviceName: bookingData.serviceName,
                                    }
                                );
                            } catch (error) {
                                console.error(
                                    `Error sending sms to client ${bookingData.clientName} for booking ${bookingId}:`,
                                    error
                                );
                            }
                        }, 0);

                        setTimeout(async () => {
                            try {
                                await SmsService.sendAppointmentAutoCancelledStylistSms(
                                    {
                                        stylistName: bookingData.stylistName,
                                        phoneNumber: bookingData.stylistPhone,
                                        clientName: bookingData.clientName,
                                        appointmentDate: date,
                                        appointmentTime: time,
                                        serviceName: bookingData.serviceName,
                                    }
                                );
                            } catch (error) {
                                console.error(
                                    `Error sending sms to stylist ${bookingData.stylistName} for booking ${bookingId}:`,
                                    error
                                );
                            }
                        }, 0);
                    })
                );

                console.log(
                    `Auto-cancelled ${expiredBookingIds.length} pending bookings:`,
                    expiredBookingIds
                );
            }
        } catch (error) {
            console.error("Error in expirePendingBookings:", error);
        }

        try {
            console.log(
                "Running scheduled function to update confirmed bookings to be paid"
            );

            // get all confirmed bookings
            const confirmedBookingsQuery = await db
                .collection("bookings")
                .where("status", "==", "confirmed")
                .get();

            // check if the confirmed bookings are started, if so we can update their status to be-paid
            const confirmedBookings = confirmedBookingsQuery.docs.map((doc) =>
                doc.data()
            );

            console.log("confirmedBookings", confirmedBookings.length);

            for (const booking of confirmedBookings) {
                const bookingDate = booking.dateTime;

                const now = admin.firestore.Timestamp.now();
                const bookingDateTimestamp =
                    admin.firestore.Timestamp.fromDate(bookingDate);

                if (now > bookingDateTimestamp) {
                    await db
                        .collection("bookings")
                        .doc(booking.bookingId)
                        .update({
                            status: "to-be-paid",
                        });
                }
            }

            return null;
        } catch (error) {
            console.error(
                "Error in updateConfirmedBookings to be paid:",
                error
            );
            return null;
        }
    }
);

// Add a webhook handler to create the booking when payment is successful
app.post("/webhook", async (req: RequestWithRawBody, res: Response) => {
    const sig = req.headers["stripe-signature"] as string;

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
        console.log("event", event.type, event);
    } catch (err) {
        console.error(
            `Webhook signature verification failed: ${err instanceof Error ? err.message : "Unknown error"}`
        );
        return res
            .status(400)
            .send(
                `Webhook Error: ${err instanceof Error ? err.message : "Unknown error"}`
            );
    }

    try {
        // Handle the event
        switch (event.type) {
            case "checkout.session.completed": {
                const session = event.data.object as Stripe.Checkout.Session;
                const userId = session.metadata?.userId;
                const stylistId = session.metadata?.stylistId;
                const subscriptionId = session.subscription as string;
                const paymentIntentId = session.payment_intent as string;

                // Handle payment checkout (for appointments that need payment)
                if (session.metadata?.paymentType === "final_payment") {
                    const appointmentId = session.metadata.appointmentId;
                    const stylistId = session.metadata.stylistId;
                    const clientId = session.metadata.clientId;

                    if (appointmentId && stylistId && clientId) {
                        // Get appointment details
                        const appointmentRef = db
                            .collection("bookings")
                            .doc(appointmentId);
                        const appointmentDoc = await appointmentRef.get();

                        if (appointmentDoc.exists) {
                            const appointmentData = appointmentDoc.data();

                            try {
                                // Update appointment to mark that payment was received
                                await appointmentRef.update({
                                    finalPaymentReceived: true,
                                    finalPaymentReceivedAt:
                                        admin.firestore.FieldValue.serverTimestamp(),
                                    updatedAt:
                                        admin.firestore.FieldValue.serverTimestamp(),
                                });

                                console.log(
                                    `Processing transfer for appointment ${appointmentId} after payment received`
                                );

                                // Reuse the handleTransferFlow function to process the transfer
                                const transferResult = await handleTransferFlow(
                                    appointmentId,
                                    appointmentData
                                );

                                console.log(
                                    `Transfer completed for appointment ${appointmentId}:`,
                                    transferResult
                                );

                                // Send additional notification to client about successful payment
                                await db.collection("notifications").add({
                                    userId: clientId,
                                    type: "payment_completed",
                                    title: "Payment Completed",
                                    message: `Your payment for appointment ${appointmentId} has been processed successfully.`,
                                    read: false,
                                    createdAt:
                                        admin.firestore.FieldValue.serverTimestamp(),
                                    data: {
                                        appointmentId,
                                        amountPaid: session.amount_total / 100,
                                    },
                                });

                                console.log(
                                    `Payment processed for appointment ${appointmentId}`
                                );
                            } catch (error) {
                                console.error(
                                    `Error processing payment for appointment ${appointmentId}:`,
                                    error
                                );

                                // Update appointment to mark the error
                                await appointmentRef.update({
                                    finalPaymentError:
                                        error instanceof Error
                                            ? error.message
                                            : "Unknown error",
                                    finalPaymentErrorAt:
                                        admin.firestore.FieldValue.serverTimestamp(),
                                });
                            }
                        }
                    }
                    break;
                }

                // Check if this is a booking-related payment
                if (session.metadata?.pendingBookingId) {
                    const pendingBookingId = session.metadata.pendingBookingId;

                    // Get the pending booking data
                    const pendingBookingRef = db
                        .collection("pendingBookings")
                        .doc(pendingBookingId);
                    const pendingBookingDoc = await pendingBookingRef.get();

                    if (pendingBookingDoc.exists) {
                        const pendingBookingData = pendingBookingDoc.data();
                        const bookingData = pendingBookingData?.bookingData;

                        console.log("bookingData", bookingData);
                        const date = format(bookingData.dateTime, "yyyy-MM-dd");
                        const time = format(bookingData.dateTime, "HH:mm");

                        if (bookingData) {
                            const expiresAt = getBookingExpiresAt(date, time);

                            // Create the actual booking
                            const bookingRef = db
                                .collection("bookings")
                                .doc(pendingBookingId);
                            await bookingRef.set({
                                ...bookingData,
                                paymentStatus: "authorized",
                                paymentId: session.payment_intent,
                                stripeSessionId: session.id,
                                depositAmount: session.amount_total
                                    ? session.amount_total / 100
                                    : null,
                                createdAt:
                                    admin.firestore.FieldValue.serverTimestamp(),
                                updatedAt:
                                    admin.firestore.FieldValue.serverTimestamp(),
                                expiresAt,
                            });

                            console.log(
                                `Created booking ${pendingBookingId} after successful payment`
                            );

                            // Update the payment record
                            const paymentsQuery = await db
                                .collection("payments")
                                .where("stripeSessionId", "==", session.id)
                                .get();

                            if (!paymentsQuery.empty) {
                                await paymentsQuery.docs[0].ref.update({
                                    status: "authorized",
                                    stripePaymentIntentId:
                                        session.payment_intent,
                                    bookingId: pendingBookingId,
                                    completedAt:
                                        admin.firestore.FieldValue.serverTimestamp(),
                                    balanceUpdated: true,
                                });
                            }

                            // Notify the stylist about the new booking
                            await db.collection("notifications").add({
                                userId: bookingData.stylistId,
                                type: "new_booking",
                                title: "New Booking with Deposit",
                                message: `You have a new booking with deposit paid for ${bookingData.serviceName} on ${date} at ${time}`,
                                read: false,
                                createdAt:
                                    admin.firestore.FieldValue.serverTimestamp(),
                                data: {
                                    bookingId: pendingBookingId,
                                    amount: session.amount_total / 100,
                                    serviceName: bookingData.serviceName,
                                },
                            });

                            // Notify the client about the successful booking
                            await db.collection("notifications").add({
                                userId: bookingData.clientId,
                                type: "booking_confirmed",
                                title: "Booking Confirmed",
                                message: `Your booking for ${bookingData.serviceName} on ${date} at ${time} has been confirmed.`,
                                read: false,
                                createdAt:
                                    admin.firestore.FieldValue.serverTimestamp(),
                                data: {
                                    bookingId: pendingBookingId,
                                    serviceName: bookingData.serviceName,
                                    // date: bookingData.date,
                                    // time: bookingData.time,
                                },
                            });

                            // Update stylist's balance
                            if (stylistId) {
                                const netAmount = session.amount_total || 0;
                                await updateStylistBalance(
                                    stylistId,
                                    netAmount,
                                    `Deposit payment for booking #${pendingBookingId.substring(0, 8)} - ${bookingData.serviceName}`
                                );

                                // Update stylist's earnings statistics
                                const stylistRef = db
                                    .collection("stylists")
                                    .doc(stylistId);
                                await db.runTransaction(async (transaction) => {
                                    const stylistDoc =
                                        await transaction.get(stylistRef);
                                    if (stylistDoc.exists) {
                                        const stylistData = stylistDoc.data();
                                        const currentEarnings =
                                            stylistData?.earnings || 0;
                                        const currentMonthlyEarnings =
                                            stylistData?.monthlyEarnings || 0;
                                        const currentPaymentCount =
                                            stylistData?.paymentCount || 0;
                                        const currentBookingCount =
                                            stylistData?.bookingCount || 0;

                                        transaction.update(stylistRef, {
                                            earnings:
                                                currentEarnings + netAmount,
                                            monthlyEarnings:
                                                currentMonthlyEarnings +
                                                netAmount,
                                            paymentCount:
                                                currentPaymentCount + 1,
                                            bookingCount:
                                                currentBookingCount + 1,
                                            lastPaymentAt:
                                                admin.firestore.FieldValue.serverTimestamp(),
                                            lastBookingAt:
                                                admin.firestore.FieldValue.serverTimestamp(),
                                        });
                                    }
                                });
                            }

                            // Add payment to client's payment history
                            if (userId) {
                                await db
                                    .collection("clients")
                                    .doc(userId)
                                    .collection("paymentHistory")
                                    .add({
                                        paymentId: session.payment_intent,
                                        stylistId: stylistId,
                                        bookingId: pendingBookingId,
                                        amount: session.amount_total / 100,
                                        description: `Deposit for ${bookingData.serviceName}`,
                                        status: "completed",
                                        createdAt:
                                            admin.firestore.FieldValue.serverTimestamp(),
                                        completedAt:
                                            admin.firestore.FieldValue.serverTimestamp(),
                                    });

                                // Update client's booking count
                                const clientRef = db
                                    .collection("clients")
                                    .doc(userId);
                                await db.runTransaction(async (transaction) => {
                                    const clientDoc =
                                        await transaction.get(clientRef);
                                    if (clientDoc.exists) {
                                        const clientData = clientDoc.data();
                                        const currentBookingCount =
                                            clientData?.bookingCount || 0;

                                        transaction.update(clientRef, {
                                            bookingCount:
                                                currentBookingCount + 1,
                                            lastBookingAt:
                                                admin.firestore.FieldValue.serverTimestamp(),
                                        });
                                    }
                                });
                            }

                            // Clean up the pending booking
                            await pendingBookingRef.delete();

                            console.log(
                                "notifying stylist about the new appointment"
                            );

                            // send email to stylist about the new appointment
                            setTimeout(async () => {
                                try {
                                    await EmailService.sendNewAppointmentForStylist(
                                        {
                                            stylistName:
                                                bookingData.stylistName,
                                            stylistEmail:
                                                bookingData.stylistEmail,
                                            clientName: bookingData.clientName,
                                            appointmentDate: date,
                                            appointmentTime: time + " UTC",
                                            serviceName:
                                                bookingData.serviceName,
                                        }
                                    );

                                    // send sms to stylist about the new appointment
                                    await SmsService.sendAppointmentBookedStylistSms(
                                        {
                                            stylistName:
                                                bookingData.stylistName,
                                            phoneNumber:
                                                bookingData.stylistPhone,
                                            appointmentDate: date,
                                            appointmentTime: time + " UTC", // TODO: timezone
                                            serviceName:
                                                bookingData.serviceName,
                                            clientName: bookingData.clientName,
                                        }
                                    );
                                } catch (error) {
                                    console.error(
                                        "Error sending new appointment email/sms notification:",
                                        error
                                    );
                                }
                            });

                            if (bookingData.paymentType === "deposit") {
                                console.log(
                                    "notifying client about the full payment reminder"
                                );

                                setTimeout(async () => {
                                    try {
                                        await EmailService.sendFullPaymentReminderForClient(
                                            {
                                                clientName:
                                                    bookingData.clientName,
                                                clientEmail:
                                                    bookingData.clientEmail,
                                                stylistName:
                                                    bookingData.stylistName,
                                                appointmentDate: date,
                                                appointmentTime: time + " UTC",
                                                serviceName:
                                                    bookingData.serviceName,
                                                balanceAmount: (
                                                    bookingData.totalAmount -
                                                    bookingData.depositAmount
                                                ).toString(),
                                            }
                                        );

                                        // send sms to client about the full payment reminder
                                        await SmsService.sendFullPaymentReminderForClientSms(
                                            {
                                                clientName:
                                                    bookingData.clientName,
                                                phoneNumber:
                                                    bookingData.clientPhone,
                                                serviceName:
                                                    bookingData.serviceName,
                                                stylistName:
                                                    bookingData.stylistName,
                                                appointmentDate: date,
                                                appointmentTime: time + " UTC",
                                                balanceAmount: (
                                                    bookingData.totalAmount -
                                                    bookingData.depositAmount
                                                ).toString(),
                                            }
                                        );
                                    } catch (error) {
                                        console.error(
                                            "Error sending full payment reminder email/sms:",
                                            error
                                        );
                                    }
                                });
                            }
                        }
                    }
                }

                console.log(`Checkout session completed: ${session.id}`);

                // Handle subscription checkout
                if (userId && subscriptionId) {
                    // Get subscription details
                    const subscription =
                        await stripe.subscriptions.retrieve(subscriptionId);

                    // Update the stylist document with subscription details
                    await db
                        .collection("stylists")
                        .doc(userId)
                        .update({
                            subscription: {
                                id: subscription.id,
                                status: subscription.status,
                                currentPeriodStart:
                                    admin.firestore.Timestamp.fromMillis(
                                        subscription.current_period_start * 1000
                                    ),
                                currentPeriodEnd:
                                    admin.firestore.Timestamp.fromMillis(
                                        subscription.current_period_end * 1000
                                    ),
                                priceId: subscription.items.data[0].price.id,
                                updatedAt:
                                    admin.firestore.FieldValue.serverTimestamp(),
                            },
                        });

                    console.log(
                        `Updated subscription status for user ${userId} to ${subscription.status}`
                    );
                }

                // Handle payment to stylist checkout
                if (
                    userId &&
                    stylistId &&
                    paymentIntentId &&
                    !session.metadata?.pendingBookingId
                ) {
                    // Find the payment record
                    const paymentsQuery = await db
                        .collection("payments")
                        .where("stripeSessionId", "==", session.id)
                        .get();

                    if (!paymentsQuery.empty) {
                        const paymentDoc = paymentsQuery.docs[0];
                        const paymentData = paymentDoc.data();

                        // Update payment status
                        await paymentDoc.ref.update({
                            status: "completed",
                            completedAt:
                                admin.firestore.FieldValue.serverTimestamp(),
                        });

                        console.log(
                            `Updated payment status for session ${session.id} to completed`
                        );

                        // Add a notification for the stylist
                        await db.collection("notifications").add({
                            userId: stylistId,
                            type: "payment_received",
                            title: "Payment Received",
                            message: `You received a payment of $${(session.amount_total || 0) / 100} for ${session.metadata?.serviceDescription}`,
                            read: false,
                            createdAt:
                                admin.firestore.FieldValue.serverTimestamp(),
                            data: {
                                paymentId: paymentDoc.id,
                                amount: session.amount_total / 100,
                                clientId: userId,
                            },
                        });

                        // Update stylist's balance
                        const netAmount = session.amount_total || 0;
                        await updateStylistBalance(
                            stylistId,
                            netAmount,
                            `Payment received for ${session.metadata?.serviceDescription}`
                        );

                        // Update stylist's earnings statistics
                        const stylistRef = db
                            .collection("stylists")
                            .doc(stylistId);
                        await db.runTransaction(async (transaction) => {
                            const stylistDoc =
                                await transaction.get(stylistRef);
                            if (stylistDoc.exists) {
                                const stylistData = stylistDoc.data();
                                const currentEarnings =
                                    stylistData?.earnings || 0;
                                const currentMonthlyEarnings =
                                    stylistData?.monthlyEarnings || 0;
                                const currentPaymentCount =
                                    stylistData?.paymentCount || 0;

                                transaction.update(stylistRef, {
                                    earnings: currentEarnings + netAmount,
                                    monthlyEarnings:
                                        currentMonthlyEarnings + netAmount,
                                    paymentCount: currentPaymentCount + 1,
                                    lastPaymentAt:
                                        admin.firestore.FieldValue.serverTimestamp(),
                                });
                            }
                        });

                        // Add payment to client's payment history
                        await db
                            .collection("clients")
                            .doc(userId)
                            .collection("paymentHistory")
                            .add({
                                paymentId: paymentDoc.id,
                                stylistId: stylistId,
                                amount: session.amount_total / 100,
                                description:
                                    session.metadata?.serviceDescription,
                                status: "completed",
                                createdAt:
                                    admin.firestore.FieldValue.serverTimestamp(),
                                completedAt:
                                    admin.firestore.FieldValue.serverTimestamp(),
                            });
                    }
                }

                break;
            }

            case "checkout.session.expired": {
                const session = event.data.object as Stripe.Checkout.Session;

                // Find the payment in Firestore
                const paymentsQuery = await db
                    .collection("payments")
                    .where("stripeSessionId", "==", session.id)
                    .get();

                if (!paymentsQuery.empty) {
                    const paymentDoc = paymentsQuery.docs[0];
                    const paymentData = paymentDoc.data();

                    // Update payment status
                    await paymentDoc.ref.update({
                        status: "expired",
                        expiredAt: admin.firestore.FieldValue.serverTimestamp(),
                    });

                    console.log(`Payment ${paymentDoc.id} marked as expired`);

                    // Check if this is a booking-related payment
                    if (session.metadata?.pendingBookingId) {
                        const pendingBookingId =
                            session.metadata.pendingBookingId;

                        // Clean up the pending booking
                        const pendingBookingRef = db
                            .collection("pendingBookings")
                            .doc(pendingBookingId);
                        const pendingBookingDoc = await pendingBookingRef.get();

                        if (pendingBookingDoc.exists) {
                            const pendingBookingData = pendingBookingDoc.data();
                            const bookingData = pendingBookingData?.bookingData;

                            if (bookingData) {
                                // Create a failed booking record
                                const bookingRef = db
                                    .collection("bookings")
                                    .doc(pendingBookingId);
                                await bookingRef.set({
                                    ...bookingData,
                                    status: "failed",
                                    paymentStatus: "expired",
                                    paymentId: session.payment_intent,
                                    stripeSessionId: session.id,
                                    depositAmount: session.amount_total
                                        ? session.amount_total / 100
                                        : null,
                                    createdAt:
                                        admin.firestore.FieldValue.serverTimestamp(),
                                    updatedAt:
                                        admin.firestore.FieldValue.serverTimestamp(),
                                    paymentFailedAt:
                                        admin.firestore.FieldValue.serverTimestamp(),
                                    paymentFailureReason:
                                        "Payment session expired",
                                });

                                console.log(
                                    `Created failed booking ${pendingBookingId} after payment session expired`
                                );

                                // Notify the client about the failed booking
                                await db.collection("notifications").add({
                                    userId: bookingData.clientId,
                                    type: "booking_payment_failed",
                                    title: "Booking Payment Failed",
                                    message: `Your payment for booking ${bookingData.serviceName} on ${bookingData.date} at ${bookingData.time} has expired. Please try again.`,
                                    read: false,
                                    createdAt:
                                        admin.firestore.FieldValue.serverTimestamp(),
                                    data: {
                                        bookingId: pendingBookingId,
                                        serviceName: bookingData.serviceName,
                                        date: bookingData.date,
                                        time: bookingData.time,
                                    },
                                });
                            }

                            // Delete the pending booking
                            await pendingBookingRef.delete();
                        }
                    }
                }
                break;
            }

            case "payment_intent.succeeded": {
                const paymentIntent = event.data.object as Stripe.PaymentIntent;
                const userId = paymentIntent.metadata?.userId;
                const stylistId = paymentIntent.metadata?.stylistId;
                const bookingId = paymentIntent.metadata?.bookingId;
                const session = paymentIntent.latest_charge as Stripe.Charge; // TODO

                console.log("payment intent succeeded", paymentIntent);

                if (userId && stylistId) {
                    // Find the payment record
                    const paymentsQuery = await db
                        .collection("payments")
                        .where("stripePaymentIntentId", "==", paymentIntent.id)
                        .get();

                    if (!paymentsQuery.empty) {
                        const paymentDoc = paymentsQuery.docs[0];
                        const paymentData = paymentDoc.data();

                        // Only process if payment is not already completed
                        if (paymentData.status !== "captured") {
                            await paymentDoc.ref.update({
                                status: "captured",
                                capturedAt:
                                    admin.firestore.FieldValue.serverTimestamp(),
                            });

                            console.log(
                                `Updated payment status for payment intent ${paymentIntent.id} to captured`
                            );

                            // If this payment is for a booking, update the booking
                            if (bookingId) {
                                const bookingRef = db
                                    .collection("bookings")
                                    .doc(bookingId);
                                const bookingDoc = await bookingRef.get();

                                if (bookingDoc.exists) {
                                    await bookingRef.update({
                                        paymentStatus: "captured",
                                        updatedAt:
                                            admin.firestore.FieldValue.serverTimestamp(),
                                    });

                                    console.log(
                                        `Updated booking ${bookingId} payment status to paid`
                                    );
                                }
                            } else {
                                console.log("no booking id");
                            }

                            // Add a notification for the stylist
                            await db.collection("notifications").add({
                                userId: stylistId,
                                type: "payment_received",
                                title: "Payment Received",
                                message: `You received a payment of $${paymentIntent.amount / 100} for ${paymentIntent.description}`,
                                read: false,
                                createdAt:
                                    admin.firestore.FieldValue.serverTimestamp(),
                                data: {
                                    paymentId: paymentDoc.id,
                                    amount: paymentIntent.amount,
                                    clientId: userId,
                                    // bookingId: bookingId,
                                },
                            });

                            // Update stylist's balance - only if not already processed in checkout.session.completed
                            if (!paymentData.balanceUpdated) {
                                const netAmount = paymentIntent.amount || 0; // TODO
                                await updateStylistBalance(
                                    stylistId,
                                    netAmount,
                                    `Payment received for ${paymentIntent.description}`
                                );

                                // Mark as balance updated
                                await paymentDoc.ref.update({
                                    balanceUpdated: true,
                                });

                                // Update stylist's earnings statistics
                                const stylistRef = db
                                    .collection("stylists")
                                    .doc(stylistId);
                                await db.runTransaction(async (transaction) => {
                                    const stylistDoc =
                                        await transaction.get(stylistRef);
                                    if (stylistDoc.exists) {
                                        const stylistData = stylistDoc.data();
                                        const currentEarnings =
                                            stylistData?.earnings || 0;
                                        const currentMonthlyEarnings =
                                            stylistData?.monthlyEarnings || 0;
                                        const currentPaymentCount =
                                            stylistData?.paymentCount || 0;

                                        transaction.update(stylistRef, {
                                            earnings:
                                                currentEarnings + netAmount,
                                            monthlyEarnings:
                                                currentMonthlyEarnings +
                                                netAmount,
                                            paymentCount:
                                                currentPaymentCount + 1,
                                            lastPaymentAt:
                                                admin.firestore.FieldValue.serverTimestamp(),
                                        });
                                    }
                                });
                            }

                            // Add payment to client's payment history if not already added
                            const clientPaymentHistoryQuery = await db
                                .collection("clients")
                                .doc(userId)
                                .collection("paymentHistory")
                                .where("paymentId", "==", paymentDoc.id)
                                .get();

                            if (clientPaymentHistoryQuery.empty) {
                                console.log(
                                    "adding payment to client's payment history"
                                );
                                await db
                                    .collection("clients")
                                    .doc(userId)
                                    .collection("paymentHistory")
                                    .add({
                                        paymentId: paymentDoc.id,
                                        stylistId: stylistId,
                                        // bookingId: bookingId,
                                        amount: paymentIntent.amount,
                                        description: paymentIntent.description,
                                        status: "completed",
                                        createdAt:
                                            admin.firestore.FieldValue.serverTimestamp(),
                                        completedAt:
                                            admin.firestore.FieldValue.serverTimestamp(),
                                    });
                            }
                        }
                    }
                }
                break;
            }

            case "payment_intent.payment_failed": {
                const paymentIntent = event.data.object as Stripe.PaymentIntent;
                const userId = paymentIntent.metadata?.userId;
                const stylistId = paymentIntent.metadata?.stylistId;
                const bookingId = paymentIntent.metadata?.bookingId;

                if (userId) {
                    // Find the payment record
                    const paymentsQuery = await db
                        .collection("payments")
                        .where("stripePaymentIntentId", "==", paymentIntent.id)
                        .get();

                    if (!paymentsQuery.empty) {
                        const paymentDoc = paymentsQuery.docs[0];

                        // Update payment status
                        await paymentDoc.ref.update({
                            status: "failed",
                            failedAt:
                                admin.firestore.FieldValue.serverTimestamp(),
                            failureMessage:
                                paymentIntent.last_payment_error?.message ||
                                "Payment failed",
                        });

                        console.log(
                            `Updated payment status for payment intent ${paymentIntent.id} to failed`
                        );

                        // If this payment is for a booking, update the booking
                        if (bookingId) {
                            const bookingRef = db
                                .collection("bookings")
                                .doc(bookingId);
                            const bookingDoc = await bookingRef.get();

                            if (bookingDoc.exists) {
                                await bookingRef.update({
                                    paymentStatus: "failed",
                                    updatedAt:
                                        admin.firestore.FieldValue.serverTimestamp(),
                                    paymentFailedAt:
                                        admin.firestore.FieldValue.serverTimestamp(),
                                    paymentFailureReason:
                                        paymentIntent.last_payment_error
                                            ?.message || "Payment failed",
                                });

                                console.log(
                                    `Updated booking ${bookingId} payment status to failed`
                                );

                                // Notify the client about the failed payment
                                const bookingData = bookingDoc.data();
                                await db.collection("notifications").add({
                                    userId: bookingData?.clientId,
                                    type: "payment_failed",
                                    title: "Payment Failed",
                                    message: `Your payment for ${bookingData?.serviceName} failed: ${paymentIntent.last_payment_error?.message || "Unknown error"}. Please try again.`,
                                    read: false,
                                    createdAt:
                                        admin.firestore.FieldValue.serverTimestamp(),
                                    data: {
                                        bookingId: bookingId,
                                        paymentId: paymentDoc.id,
                                        errorMessage:
                                            paymentIntent.last_payment_error
                                                ?.message,
                                    },
                                });
                            }
                        }

                        // Notify the client about the failed payment
                        await db.collection("notifications").add({
                            userId: userId,
                            type: "payment_failed",
                            title: "Payment Failed",
                            message: `Your payment of $${paymentIntent.amount / 100} failed: ${paymentIntent.last_payment_error?.message || "Unknown error"}. Please try again.`,
                            read: false,
                            createdAt:
                                admin.firestore.FieldValue.serverTimestamp(),
                            data: {
                                paymentId: paymentDoc.id,
                                amount: paymentIntent.amount,
                                errorMessage:
                                    paymentIntent.last_payment_error?.message,
                            },
                        });
                    }
                }
                break;
            }

            case "invoice.paid": {
                const invoice = event.data.object as Stripe.Invoice;
                const subscriptionId = invoice.subscription as string;
                const customerId = invoice.customer as string;

                if (subscriptionId && customerId) {
                    // Find the stylist with this customer ID
                    const stylistsQuery = await db
                        .collection("stylists")
                        .where("stripeCustomerId", "==", customerId)
                        .get();

                    if (!stylistsQuery.empty) {
                        const stylistDoc = stylistsQuery.docs[0];
                        const stylistId = stylistDoc.id;

                        // Get subscription details
                        const subscription =
                            await stripe.subscriptions.retrieve(subscriptionId);

                        // Update the stylist document with subscription details
                        await stylistDoc.ref.update({
                            "subscription.status": subscription.status,
                            "subscription.currentPeriodStart":
                                admin.firestore.Timestamp.fromMillis(
                                    subscription.current_period_start * 1000
                                ),
                            "subscription.currentPeriodEnd":
                                admin.firestore.Timestamp.fromMillis(
                                    subscription.current_period_end * 1000
                                ),
                            "subscription.updatedAt":
                                admin.firestore.FieldValue.serverTimestamp(),
                        });

                        console.log(
                            `Updated subscription status for stylist ${stylistId} to ${subscription.status}`
                        );

                        // Add a notification for the stylist
                        await db.collection("notifications").add({
                            userId: stylistId,
                            type: "subscription_renewed",
                            title: "Subscription Renewed",
                            message: `Your subscription has been renewed for $${invoice.amount_paid / 100}. It will be active until ${new Date(subscription.current_period_end * 1000).toLocaleDateString()}.`,
                            read: false,
                            createdAt:
                                admin.firestore.FieldValue.serverTimestamp(),
                            data: {
                                subscriptionId: subscription.id,
                                amount: invoice.amount_paid,
                                periodEnd: subscription.current_period_end,
                            },
                        });

                        // Add subscription payment to payment history
                        await db.collection("subscriptionPayments").add({
                            stylistId: stylistId,
                            subscriptionId: subscription.id,
                            invoiceId: invoice.id,
                            amount: invoice.amount_paid,
                            status: "paid",
                            periodStart: admin.firestore.Timestamp.fromMillis(
                                subscription.current_period_start * 1000
                            ),
                            periodEnd: admin.firestore.Timestamp.fromMillis(
                                subscription.current_period_end * 1000
                            ),
                            createdAt:
                                admin.firestore.FieldValue.serverTimestamp(),
                        });
                    }
                }
                break;
            }

            case "invoice.payment_failed": {
                const invoice = event.data.object as Stripe.Invoice;
                const subscriptionId = invoice.subscription as string;
                const customerId = invoice.customer as string;
                const customerEmail = invoice.customer_email as string;

                if (subscriptionId && customerId) {
                    // Find the stylist with this customer ID
                    const stylistsQuery = await db
                        .collection("stylists")
                        .where("stripeCustomerId", "==", customerId)
                        .get();

                    if (!stylistsQuery.empty) {
                        const stylistDoc = stylistsQuery.docs[0];
                        const stylistId = stylistDoc.id;

                        // Get subscription details
                        const subscription =
                            await stripe.subscriptions.retrieve(subscriptionId);

                        // Update the stylist document with subscription details
                        await stylistDoc.ref.update({
                            "subscription.status": subscription.status,
                            "subscription.updatedAt":
                                admin.firestore.FieldValue.serverTimestamp(),
                        });

                        console.log(
                            `Updated subscription status for stylist ${stylistId} to ${subscription.status}`
                        );

                        // Add a notification for the stylist
                        await db.collection("notifications").add({
                            userId: stylistId,
                            type: "subscription_payment_failed",
                            title: "Subscription Payment Failed",
                            message: `Your subscription payment of $${invoice.amount_due / 100} failed. Please update your payment method to keep your subscription active.`,
                            read: false,
                            createdAt:
                                admin.firestore.FieldValue.serverTimestamp(),
                            data: {
                                subscriptionId: subscription.id,
                                amount: invoice.amount_due,
                                invoiceUrl: invoice.hosted_invoice_url,
                            },
                        });

                        // Add failed payment to payment history
                        await db.collection("subscriptionPayments").add({
                            stylistId: stylistId,
                            subscriptionId: subscription.id,
                            invoiceId: invoice.id,
                            amount: invoice.amount_due,
                            status: "failed",
                            failureMessage:
                                /* invoice.last_payment_error?.message || */ "Payment failed",
                            createdAt:
                                admin.firestore.FieldValue.serverTimestamp(),
                        });

                        //send email to stylist
                        // TODO: to be tested after a month when the next payment fails
                        setTimeout(
                            async () =>
                                await EmailService.sendPaymentFailureForStylist(
                                    {
                                        stylistName:
                                            stylistDoc.data()?.name ||
                                            "Unknown",
                                        stylistEmail: customerEmail,
                                    }
                                ),
                            0
                        );
                    }
                }
                break;
            }

            case "customer.subscription.updated": {
                const subscription = event.data.object as Stripe.Subscription;
                const customerId = subscription.customer as string;

                // Find the stylist with this customer ID
                const stylistsQuery = await db
                    .collection("stylists")
                    .where("stripeCustomerId", "==", customerId)
                    .get();

                if (!stylistsQuery.empty) {
                    const stylistDoc = stylistsQuery.docs[0];
                    const stylistId = stylistDoc.id;

                    // Update the stylist document with subscription details
                    await stylistDoc.ref.update({
                        "subscription.status": subscription.status,
                        "subscription.currentPeriodStart":
                            admin.firestore.Timestamp.fromMillis(
                                subscription.current_period_start * 1000
                            ),
                        "subscription.currentPeriodEnd":
                            admin.firestore.Timestamp.fromMillis(
                                subscription.current_period_end * 1000
                            ),
                        "subscription.cancelAtPeriodEnd":
                            subscription.cancel_at_period_end,
                        "subscription.updatedAt":
                            admin.firestore.FieldValue.serverTimestamp(),
                    });

                    console.log(
                        `Updated subscription status for stylist ${stylistId} to ${subscription.status}`
                    );

                    // Handle subscription status notifications
                    if (
                        stylistDoc.data()?.subscription?.cancelAtPeriodEnd ===
                            true &&
                        subscription.cancel_at_period_end === false
                    ) {
                        // Subscription was reactivated
                        await db.collection("notifications").add({
                            userId: stylistId,
                            type: "subscription_reactivated",
                            title: "Subscription Reactivated",
                            message:
                                "Your subscription has been reactivated and will continue at the end of the current billing period.",
                            read: false,
                            createdAt:
                                admin.firestore.FieldValue.serverTimestamp(),
                            data: {
                                subscriptionId: subscription.id,
                            },
                        });
                    } else if (subscription.cancel_at_period_end) {
                        // Subscription was canceled
                        await db.collection("notifications").add({
                            userId: stylistId,
                            type: "subscription_cancellation_scheduled",
                            title: "Subscription Cancellation Scheduled",
                            message: `Your subscription will be canceled on ${new Date(subscription.current_period_end * 1000).toLocaleDateString()}. You can continue using the service until then.`,
                            read: false,
                            createdAt:
                                admin.firestore.FieldValue.serverTimestamp(),
                            data: {
                                subscriptionId: subscription.id,
                                periodEnd: subscription.current_period_end,
                            },
                        });
                    }
                }
                break;
            }

            case "customer.subscription.deleted": {
                const subscription = event.data.object as Stripe.Subscription;
                const customerId = subscription.customer as string;

                // Find the stylist with this customer ID
                const stylistsQuery = await db
                    .collection("stylists")
                    .where("stripeCustomerId", "==", customerId)
                    .get();

                if (!stylistsQuery.empty) {
                    const stylistDoc = stylistsQuery.docs[0];
                    const stylistId = stylistDoc.id;

                    // Update the stylist document with subscription details
                    await stylistDoc.ref.update({
                        "subscription.status": "canceled",
                        "subscription.canceledAt":
                            admin.firestore.FieldValue.serverTimestamp(),
                        "subscription.updatedAt":
                            admin.firestore.FieldValue.serverTimestamp(),
                    });

                    console.log(
                        `Updated subscription status for stylist ${stylistId} to canceled`
                    );

                    // Add a notification for the stylist
                    await db.collection("notifications").add({
                        userId: stylistId,
                        type: "subscription_canceled",
                        title: "Subscription Canceled",
                        message:
                            "Your subscription has been canceled. Some features may no longer be available.",
                        read: false,
                        createdAt: admin.firestore.FieldValue.serverTimestamp(),
                        data: {
                            subscriptionId: subscription.id,
                        },
                    });
                }
                break;
            }
            case "transfer.created": {
                const transfer = event.data.object as Stripe.Transfer;
                const withdrawalId = transfer.metadata?.withdrawal_id;
                const stylistId = transfer.metadata?.stylist_id;

                if (withdrawalId) {
                    // This is a withdrawal transfer
                    const withdrawalRef = db
                        .collection("withdrawals")
                        .doc(withdrawalId);
                    const withdrawalDoc = await withdrawalRef.get();

                    if (withdrawalDoc.exists) {
                        const withdrawalData = withdrawalDoc.data();

                        // Update withdrawal status
                        await withdrawalRef.update({
                            status: "completed",
                            stripeTransferId: transfer.id,
                            completedAt:
                                admin.firestore.FieldValue.serverTimestamp(),
                        });

                        console.log(
                            `Updated withdrawal ${withdrawalId} status to completed`
                        );

                        // Add a notification for the stylist
                        if (stylistId) {
                            await db.collection("notifications").add({
                                userId: stylistId,
                                type: "withdrawal_completed",
                                title: "Withdrawal Completed",
                                message: `Your withdrawal of $${transfer.amount / 100} has been processed and is on its way to your bank account.`,
                                read: false,
                                createdAt:
                                    admin.firestore.FieldValue.serverTimestamp(),
                                data: {
                                    withdrawalId: withdrawalId,
                                    amount: transfer.amount,
                                    transferId: transfer.id,
                                },
                            });

                            // Add to stylist's transfers collection
                            await db
                                .collection("stylists")
                                .doc(stylistId)
                                .collection("transfers")
                                .add({
                                    withdrawalId: withdrawalId,
                                    transferId: transfer.id,
                                    amount: transfer.amount,
                                    description:
                                        withdrawalData?.description ||
                                        "Withdrawal to bank account",
                                    status: "completed",
                                    createdAt:
                                        admin.firestore.FieldValue.serverTimestamp(),
                                    completedAt:
                                        admin.firestore.FieldValue.serverTimestamp(),
                                });
                        }
                    }
                } else {
                    console.log("no withdrawal id");
                }
                break;
            }

            // case "transfer.failed": {
            //   const transfer = event.data.object as Stripe.Transfer;
            //   const withdrawalId = transfer.metadata?.withdrawal_id;
            //   const stylistId = transfer.metadata?.stylist_id;

            //   if (withdrawalId) {
            //     // This is a withdrawal transfer that failed
            //     const withdrawalRef = db.collection("withdrawals").doc(withdrawalId);
            //     const withdrawalDoc = await withdrawalRef.get();

            //     if (withdrawalDoc.exists) {
            //       const withdrawalData = withdrawalDoc.data();

            //       // Update withdrawal status
            //       await withdrawalRef.update({
            //         status: "failed",
            //         stripeTransferId: transfer.id,
            //         failedAt: admin.firestore.FieldValue.serverTimestamp(),
            //         failureReason: transfer.failure_message || "Transfer failed",
            //       });

            //       console.log(`Updated withdrawal ${withdrawalId} status to failed`);

            //       // Refund the amount back to stylist's balance
            //       if (stylistId) {
            //         const amount = withdrawalData?.amount || 0;

            //         // Update stylist's balance
            //         await updateStylistBalance(
            //           stylistId,
            //           amount,
            //           `Refund for failed withdrawal #${withdrawalId.substring(0, 8)}`
            //         );

            //         // Add a notification for the stylist
            //         await db.collection("notifications").add({
            //           userId: stylistId,
            //           type: "withdrawal_failed",
            //           title: "Withdrawal Failed",
            //           message: `Your withdrawal of $${amount / 100} has failed: ${transfer.failure_message || "Unknown error"}. The amount has been returned to your balance.`,
            //           read: false,
            //           createdAt: admin.firestore.FieldValue.serverTimestamp(),
            //           data: {
            //             withdrawalId: withdrawalId,
            //             amount: amount,
            //             transferId: transfer.id,
            //             failureReason: transfer.failure_message,
            //           },
            //         });

            //         // Add to stylist's transfers collection
            //         await db
            //           .collection("stylists")
            //           .doc(stylistId)
            //           .collection("transfers")
            //           .add({
            //             withdrawalId: withdrawalId,
            //             transferId: transfer.id,
            //             amount: amount,
            //             description:
            //               withdrawalData?.description ||
            //               "Failed withdrawal to bank account",
            //             status: "failed",
            //             failureReason: transfer.failure_message || "Transfer failed",
            //             createdAt: admin.firestore.FieldValue.serverTimestamp(),
            //             failedAt: admin.firestore.FieldValue.serverTimestamp(),
            //           });
            //       }
            //     }
            //   }
            //   break;
            // }

            case "payout.created": {
                const payout = event.data.object as Stripe.Payout;
                const accountId = payout.destination as string;

                // Find the stylist with this account ID
                const stylistsQuery = await db
                    .collection("stylists")
                    .where("stripeAccountId", "==", accountId)
                    .get();

                if (!stylistsQuery.empty) {
                    const stylistDoc = stylistsQuery.docs[0];
                    const stylistId = stylistDoc.id;

                    // Add to stylist's payouts collection
                    await db
                        .collection("stylists")
                        .doc(stylistId)
                        .collection("payouts")
                        .add({
                            payoutId: payout.id,
                            amount: payout.amount,
                            currency: payout.currency,
                            arrivalDate: admin.firestore.Timestamp.fromMillis(
                                payout.arrival_date * 1000
                            ),
                            status: payout.status,
                            method: payout.type,
                            createdAt:
                                admin.firestore.FieldValue.serverTimestamp(),
                        });

                    console.log(
                        `Added payout ${payout.id} to stylist ${stylistId}`
                    );

                    // Add a notification for the stylist
                    await db.collection("notifications").add({
                        userId: stylistId,
                        type: "payout_created",
                        title: "Payout Initiated",
                        message: `A payout of $${payout.amount / 100} has been initiated to your bank account. It should arrive by ${new Date(payout.arrival_date * 1000).toLocaleDateString()}.`,
                        read: false,
                        createdAt: admin.firestore.FieldValue.serverTimestamp(),
                        data: {
                            payoutId: payout.id,
                            amount: payout.amount,
                            arrivalDate: payout.arrival_date,
                        },
                    });
                }
                break;
            }

            case "payout.paid": {
                const payout = event.data.object as Stripe.Payout;
                const accountId = payout.destination as string;

                // Find the stylist with this account ID
                const stylistsQuery = await db
                    .collection("stylists")
                    .where("stripeAccountId", "==", accountId)
                    .get();

                if (!stylistsQuery.empty) {
                    const stylistDoc = stylistsQuery.docs[0];
                    const stylistId = stylistDoc.id;

                    // Find the payout in Firestore
                    const payoutsQuery = await db
                        .collection("stylists")
                        .doc(stylistId)
                        .collection("payouts")
                        .where("payoutId", "==", payout.id)
                        .get();

                    if (!payoutsQuery.empty) {
                        const payoutDoc = payoutsQuery.docs[0];

                        // Update payout status
                        await payoutDoc.ref.update({
                            status: "paid",
                            paidAt: admin.firestore.FieldValue.serverTimestamp(),
                        });

                        console.log(
                            `Updated payout ${payout.id} status to paid`
                        );

                        // Add a notification for the stylist
                        await db.collection("notifications").add({
                            userId: stylistId,
                            type: "payout_paid",
                            title: "Payout Completed",
                            message: `Your payout of $${payout.amount / 100} has been deposited to your bank account.`,
                            read: false,
                            createdAt:
                                admin.firestore.FieldValue.serverTimestamp(),
                            data: {
                                payoutId: payout.id,
                                amount: payout.amount,
                            },
                        });
                    } else {
                        // Payout not found in Firestore, create a new record
                        await db
                            .collection("stylists")
                            .doc(stylistId)
                            .collection("payouts")
                            .add({
                                payoutId: payout.id,
                                amount: payout.amount,
                                currency: payout.currency,
                                arrivalDate:
                                    admin.firestore.Timestamp.fromMillis(
                                        payout.arrival_date * 1000
                                    ),
                                status: "paid",
                                method: payout.type,
                                createdAt:
                                    admin.firestore.FieldValue.serverTimestamp(),
                                paidAt: admin.firestore.FieldValue.serverTimestamp(),
                            });

                        console.log(
                            `Created new paid payout record ${payout.id} for stylist ${stylistId}`
                        );

                        // Add a notification for the stylist
                        await db.collection("notifications").add({
                            userId: stylistId,
                            type: "payout_paid",
                            title: "Payout Completed",
                            message: `Your payout of $${payout.amount / 100} has been deposited to your bank account.`,
                            read: false,
                            createdAt:
                                admin.firestore.FieldValue.serverTimestamp(),
                            data: {
                                payoutId: payout.id,
                                amount: payout.amount,
                            },
                        });
                    }
                }
                break;
            }

            case "payout.failed": {
                const payout = event.data.object as Stripe.Payout;
                const accountId = payout.destination as string;

                // Find the stylist with this account ID
                const stylistsQuery = await db
                    .collection("stylists")
                    .where("stripeAccountId", "==", accountId)
                    .get();

                if (!stylistsQuery.empty) {
                    const stylistDoc = stylistsQuery.docs[0];
                    const stylistId = stylistDoc.id;

                    // Find the payout in Firestore
                    const payoutsQuery = await db
                        .collection("stylists")
                        .doc(stylistId)
                        .collection("payouts")
                        .where("payoutId", "==", payout.id)
                        .get();

                    if (!payoutsQuery.empty) {
                        const payoutDoc = payoutsQuery.docs[0];

                        // Update payout status
                        await payoutDoc.ref.update({
                            status: "failed",
                            failedAt:
                                admin.firestore.FieldValue.serverTimestamp(),
                            failureReason:
                                payout.failure_message || "Payout failed",
                        });

                        console.log(
                            `Updated payout ${payout.id} status to failed`
                        );

                        // Add a notification for the stylist
                        await db.collection("notifications").add({
                            userId: stylistId,
                            type: "payout_failed",
                            title: "Payout Failed",
                            message: `Your payout of $${payout.amount / 100} has failed: ${payout.failure_message || "Unknown error"}. The funds will remain in your Stripe account.`,
                            read: false,
                            createdAt:
                                admin.firestore.FieldValue.serverTimestamp(),
                            data: {
                                payoutId: payout.id,
                                amount: payout.amount,
                                failureReason: payout.failure_message,
                            },
                        });
                    } else {
                        // Payout not found in Firestore, create a new record
                        await db
                            .collection("stylists")
                            .doc(stylistId)
                            .collection("payouts")
                            .add({
                                payoutId: payout.id,
                                amount: payout.amount,
                                currency: payout.currency,
                                arrivalDate:
                                    admin.firestore.Timestamp.fromMillis(
                                        payout.arrival_date * 1000
                                    ),
                                status: "failed",
                                method: payout.type,
                                createdAt:
                                    admin.firestore.FieldValue.serverTimestamp(),
                                failedAt:
                                    admin.firestore.FieldValue.serverTimestamp(),
                                failureReason:
                                    payout.failure_message || "Payout failed",
                            });

                        console.log(
                            `Created new failed payout record ${payout.id} for stylist ${stylistId}`
                        );

                        // Add a notification for the stylist
                        await db.collection("notifications").add({
                            userId: stylistId,
                            type: "payout_failed",
                            title: "Payout Failed",
                            message: `Your payout of $${payout.amount / 100} has failed: ${payout.failure_message || "Unknown error"}. The funds will remain in your Stripe account.`,
                            read: false,
                            createdAt:
                                admin.firestore.FieldValue.serverTimestamp(),
                            data: {
                                payoutId: payout.id,
                                amount: payout.amount,
                                failureReason: payout.failure_message,
                            },
                        });
                    }
                }
                break;
            }

            case "account.updated": {
                const account = event.data.object as Stripe.Account;

                // Find the stylist with this account ID
                const stylistsQuery = await db
                    .collection("stylists")
                    .where("stripeAccountId", "==", account.id)
                    .get();

                if (!stylistsQuery.empty) {
                    const stylistDoc = stylistsQuery.docs[0];
                    const stylistId = stylistDoc.id;

                    // Extract requirements information
                    const requirements = {
                        currentlyDue: account.requirements?.currently_due || [],
                        eventuallyDue:
                            account.requirements?.eventually_due || [],
                        pendingVerification:
                            account.requirements?.pending_verification || [],
                        disabled: account.requirements?.disabled_reason || null,
                        chargesEnabled: account.charges_enabled,
                        payoutsEnabled: account.payouts_enabled,
                        detailsSubmitted: account.details_submitted,
                    };

                    // Determine account status
                    let accountStatus = "pending";
                    if (account.charges_enabled && account.payouts_enabled) {
                        accountStatus = "active";
                    }

                    // Update the stylist document with the latest account information
                    await stylistDoc.ref.update({
                        stripeAccountStatus: accountStatus,
                        stripeAccountRequirements: requirements,
                        stripeAccountUpdatedAt:
                            admin.firestore.FieldValue.serverTimestamp(),
                    });

                    console.log(
                        `Updated account status for stylist ${stylistId} to ${accountStatus}`
                    );

                    // If account was just activated, send a notification
                    if (
                        accountStatus === "active" &&
                        stylistDoc.data()?.stripeAccountStatus !== "active"
                    ) {
                        await db.collection("notifications").add({
                            userId: stylistId,
                            type: "account_activated",
                            title: "Account Activated",
                            message:
                                "Your Stripe account has been fully activated. You can now receive payments and process withdrawals.",
                            read: false,
                            createdAt:
                                admin.firestore.FieldValue.serverTimestamp(),
                            data: {
                                accountId: account.id,
                            },
                        });
                    }

                    // If there are new requirements, send a notification
                    if (requirements.currentlyDue.length > 0) {
                        await db.collection("notifications").add({
                            userId: stylistId,
                            type: "account_requirements",
                            title: "Account Information Needed",
                            message:
                                "Your Stripe account requires additional information. Please visit your dashboard to complete the requirements.",
                            read: false,
                            createdAt:
                                admin.firestore.FieldValue.serverTimestamp(),
                            data: {
                                accountId: account.id,
                                requirements: requirements.currentlyDue,
                            },
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
        console.error(`Error processing webhook: ${err}`);
        return res
            .status(500)
            .send(
                `Webhook Error: ${err instanceof Error ? err.message : "Unknown error"}`
            );
    }
});

// Get stylist balance endpoint
app.get(
    "/stylist-balance",
    validateFirebaseIdToken,
    async (
        req: RequestWithRawBody & {
            query: { stylistId: string };
            user?: admin.auth.DecodedIdToken;
        },
        res: Response
    ) => {
        try {
            const { stylistId } = req.query;

            if (!stylistId) {
                return res
                    .status(400)
                    .json({ error: "Stylist ID is required" });
            }

            // Verify that the authenticated user is requesting their own data
            if (stylistId !== req.user?.uid) {
                return res
                    .status(403)
                    .json({ error: "Unauthorized access to user data" });
            }

            const stylistDoc = await db
                .collection("stylists")
                .doc(stylistId)
                .get();

            if (!stylistDoc.exists) {
                return res.status(404).json({ error: "Stylist not found" });
            }

            const stylistData = stylistDoc.data();

            // Get recent balance history
            const balanceHistoryQuery = await db
                .collection("stylists")
                .doc(stylistId)
                .collection("balanceHistory")
                .orderBy("createdAt", "desc")
                .limit(10)
                .get();

            const balanceHistory = balanceHistoryQuery.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));

            // Get recent transfers
            const transfersQuery = await db
                .collection("stylists")
                .doc(stylistId)
                .collection("transfers")
                .orderBy("createdAt", "desc")
                .limit(10)
                .get();

            const transfers = transfersQuery.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));

            // Get recent payouts
            const payoutsQuery = await db
                .collection("stylists")
                .doc(stylistId)
                .collection("payouts")
                .orderBy("createdAt", "desc")
                .limit(10)
                .get();

            const payouts = payoutsQuery.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));

            return res.status(200).json({
                balance: stylistData?.balance || 0,
                balanceUpdatedAt: stylistData?.balanceUpdatedAt,
                balanceCreatedAt: stylistData?.balanceCreatedAt,
                balanceHistory,
                transfers,
                payouts,
            });
        } catch (error) {
            console.error("Error fetching stylist balance:", error);
            return res.status(500).json({
                error:
                    error instanceof Error
                        ? error.message
                        : "Unknown error occurred",
            });
        }
    }
);

// Reactivate subscription endpoint
app.post(
    "/reactivate-subscription",
    validateFirebaseIdToken,
    async (
        req: RequestWithRawBody & {
            body: { userId: string };
            user?: admin.auth.DecodedIdToken;
        },
        res: Response
    ) => {
        try {
            const { userId } = req.body;

            if (!userId) {
                return res.status(400).json({ error: "User ID is required" });
            }

            // Verify that the authenticated user is requesting their own data
            if (userId !== req.user?.uid) {
                return res
                    .status(403)
                    .json({ error: "Unauthorized access to user data" });
            }

            // Get the stylist document
            const stylistDoc = await db
                .collection("stylists")
                .doc(userId)
                .get();
            if (!stylistDoc.exists) {
                return res.status(404).json({ error: "Stylist not found" });
            }

            const stylistData = stylistDoc.data();

            // Check if there's an existing subscription
            if (!stylistData?.subscription?.stripeSubscriptionId) {
                // No subscription found - redirect to create a new subscription
                return res.status(200).json({
                    success: false,
                    needsNewSubscription: true,
                    message:
                        "No active subscription found. Please create a new subscription.",
                });
            }

            // Verify subscription status allows reactivation
            if (!stylistData.subscription.cancelAtPeriodEnd) {
                return res
                    .status(400)
                    .json({ error: "Subscription is already active" });
            }

            // Get current subscription from Stripe to verify status
            const currentSubscription = await stripe.subscriptions.retrieve(
                stylistData.subscription.stripeSubscriptionId
            );

            if (currentSubscription.status !== "active") {
                // Subscription exists but is not active (e.g., canceled, unpaid)
                return res.status(200).json({
                    success: false,
                    needsNewSubscription: true,
                    message: `Cannot reactivate subscription - current status is ${currentSubscription.status}. Please create a new subscription.`,
                });
            }

            // Reactivate the subscription in Stripe
            const subscription = await stripe.subscriptions.update(
                stylistData.subscription.stripeSubscriptionId,
                { cancel_at_period_end: false }
            );

            // Update the subscription in Firestore
            await stylistDoc.ref.update({
                "subscription.cancelAtPeriodEnd": false,
                "subscription.status": subscription.status,
                "subscription.updatedAt":
                    admin.firestore.FieldValue.serverTimestamp(),
            });

            // Add a notification for the stylist
            await db.collection("notifications").add({
                userId: userId,
                type: "subscription_reactivated",
                title: "Subscription Reactivated",
                message:
                    "Your subscription has been successfully reactivated and will continue at the end of the current billing period.",
                read: false,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                data: {
                    subscriptionId: subscription.id,
                    currentPeriodEnd: subscription.current_period_end,
                },
            });

            console.log(
                `Successfully reactivated subscription for stylist ${userId}`
            );

            return res.status(200).json({
                success: true,
                subscription: {
                    id: subscription.id,
                    status: subscription.status,
                    currentPeriodEnd: new Date(
                        subscription.current_period_end * 1000
                    ).toISOString(),
                },
            });
        } catch (error) {
            console.error("Error reactivating subscription:", error);
            return res.status(500).json({
                error:
                    error instanceof Error
                        ? error.message
                        : "Unknown error occurred",
            });
        }
    }
);

// ... existing code ...

// Create a login link for an existing Connect account
app.post(
    "/create-account-link",
    cors({ origin: true }),
    async (req: Request, res: Response) => {
        try {
            // Verify authentication
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith("Bearer ")) {
                return res.status(401).json({ error: "Unauthorized" });
            }

            const idToken = authHeader.split("Bearer ")[1];
            const decodedToken = await admin.auth().verifyIdToken(idToken);
            const userId = decodedToken.uid;

            // Validate request body
            const { origin } = req.body;
            if (!origin) {
                return res
                    .status(400)
                    .json({ error: "Origin URL is required" });
            }

            // Get the stylist document
            const stylistRef = db.collection("stylists").doc(userId);
            const stylistDoc = await stylistRef.get();

            if (!stylistDoc.exists) {
                return res.status(404).json({ error: "Stylist not found" });
            }

            // Get the Stripe account ID
            const stylistData = stylistDoc.data();
            const accountId = stylistData?.stripeAccountId;

            if (!accountId) {
                return res
                    .status(400)
                    .json({ error: "No Stripe account found" });
            }

            // Validate and sanitize the origin URL
            let validatedOrigin = origin;
            try {
                new URL(validatedOrigin);
            } catch (error) {
                console.warn("Invalid origin URL provided:", validatedOrigin);
                validatedOrigin = "https://braidsnow.com";
            }

            // Create a login link for the dashboard
            const loginLink = await stripe.accounts.createLoginLink(accountId);

            return res.status(200).json({ url: loginLink.url });
        } catch (error) {
            console.error("Error creating account login link:", error);
            return res.status(500).json({
                error:
                    error instanceof Error
                        ? error.message
                        : "Unknown error occurred",
            });
        }
    }
);

// Add this endpoint to check account requirements
app.post(
    "/check-account-requirements",
    cors({ origin: true }),
    async (req: Request, res: Response) => {
        try {
            // Verify authentication
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith("Bearer ")) {
                return res.status(401).json({ error: "Unauthorized" });
            }

            const idToken = authHeader.split("Bearer ")[1];
            const decodedToken = await admin.auth().verifyIdToken(idToken);
            const userId = decodedToken.uid;

            // Get the stylist document
            const stylistRef = db.collection("stylists").doc(userId);
            const stylistDoc = await stylistRef.get();

            if (!stylistDoc.exists) {
                return res.status(404).json({ error: "Stylist not found" });
            }

            // Get the Stripe account ID
            const stylistData = stylistDoc.data();
            const accountId = stylistData?.stripeAccountId;

            if (!accountId) {
                return res
                    .status(400)
                    .json({ error: "No Stripe account found" });
            }

            // Retrieve the account details from Stripe
            const account = await stripe.accounts.retrieve(accountId);

            // Extract requirements information
            const requirements = {
                currentlyDue: account.requirements?.currently_due || [],
                eventuallyDue: account.requirements?.eventually_due || [],
                pendingVerification:
                    account.requirements?.pending_verification || [],
                disabled: account.requirements?.disabled_reason || null,
                chargesEnabled: account.charges_enabled,
                payoutsEnabled: account.payouts_enabled,
                detailsSubmitted: account.details_submitted,
            };

            // Update the stylist document with the latest requirements
            await stylistRef.update({
                stripeAccountRequirements: requirements,
                stripeAccountUpdatedAt:
                    admin.firestore.FieldValue.serverTimestamp(),
            });

            return res.status(200).json({ requirements });
        } catch (error) {
            console.error("Error checking account requirements:", error);
            return res.status(500).json({
                error:
                    error instanceof Error
                        ? error.message
                        : "Unknown error occurred",
            });
        }
    }
);

// Update the check-account-status endpoint to include more detailed account information
app.post(
    "/check-account-status",
    cors({ origin: true }),
    async (req: Request, res: Response) => {
        try {
            // Verify authentication
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith("Bearer ")) {
                return res.status(401).json({ error: "Unauthorized" });
            }

            const idToken = authHeader.split("Bearer ")[1];
            const decodedToken = await admin.auth().verifyIdToken(idToken);
            const userId = decodedToken.uid;

            // Get the stylist document
            const stylistRef = db.collection("stylists").doc(userId);
            const stylistDoc = await stylistRef.get();

            if (!stylistDoc.exists) {
                return res.status(404).json({ error: "Stylist not found" });
            }

            const stylistData = stylistDoc.data();
            let statusChanged = false;
            let accountDetails = null;

            // Check Stripe Connect account status if it exists
            if (stylistData?.stripeAccountId) {
                try {
                    const account = await stripe.accounts.retrieve(
                        stylistData.stripeAccountId
                    );

                    // Determine account status
                    let accountStatus = "pending";
                    if (account.charges_enabled && account.payouts_enabled) {
                        accountStatus = "active";
                    }

                    // Check if status has changed
                    if (stylistData.stripeAccountStatus !== accountStatus) {
                        await stylistRef.update({
                            stripeAccountStatus: accountStatus,
                            stripeAccountUpdatedAt:
                                admin.firestore.FieldValue.serverTimestamp(),
                        });
                        statusChanged = true;
                    }

                    // Get the balance for the account
                    const balance = await stripe.balance.retrieve({
                        stripeAccount: account.id,
                    });

                    // Get detailed requirements information
                    accountDetails = {
                        chargesEnabled: account.charges_enabled,
                        payoutsEnabled: account.payouts_enabled,
                        requirementsPending:
                            account.requirements?.currently_due?.length > 0,
                        requirementsCurrentlyDue:
                            account.requirements?.currently_due || [],
                        detailsSubmitted: account.details_submitted,
                        balance,
                    };
                } catch (error) {
                    console.error("Error retrieving Stripe account:", error);
                }
            }

            // Get subscription information
            const subscriptionData = stylistData?.subscription || null;

            // Return the combined status
            return res.status(200).json({
                status: stylistData?.stripeAccountStatus || "not_created",
                subscription: subscriptionData,
                details: accountDetails,
                statusChanged,
                priceInfo: {
                    amount: 1999, // $19.99 in cents
                    currency: "usd",
                    interval: "month",
                },
            });
        } catch (error) {
            console.error("Error checking account status:", error);
            return res.status(500).json({
                error:
                    error instanceof Error
                        ? error.message
                        : "Unknown error occurred",
            });
        }
    }
);

// get stripe account details
app.post(
    "/get-stripe-account-details",
    cors({ origin: true }),
    async (req: Request, res: Response) => {
        try {
            const { stylistId } = req.body;

            if (!stylistId) {
                return res
                    .status(400)
                    .json({ error: "Stylist ID is required" });
            }

            // Get the stylist document
            const stylistRef = db.collection("stylists").doc(stylistId);
            const stylistDoc = await stylistRef.get();

            if (!stylistDoc.exists) {
                return res.status(404).json({ error: "Stylist not found" });
            }

            const stylistData = stylistDoc.data();
            let statusChanged = false;
            let accountDetails = null;

            // Check Stripe Connect account status if it exists
            if (stylistData?.stripeAccountId) {
                try {
                    const account = await stripe.accounts.retrieve(
                        stylistData.stripeAccountId
                    );

                    // Determine account status
                    let accountStatus = "pending";
                    if (account.charges_enabled && account.payouts_enabled) {
                        accountStatus = "active";
                    }

                    console.log("accountStatus", accountStatus);
                    console.log(
                        "stylistData.stripeAccountStatus",
                        stylistData.stripeAccountStatus
                    );
                    // Check if status has changed
                    if (stylistData.stripeAccountStatus !== accountStatus) {
                        await stylistRef.update({
                            stripeAccountStatus: accountStatus,
                            stripeAccountUpdatedAt:
                                admin.firestore.FieldValue.serverTimestamp(),
                        });
                        statusChanged = true;
                    }

                    // Get the balance for the account
                    const balance = await stripe.balance.retrieve({
                        stripeAccount: account.id,
                    });

                    // Get detailed requirements information
                    accountDetails = {
                        chargesEnabled: account.charges_enabled,
                        payoutsEnabled: account.payouts_enabled,
                        requirementsPending:
                            account.requirements?.currently_due?.length > 0,
                        requirementsCurrentlyDue:
                            account.requirements?.currently_due || [],
                        detailsSubmitted: account.details_submitted,
                        balance,
                    };
                } catch (error) {
                    console.error("Error retrieving Stripe account:", error);
                }
            }

            // Get subscription information
            const subscriptionData = stylistData?.subscription || null;

            // Return the combined status
            return res.status(200).json({
                status: stylistData?.stripeAccountStatus || "not_created",
                subscription: subscriptionData,
                details: accountDetails,
                statusChanged,
                priceInfo: {
                    amount: 1999, // $19.99 in cents
                    currency: "usd",
                    interval: "month",
                },
            });
        } catch (error) {
            console.error("Error checking account status:", error);
            return res.status(500).json({
                error:
                    error instanceof Error
                        ? error.message
                        : "Unknown error occurred",
            });
        }
    }
);

// Get payment details
app.get(
    "/payment-details",
    cors({ origin: true }),
    async (req: Request, res: Response) => {
        try {
            // Verify authentication
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith("Bearer ")) {
                return res.status(401).json({ error: "Unauthorized" });
            }

            const idToken = authHeader.split("Bearer ")[1];
            const decodedToken = await admin.auth().verifyIdToken(idToken);
            const userId = decodedToken.uid;

            const sessionId = req.query.sessionId as string;

            if (!sessionId) {
                return res
                    .status(400)
                    .json({ error: "Session ID is required" });
            }

            // Get the session from Stripe
            const session = await stripe.checkout.sessions.retrieve(sessionId);

            // Verify that this session belongs to the authenticated user
            if (session.metadata?.userId !== userId) {
                return res
                    .status(403)
                    .json({ error: "Unauthorized access to payment data" });
            }

            // Get the payment from Firestore
            const paymentsQuery = await db
                .collection("payments")
                .where("stripeSessionId", "==", sessionId)
                .get();

            if (paymentsQuery.empty) {
                return res.status(404).json({ error: "Payment not found" });
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
                completedAt: paymentData.completedAt,
                bookingDateTime: paymentData.bookingData?.dateTime,
            });
        } catch (error) {
            console.error("Error getting payment details:", error);
            return res.status(500).json({
                error:
                    error instanceof Error
                        ? error.message
                        : "Unknown error occurred",
            });
        }
    }
);

app.get(
    "/test",
    cors({ origin: true }),
    async (req: Request, res: Response) => {
        return res.status(200).json({ message: "Hello, world!" });
    }
);

// Email endpoints
app.post(
    "/send-welcome-client-email",
    validateFirebaseIdToken,
    async (
        req: RequestWithRawBody & {
            body: { clientName: string; clientEmail: string };
            user?: admin.auth.DecodedIdToken;
        },
        res: Response
    ) => {
        try {
            const { clientName, clientEmail } = req.body;

            if (!clientName || !clientEmail) {
                return res
                    .status(400)
                    .json({ error: "Missing required parameters" });
            }

            await EmailService.sendWelcomeClientEmail({
                clientName,
                clientEmail,
            });

            return res.status(200).json({
                success: true,
                message: "Welcome email sent successfully",
            });
        } catch (error) {
            console.error("Error sending welcome client email:", error);
            return res.status(500).json({
                error:
                    error instanceof Error
                        ? error.message
                        : "Unknown error occurred",
            });
        }
    }
);

app.post(
    "/send-welcome-stylist-email",
    validateFirebaseIdToken,
    async (
        req: RequestWithRawBody & {
            body: { stylistName: string; stylistEmail: string };
            user?: admin.auth.DecodedIdToken;
        },
        res: Response
    ) => {
        try {
            const { stylistName, stylistEmail } = req.body;

            if (!stylistName || !stylistEmail) {
                return res
                    .status(400)
                    .json({ error: "Missing required parameters" });
            }

            await EmailService.sendWelcomeStylistEmail({
                stylistName,
                stylistEmail,
            });

            return res.status(200).json({
                success: true,
                message: "Welcome email sent successfully",
            });
        } catch (error) {
            console.error("Error sending welcome stylist email:", error);
            return res.status(500).json({
                error:
                    error instanceof Error
                        ? error.message
                        : "Unknown error occurred",
            });
        }
    }
);

app.post(
    "/send-appointment-confirmation-client",
    validateFirebaseIdToken,
    async (
        req: RequestWithRawBody & {
            body: {
                clientName: string;
                clientEmail: string;
                stylistName: string;
                appointmentDate: string;
                appointmentTime: string;
                serviceName: string;
            };
            user?: admin.auth.DecodedIdToken;
        },
        res: Response
    ) => {
        try {
            const {
                clientName,
                clientEmail,
                stylistName,
                appointmentDate,
                appointmentTime,
                serviceName,
            } = req.body;

            if (
                !clientName ||
                !clientEmail ||
                !stylistName ||
                !appointmentDate ||
                !appointmentTime ||
                !serviceName
            ) {
                return res
                    .status(400)
                    .json({ error: "Missing required parameters" });
            }

            await EmailService.sendAppointmentConfirmationClient({
                clientName,
                clientEmail,
                stylistName,
                appointmentDate,
                appointmentTime,
                serviceName,
            });

            return res.status(200).json({
                success: true,
                message: "Appointment confirmation email sent successfully",
            });
        } catch (error) {
            console.error(
                "Error sending appointment confirmation email:",
                error
            );
            return res.status(500).json({
                error:
                    error instanceof Error
                        ? error.message
                        : "Unknown error occurred",
            });
        }
    }
);

app.post(
    "/send-new-appointment-email-to-stylist",
    validateFirebaseIdToken,
    async (
        req: RequestWithRawBody & {
            body: {
                stylistName: string;
                stylistEmail: string;
                clientName: string;
                appointmentDate: string;
                appointmentTime: string;
                serviceName: string;
            };
            user?: admin.auth.DecodedIdToken;
        },
        res: Response
    ) => {
        try {
            const {
                stylistName,
                stylistEmail,
                clientName,
                appointmentDate,
                appointmentTime,
                serviceName,
            } = req.body;

            if (
                !stylistName ||
                !stylistEmail ||
                !clientName ||
                !appointmentDate ||
                !appointmentTime ||
                !serviceName
            ) {
                return res
                    .status(400)
                    .json({ error: "Missing required parameters" });
            }

            await EmailService.sendNewAppointmentForStylist({
                stylistName,
                stylistEmail,
                clientName,
                appointmentDate,
                appointmentTime,
                serviceName,
            });

            return res.status(200).json({
                success: true,
                message: "Appointment confirmation email sent successfully",
            });
        } catch (error) {
            console.error(
                "Error sending appointment confirmation email:",
                error
            );
            return res.status(500).json({
                error:
                    error instanceof Error
                        ? error.message
                        : "Unknown error occurred",
            });
        }
    }
);

app.post(
    "/send-payment-failure-stylist",
    validateFirebaseIdToken,
    async (
        req: RequestWithRawBody & {
            body: { stylistName: string; stylistEmail: string };
            user?: admin.auth.DecodedIdToken;
        },
        res: Response
    ) => {
        try {
            const { stylistName, stylistEmail } = req.body;

            if (!stylistName || !stylistEmail) {
                return res
                    .status(400)
                    .json({ error: "Missing required parameters" });
            }

            await EmailService.sendPaymentFailureForStylist({
                stylistName,
                stylistEmail,
            });

            return res.status(200).json({
                success: true,
                message: "Payment failure email sent successfully",
            });
        } catch (error) {
            console.error("Error sending payment failure email:", error);
            return res.status(500).json({
                error:
                    error instanceof Error
                        ? error.message
                        : "Unknown error occurred",
            });
        }
    }
);

app.post(
    "/send-account-cancellation-stylist",
    validateFirebaseIdToken,
    async (
        req: RequestWithRawBody & {
            body: { stylistName: string; stylistEmail: string };
            user?: admin.auth.DecodedIdToken;
        },
        res: Response
    ) => {
        try {
            const { stylistName, stylistEmail } = req.body;

            if (!stylistName || !stylistEmail) {
                return res
                    .status(400)
                    .json({ error: "Missing required parameters" });
            }

            await EmailService.sendAccountCancellationStylist({
                stylistName,
                stylistEmail,
            });

            return res.status(200).json({
                success: true,
                message: "Account cancellation email sent successfully",
            });
        } catch (error) {
            console.error("Error sending account cancellation email:", error);
            return res.status(500).json({
                error:
                    error instanceof Error
                        ? error.message
                        : "Unknown error occurred",
            });
        }
    }
);

app.post(
    "/send-appointment-denied-client",
    validateFirebaseIdToken,
    async (
        req: RequestWithRawBody & {
            body: {
                clientName: string;
                clientEmail: string;
                stylistName: string;
            };
            user?: admin.auth.DecodedIdToken;
        },
        res: Response
    ) => {
        try {
            const {
                clientName,
                clientEmail,
                stylistName,
                serviceName,
                appointmentDate,
                appointmentTime,
            } = req.body;

            if (!clientName || !clientEmail || !stylistName) {
                return res
                    .status(400)
                    .json({ error: "Missing required parameters" });
            }

            await EmailService.sendAppointmentDeniedClient({
                clientName,
                clientEmail,
                stylistName,
                serviceName,
                appointmentDate,
                appointmentTime,
            });

            return res.status(200).json({
                success: true,
                message: "Appointment denied email sent successfully",
            });
        } catch (error) {
            console.error("Error sending appointment denied email:", error);
            return res.status(500).json({
                error:
                    error instanceof Error
                        ? error.message
                        : "Unknown error occurred",
            });
        }
    }
);

app.post(
    "/send-full-payment-reminder-client",
    validateFirebaseIdToken,
    async (
        req: RequestWithRawBody & {
            body: {
                clientName: string;
                clientEmail: string;
                stylistName: string;
                appointmentDate: string;
                appointmentTime: string;
                serviceName: string;
                balanceAmount: string;
            };
            user?: admin.auth.DecodedIdToken;
        },
        res: Response
    ) => {
        try {
            const {
                clientName,
                clientEmail,
                stylistName,
                appointmentDate,
                appointmentTime,
                serviceName,
                balanceAmount,
            } = req.body;

            if (
                !clientName ||
                !clientEmail ||
                !stylistName ||
                !appointmentDate ||
                !appointmentTime ||
                !serviceName ||
                !balanceAmount
            ) {
                return res
                    .status(400)
                    .json({ error: "Missing required parameters" });
            }

            await EmailService.sendFullPaymentReminderForClient({
                clientName,
                clientEmail,
                stylistName,
                appointmentDate,
                appointmentTime,
                serviceName,
                balanceAmount,
            });

            return res.status(200).json({
                success: true,
                message: "Full payment reminder email sent successfully",
            });
        } catch (error) {
            console.error("Error sending full payment reminder email:", error);
            return res.status(500).json({
                error:
                    error instanceof Error
                        ? error.message
                        : "Unknown error occurred",
            });
        }
    }
);

app.post(
    "/send-message-notification-stylist",
    validateFirebaseIdToken,
    async (
        req: RequestWithRawBody & {
            body: {
                recipientName: string;
                recipientEmail: string;
                senderName: string;
            };
            user?: admin.auth.DecodedIdToken;
        },
        res: Response
    ) => {
        try {
            const { recipientName, recipientEmail, senderName } = req.body;

            if (!recipientName || !recipientEmail || !senderName) {
                return res
                    .status(400)
                    .json({ error: "Missing required parameters" });
            }

            await EmailService.sendMessageNotificationStylist({
                recipientName,
                recipientEmail,
                senderName,
            });

            return res.status(200).json({
                success: true,
                message: "Message notification email sent successfully",
            });
        } catch (error) {
            console.error("Error sending message notification email:", error);
            return res.status(500).json({
                error:
                    error instanceof Error
                        ? error.message
                        : "Unknown error occurred",
            });
        }
    }
);

app.post(
    "/send-message-notification-client",
    validateFirebaseIdToken,
    async (
        req: RequestWithRawBody & {
            body: {
                recipientName: string;
                recipientEmail: string;
                senderName: string;
            };
            user?: admin.auth.DecodedIdToken;
        },
        res: Response
    ) => {
        try {
            const { recipientName, recipientEmail, senderName } = req.body;

            if (!recipientName || !recipientEmail || !senderName) {
                return res
                    .status(400)
                    .json({ error: "Missing required parameters" });
            }

            await EmailService.sendMessageNotificationClient({
                recipientName,
                recipientEmail,
                senderName,
            });

            return res.status(200).json({
                success: true,
                message: "Message notification email sent successfully",
            });
        } catch (error) {
            console.error("Error sending message notification email:", error);
            return res.status(500).json({
                error:
                    error instanceof Error
                        ? error.message
                        : "Unknown error occurred",
            });
        }
    }
);

// sms endpoints
app.post(
    "/send-welcome-client-sms",
    // validateFirebaseIdToken,
    async (
        req: RequestWithRawBody & {
            body: { clientName: string; phoneNumber: string };
            // user?: admin.auth.DecodedIdToken;
        },
        res: Response
    ) => {
        try {
            const { clientName, phoneNumber } = req.body;

            if (!clientName || !phoneNumber) {
                return res
                    .status(400)
                    .json({ error: "Missing required parameters" });
            }

            console.log("clientName", clientName);
            console.log("phoneNumber", phoneNumber);

            const response = await SmsService.sendWelcomeClientSms({
                clientName,
                phoneNumber,
            });

            console.log("response", response);

            return res.status(200).json({
                success: true,
                message: "Welcome SMS sent successfully",
            });
        } catch (error) {
            console.error("Error sending welcome SMS:", error);
            return res.status(500).json({
                error:
                    error instanceof Error
                        ? error.message
                        : "Unknown error occurred",
            });
        }
    }
);

app.post(
    "/send-welcome-stylist-sms",
    // validateFirebaseIdToken,
    async (
        req: RequestWithRawBody & {
            body: { stylistName: string; phoneNumber: string };
            // user?: admin.auth.DecodedIdToken;
        },
        res: Response
    ) => {
        try {
            const { stylistName, phoneNumber } = req.body;

            if (!stylistName || !phoneNumber) {
                return res
                    .status(400)
                    .json({ error: "Missing required parameters" });
            }

            const response = await SmsService.sendWelcomeStylistSms({
                stylistName,
                phoneNumber,
            });

            console.log("response", response);

            return res.status(200).json({
                success: true,
                message: "Welcome SMS sent successfully",
            });
        } catch (error) {
            console.error("Error sending welcome SMS:", error);
            return res.status(500).json({
                error:
                    error instanceof Error
                        ? error.message
                        : "Unknown error occurred",
            });
        }
    }
);

app.post(
    "/send-appointment-booked-stylist-sms",
    async (
        req: RequestWithRawBody & {
            body: {
                stylistName: string;
                phoneNumber: string;
                appointmentDate: string;
                appointmentTime: string;
                serviceName: string;
                clientName: string;
            };
        },
        res: Response
    ) => {
        try {
            const {
                stylistName,
                phoneNumber,
                appointmentDate,
                appointmentTime,
                serviceName,
                clientName,
            } = req.body;
            if (
                !stylistName ||
                !phoneNumber ||
                !appointmentDate ||
                !appointmentTime ||
                !serviceName ||
                !clientName
            ) {
                return res
                    .status(400)
                    .json({ error: "Missing required parameters" });
            }
            await SmsService.sendAppointmentBookedStylistSms({
                stylistName,
                phoneNumber,
                appointmentDate,
                appointmentTime,
                serviceName,
                clientName,
            });
            return res.status(200).json({
                success: true,
                message: "Appointment booked SMS sent successfully",
            });
        } catch (error) {
            console.error("Error sending appointment booked SMS:", error);
            return res.status(500).json({
                error:
                    error instanceof Error
                        ? error.message
                        : "Unknown error occurred",
            });
        }
    }
);

app.post(
    "/send-full-payment-reminder-client-sms",
    async (
        req: RequestWithRawBody & {
            body: {
                clientName: string;
                phoneNumber: string;
                stylistName: string;
                appointmentDate: string;
                appointmentTime: string;
                balanceAmount: string;
            };
        },
        res: Response
    ) => {
        try {
            const {
                clientName,
                phoneNumber,
                serviceName,
                stylistName,
                appointmentDate,
                appointmentTime,
                balanceAmount,
            } = req.body;

            if (
                !clientName ||
                !phoneNumber ||
                !serviceName ||
                !stylistName ||
                !appointmentDate ||
                !appointmentTime ||
                !balanceAmount
            ) {
                return res
                    .status(400)
                    .json({ error: "Missing required parameters" });
            }

            await SmsService.sendFullPaymentReminderForClientSms({
                clientName,
                phoneNumber,
                serviceName,
                stylistName,
                appointmentDate,
                appointmentTime,
                balanceAmount,
            });

            return res.status(200).json({
                success: true,
                message: "Full payment reminder SMS sent successfully",
            });
        } catch (error) {
            console.error("Error sending full payment reminder SMS:", error);
            return res.status(500).json({
                error:
                    error instanceof Error
                        ? error.message
                        : "Unknown error occurred",
            });
        }
    }
);

app.post(
    "/send-subscription-payment-failed-stylist-sms",
    async (
        req: RequestWithRawBody & {
            body: {
                stylistName: string;
                phoneNumber: string;
                updatePaymentUrl: string;
            };
        },
        res: Response
    ) => {
        try {
            const { stylistName, phoneNumber, updatePaymentUrl } = req.body;
            if (!stylistName || !phoneNumber || !updatePaymentUrl) {
                return res
                    .status(400)
                    .json({ error: "Missing required parameters" });
            }
            await SmsService.sendSubscriptionPaymentFailedStylistSms({
                stylistName,
                phoneNumber,
                updatePaymentUrl,
            });
            return res.status(200).json({
                success: true,
                message: "Subscription payment failed SMS sent successfully",
            });
        } catch (error) {
            console.error(
                "Error sending subscription payment failed SMS:",
                error
            );
            return res.status(500).json({
                error:
                    error instanceof Error
                        ? error.message
                        : "Unknown error occurred",
            });
        }
    }
);

app.post(
    "/send-new-message-stylist-sms",
    async (
        req: RequestWithRawBody & {
            body: {
                stylistName: string;
                phoneNumber: string;
                clientName: string;
            };
        },
        res: Response
    ) => {
        try {
            const { stylistName, phoneNumber, clientName } = req.body;
            if (!stylistName || !phoneNumber || !clientName) {
                return res
                    .status(400)
                    .json({ error: "Missing required parameters" });
            }

            await SmsService.sendNewMessageStylistSms({
                stylistName,
                phoneNumber,
                clientName,
            });

            return res.status(200).json({
                success: true,
                message:
                    "New message notification SMS sent to stylist successfully",
            });
        } catch (error) {
            console.error(
                "Error sending new message notification SMS to stylist:",
                error
            );
            return res.status(500).json({
                error:
                    error instanceof Error
                        ? error.message
                        : "Unknown error occurred",
            });
        }
    }
);

app.post(
    "/send-new-message-client-sms",
    async (
        req: RequestWithRawBody & {
            body: {
                clientName: string;
                phoneNumber: string;
                stylistName: string;
            };
        },
        res: Response
    ) => {
        try {
            const { clientName, phoneNumber, stylistName } = req.body;
            if (!clientName || !phoneNumber || !stylistName) {
                return res
                    .status(400)
                    .json({ error: "Missing required parameters" });
            }
            await SmsService.sendNewMessageClientSms({
                clientName,
                phoneNumber,
                stylistName,
            });
            return res.status(200).json({
                success: true,
                message:
                    "New message notification SMS sent to client successfully",
            });
        } catch (error) {
            console.error(
                "Error sending new message notification SMS to client:",
                error
            );
            return res.status(500).json({
                error:
                    error instanceof Error
                        ? error.message
                        : "Unknown error occurred",
            });
        }
    }
);

// Request Payment Interface
interface RequestPaymentRequest {
    stylistId: string;
    appointmentId: string;
}

// Pay Appointment Interface
interface PayAppointmentRequest {
    clientId: string;
    appointmentId: string;
}

// Request Payment Endpoint
app.post(
    "/appointments/:id/request-payment",
    validateFirebaseIdToken,
    async (
        req: RequestWithRawBody & {
            body: RequestPaymentRequest;
            user?: admin.auth.DecodedIdToken;
            params: { id: string };
        },
        res: Response
    ) => {
        try {
            const { stylistId } = req.body;
            const appointmentId = req.params.id;

            // Verify authenticated user is the stylist
            if (stylistId !== req.user?.uid) {
                return res.status(403).json({ error: "Unauthorized access" });
            }

            // Get appointment details
            const appointmentRef = db.collection("bookings").doc(appointmentId);
            const appointmentDoc = await appointmentRef.get();

            if (!appointmentDoc.exists) {
                return res.status(404).json({ error: "Appointment not found" });
            }

            const appointmentData = appointmentDoc.data();

            // Check if appointment belongs to this stylist
            if (appointmentData?.stylistId !== stylistId) {
                return res.status(403).json({ error: "Unauthorized access" });
            }

            // Check if appointment is in a valid state for payment request
            // TODO: these values should be stored in enums
            if (appointmentData?.status !== "to-be-paid") {
                return res.status(400).json({
                    error: "Appointment must be confirmed or completed to request payment",
                });
            }

            // Send email and sms notification to client to get paid
            const date = format(appointmentData.dateTime, "yyyy-MM-dd");
            const time = format(appointmentData.dateTime, "HH:mm");
            // const amount =
            //     appointmentData.paymentAmount ||
            //     appointmentData.totalAmount
            // Send email notification
            setTimeout(async () => {
                try {
                    console.log(
                        "Sending email notification to client, payment request"
                    );
                    await EmailService.sendPaymentRequestedClient({
                        clientName: appointmentData.clientName,
                        clientEmail: appointmentData.clientEmail,
                        stylistName: appointmentData.stylistName,
                        serviceName: appointmentData.serviceName,
                        appointmentDate: date,
                        appointmentTime: time + " UTC",
                    });
                    console.log(
                        "Email notification sent to client, payment requested"
                    );
                } catch (error) {
                    console.error(
                        "Error sending payment requested email:",
                        error
                    );
                }
            }, 0);

            // Send SMS notification
            setTimeout(async () => {
                try {
                    await SmsService.sendPaymentRequestedClientSms({
                        clientName: appointmentData.clientName,
                        phoneNumber: appointmentData.clientPhone,
                        stylistName: appointmentData.stylistName,
                        serviceName: appointmentData.serviceName,
                        appointmentDate: date,
                        appointmentTime: time + " UTC",
                    });
                } catch (error) {
                    console.error(
                        "Error sending payment requested SMS:",
                        error
                    );
                }
            }, 0);

            return res.status(200).json({
                success: true,
                message: "Payment request sent to client successfully",
            });
        } catch (error) {
            console.error("Error requesting payment:", error);
            return res.status(500).json({
                error:
                    error instanceof Error
                        ? error.message
                        : "Unknown error occurred",
            });
        }
    }
);

// Pay Appointment Endpoint
app.post(
    "/appointments/:id/pay",
    validateFirebaseIdToken,
    async (
        req: RequestWithRawBody & {
            body: PayAppointmentRequest;
            user?: admin.auth.DecodedIdToken;
            params: { id: string };
        },
        res: Response
    ) => {
        try {
            const { clientId } = req.body;
            const bookingId = req.params.id;

            // Verify authenticated user is the client
            if (clientId !== req.user?.uid) {
                return res.status(403).json({ error: "Unauthorized access" });
            }

            // Get appointment details
            const appointmentRef = db.collection("bookings").doc(bookingId);
            const appointmentDoc = await appointmentRef.get();

            if (!appointmentDoc.exists) {
                return res.status(404).json({ error: "Appointment not found" });
            }

            const appointmentData = appointmentDoc.data();

            // Check if appointment belongs to this client
            if (appointmentData?.clientId !== clientId) {
                return res.status(403).json({ error: "Unauthorized access" });
            }

            console.log("appointmentData", appointmentData);

            // Check if appointment is in a valid state for payment
            const now = admin.firestore.Timestamp.now().toDate();
            const bookingDate = appointmentData.dateTime();
            if (now.getTime() >= bookingDate.getTime()) {
                return res.status(400).json({
                    error: "Appointment must be confirmed and started to make payment",
                });
            }

            const servicePrice = appointmentData.totalAmount || 0;
            const depositPaid = appointmentData.paymentAmount || 0;
            const remainingAmount = servicePrice - depositPaid;

            // Check if fully paid
            if (remainingAmount <= 0) {
                // Go to Transfer Flow - client already paid full amount
                console.log("client already paid full amount");
                return await handleTransferFlow(
                    bookingId,
                    appointmentData,
                    res
                );
            } else {
                // Go to Stripe Checkout Flow - client only paid deposit
                return await handleStripeCheckoutFlow(
                    bookingId,
                    appointmentData,
                    remainingAmount,
                    req,
                    res
                );
            }
        } catch (error) {
            console.error("Error processing payment:", error);
            return res.status(500).json({
                error:
                    error instanceof Error
                        ? error.message
                        : "Unknown error occurred",
            });
        }
    }
);

// Helper function to handle transfer flow (client already paid full amount)
async function handleTransferFlow(
    appointmentId: string,
    appointmentData: any,
    res?: Response
) {
    try {
        const stylistId = appointmentData.stylistId;
        const servicePrice = appointmentData.totalAmount || 0;
        const applicationFee = servicePrice * 0.05; // 5% application fee
        const transferableAmount = servicePrice - applicationFee;

        // Get stylist's unpaid fines
        const finesQuery = await db
            .collection("stylist_fines")
            .where("stylistId", "==", stylistId)
            .where("status", "==", "pending")
            .orderBy("createdAt", "asc")
            .get();

        let totalFinesDeducted = 0;
        const coveredFineIds: string[] = [];
        let finalTransferableAmount = transferableAmount;

        // Process fines deduction
        for (const fineDoc of finesQuery.docs) {
            const fineData = fineDoc.data();
            const remainingFineAmount =
                fineData.remainingAmount || fineData.fineAmount;

            if (remainingFineAmount > 0 && finalTransferableAmount > 0) {
                const amountToDeduct = Math.min(
                    remainingFineAmount,
                    finalTransferableAmount
                );

                // Update fine record
                await fineDoc.ref.update({
                    deductedAmount:
                        (fineData.deductedAmount || 0) + amountToDeduct,
                    remainingAmount: remainingFineAmount - amountToDeduct,
                    status:
                        remainingFineAmount - amountToDeduct <= 0
                            ? "paid"
                            : "pending",
                    lastDeductedAt:
                        admin.firestore.FieldValue.serverTimestamp(),
                });

                totalFinesDeducted += amountToDeduct;
                finalTransferableAmount -= amountToDeduct;
                coveredFineIds.push(fineDoc.id);

                if (finalTransferableAmount <= 0) break;
            }
        }

        // Get stylist's Stripe account
        const stylistRef = db.collection("stylists").doc(stylistId);
        const stylistDoc = await stylistRef.get();
        const stylistData = stylistDoc.data();

        if (!stylistData?.stripeAccountId) {
            if (res) {
                return res.status(400).json({
                    error: "Stylist does not have an active payment account",
                });
            } else {
                throw new Error(
                    "Stylist does not have an active payment account"
                );
            }
        }

        // Transfer remaining amount to stylist via Stripe
        if (finalTransferableAmount > 0) {
            const transfer = await stripe.transfers.create({
                amount: Math.round(finalTransferableAmount * 100), // Convert to cents
                currency: "usd",
                destination: stylistData.stripeAccountId,
                metadata: {
                    appointmentId,
                    total_fines_deducted: totalFinesDeducted.toString(),
                    covered_fine_ids: coveredFineIds.join(","),
                    application_fee: applicationFee.toString(),
                    transfer_type: "final_payment",
                },
            });

            // Update stylist balance
            await updateStylistBalance(
                stylistId,
                Math.round(finalTransferableAmount * 100),
                `Payment for appointment ${appointmentId}`
            );
        }

        // Update appointment status
        await db.collection("bookings").doc(appointmentId).update({
            status: "paid",
            paymentStatus: "paid",
            finalPaymentCompletedAt:
                admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            finesDeducted: totalFinesDeducted,
            coveredFineIds,
            finalTransferAmount: finalTransferableAmount,
        });

        // Notify stylist
        await db.collection("notifications").add({
            userId: stylistId,
            type: "payment_received",
            title: "Payment Received",
            message: `You received $${finalTransferableAmount.toFixed(2)} for appointment ${appointmentId}. $${totalFinesDeducted.toFixed(2)} in fines were deducted.`,
            read: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            data: {
                appointmentId,
                amountReceived: finalTransferableAmount,
                finesDeducted: totalFinesDeducted,
                coveredFineIds,
            },
        });

        if (res) {
            return res.status(200).json({
                success: true,
                message: "Payment processed successfully",
                data: {
                    amountTransferred: finalTransferableAmount,
                    finesDeducted: totalFinesDeducted,
                    coveredFineIds,
                },
            });
        } else {
            // Webhook case - just return the data
            return {
                success: true,
                amountTransferred: finalTransferableAmount,
                finesDeducted: totalFinesDeducted,
                coveredFineIds,
            };
        }
    } catch (error) {
        console.error("Error in transfer flow:", error);
        throw error;
    }
}

// Helper function to handle Stripe checkout flow (client needs to pay remaining amount)
async function handleStripeCheckoutFlow(
    appointmentId: string,
    appointmentData: any,
    remainingAmount: number,
    req: RequestWithRawBody,
    res: Response
) {
    try {
        const clientId = appointmentData.clientId;
        const stylistId = appointmentData.stylistId;

        // Get client's Stripe customer ID
        const clientRef = db.collection("clients").doc(clientId);
        const clientDoc = await clientRef.get();
        const clientData = clientDoc.data();

        let stripeCustomerId: string;

        if (!clientDoc.exists || !clientData?.stripeCustomerId) {
            // Create new Stripe customer
            const userRecord = await admin.auth().getUser(clientId);
            const customer = await stripe.customers.create({
                email: userRecord.email,
                metadata: { userId: clientId },
            });

            await clientRef.set(
                {
                    email: userRecord.email,
                    stripeCustomerId: customer.id,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                },
                { merge: true }
            );

            stripeCustomerId = customer.id;
        } else {
            stripeCustomerId = clientData.stripeCustomerId;
        }

        // Create Stripe checkout session for remaining payment
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            mode: "payment",
            customer: stripeCustomerId,
            line_items: [
                {
                    price_data: {
                        currency: "usd",
                        product_data: {
                            name: `Payment - ${appointmentData.serviceName}`,
                            metadata: {
                                appointmentId,
                                stylistId,
                                clientId,
                            },
                        },
                        unit_amount: Math.round(remainingAmount * 100),
                    },
                    quantity: 1,
                },
            ],
            success_url: `${req.headers.origin}/dashboard/client?payment_success=true`,
            cancel_url: `${req.headers.origin}/dashboard/client?payment_success=false`,
            metadata: {
                appointmentId,
                stylistId,
                clientId,
                paymentType: "final_payment",
            },
        });

        return res.status(200).json({
            success: true,
            sessionId: session.id,
            url: session.url,
        });
    } catch (error) {
        console.error("Error in Stripe checkout flow:", error);
        throw error;
    }
}

// Reschedule Proposal Interface
interface ProposeRescheduleRequest {
    appointmentId: string;
    proposedDateTime: Date;
    reason?: string;
}

// Accept/Reject Reschedule Interface
interface RescheduleResponseRequest {
    appointmentId: string;
}

// Google Calendar Interfaces
interface GoogleCalendarTokensRequest {
    access_token: string;
    refresh_token?: string;
    expiry_date?: number;
    scope?: string;
    token_type?: string;
}

interface GoogleCalendarSettingsRequest {
    isConnected?: boolean;
    autoSync?: boolean;
}

// Propose Reschedule Endpoint
app.post(
    "/propose-reschedule",
    validateFirebaseIdToken,
    async (
        req: RequestWithRawBody & {
            body: ProposeRescheduleRequest;
            user?: admin.auth.DecodedIdToken;
        },
        res: Response
    ) => {
        try {
            const { bookingId, proposedDateTime, reason } = req.body;
            const userId = req.user?.uid;

            if (!userId) {
                return res
                    .status(401)
                    .json({ error: "User not authenticated" });
            }

            if (!bookingId || !proposedDateTime) {
                return res.status(400).json({
                    error: "Booking ID and proposed date/time are required",
                });
            }

            // Get appointment details
            const appointmentRef = db.collection("bookings").doc(bookingId);
            const appointmentDoc = await appointmentRef.get();

            if (!appointmentDoc.exists) {
                return res.status(404).json({ error: "Appointment not found" });
            }

            const appointmentData = appointmentDoc.data();

            // Verify user is either the client or stylist for this appointment
            if (
                appointmentData?.clientId !== userId &&
                appointmentData?.stylistId !== userId
            ) {
                return res
                    .status(403)
                    .json({ error: "Unauthorized access to appointment" });
            }

            // Check if appointment is in a valid state for rescheduling
            if (appointmentData?.status !== "confirmed") {
                return res.status(400).json({
                    error: "Only confirmed appointments can be rescheduled",
                });
            }

            // Check if there's already a pending reschedule proposal
            if (appointmentData?.rescheduleProposal?.status === "pending") {
                return res.status(400).json({
                    error: "There is already a pending reschedule proposal for this appointment",
                });
            }

            // Determine who is proposing the reschedule
            const proposedBy =
                appointmentData?.clientId === userId ? "client" : "stylist";
            const proposedByName =
                appointmentData?.clientId === userId
                    ? appointmentData?.clientName
                    : appointmentData?.stylistName;

            // Validate the proposed date/time
            const now = new Date(admin.firestore.Timestamp.now().toDate());
            const proposedDate = new Date(proposedDateTime);

            console.log("now", now);
            console.log("proposedDate", proposedDate);

            if (proposedDate.getTime() <= now.getTime()) {
                return res.status(400).json({
                    error: "Proposed date/time must be in the future",
                });
            }

            // Create reschedule proposal
            const rescheduleProposal = {
                proposedDateTime,
                proposedBy,
                proposedAt: admin.firestore.FieldValue.serverTimestamp(),
                reason,
                status: "pending" as const,
            };

            // Update appointment with reschedule proposal
            await appointmentRef.update({
                rescheduleProposal,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            // Send notifications to the other party
            const oldDate = format(appointmentData.dateTime, "yyyy-MM-dd");
            const oldTime = format(appointmentData.dateTime, "HH:mm");
            const newDate = format(proposedDate, "yyyy-MM-dd");
            const newTime = format(proposedDate, "HH:mm");

            // Determine recipient details
            const isClientProposing = proposedBy === "client";
            const recipientName = isClientProposing
                ? appointmentData.stylistName
                : appointmentData.clientName;
            const recipientEmail = isClientProposing
                ? appointmentData.stylistEmail
                : appointmentData.clientEmail;
            const recipientPhone = isClientProposing
                ? appointmentData.stylistPhone
                : appointmentData.clientPhone;

            // Send email notification
            setTimeout(async () => {
                try {
                    await EmailService.sendRescheduleProposalNotification({
                        recipientName,
                        recipientEmail,
                        proposedBy: proposedByName,
                        serviceName: appointmentData.serviceName,
                        oldAppointmentDate: oldDate,
                        oldAppointmentTime: oldTime,
                        newAppointmentDate: newDate,
                        newAppointmentTime: newTime,
                    });
                } catch (error) {
                    console.error(
                        "Error sending reschedule proposal email:",
                        error
                    );
                }
            }, 0);

            // Send SMS notification
            if (recipientPhone) {
                setTimeout(async () => {
                    try {
                        await SmsService.sendRescheduleProposalSms({
                            recipientName,
                            phoneNumber: recipientPhone,
                            proposedBy: proposedByName,
                            serviceName: appointmentData.serviceName,
                            oldAppointmentDate: oldDate,
                            oldAppointmentTime: oldTime,
                            newAppointmentDate: newDate,
                            newAppointmentTime: newTime,
                        });
                    } catch (error) {
                        console.error(
                            "Error sending reschedule proposal SMS:",
                            error
                        );
                    }
                }, 0);
            }

            return res.status(200).json({
                success: true,
                message: "Reschedule proposal sent successfully",
                rescheduleProposal,
            });
        } catch (error) {
            console.error("Error proposing reschedule:", error);
            return res.status(500).json({
                error:
                    error instanceof Error
                        ? error.message
                        : "Unknown error occurred",
            });
        }
    }
);

// Accept Reschedule Proposal Endpoint
app.post(
    "/accept-reschedule",
    validateFirebaseIdToken,
    async (
        req: RequestWithRawBody & {
            body: RescheduleResponseRequest;
            user?: admin.auth.DecodedIdToken;
        },
        res: Response
    ) => {
        try {
            const { bookingId } = req.body;
            const userId = req.user?.uid;

            if (!userId) {
                return res
                    .status(401)
                    .json({ error: "User not authenticated" });
            }

            if (!bookingId) {
                return res
                    .status(400)
                    .json({ error: "Booking ID is required" });
            }

            // Get appointment details
            const appointmentRef = db.collection("bookings").doc(bookingId);
            const appointmentDoc = await appointmentRef.get();

            if (!appointmentDoc.exists) {
                return res.status(404).json({ error: "Appointment not found" });
            }

            const appointmentData = appointmentDoc.data();

            // Verify user is the other party (not the one who proposed)
            const rescheduleProposal = appointmentData?.rescheduleProposal;
            if (
                !rescheduleProposal ||
                rescheduleProposal.status !== "pending"
            ) {
                return res.status(400).json({
                    error: "No pending reschedule proposal found",
                });
            }

            const isClient = appointmentData?.clientId === userId;
            const isStylist = appointmentData?.stylistId === userId;

            if (!isClient && !isStylist) {
                return res
                    .status(403)
                    .json({ error: "Unauthorized access to appointment" });
            }

            // Check that the user is not the one who proposed the reschedule
            const proposedBy = rescheduleProposal.proposedBy;
            if (
                (isClient && proposedBy === "client") ||
                (isStylist && proposedBy === "stylist")
            ) {
                return res.status(400).json({
                    error: "You cannot accept your own reschedule proposal",
                });
            }

            // Update appointment with new date/time and remove reschedule proposal
            const newDateTime = rescheduleProposal.proposedDateTime;

            await appointmentRef.update({
                dateTime: newDateTime,
                rescheduleProposal: admin.firestore.FieldValue.delete(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            // Send confirmation notifications
            const newDate = format(newDateTime, "yyyy-MM-dd");
            const newTime = format(newDateTime, "HH:mm") + " UTC";

            // Notify the person who proposed the reschedule
            const proposerName =
                proposedBy === "client"
                    ? appointmentData.clientName
                    : appointmentData.stylistName;
            const proposerEmail =
                proposedBy === "client"
                    ? appointmentData.clientEmail
                    : appointmentData.stylistEmail;
            const proposerPhone =
                proposedBy === "client"
                    ? appointmentData.clientPhone
                    : appointmentData.stylistPhone;

            // Send email notification to proposer
            setTimeout(async () => {
                try {
                    await EmailService.sendRescheduleAcceptedNotification({
                        recipientName: proposerName,
                        recipientEmail: proposerEmail,
                        acceptedBy: isClient
                            ? appointmentData.clientName
                            : appointmentData.stylistName,
                        serviceName: appointmentData.serviceName,
                        newAppointmentDate: newDate,
                        newAppointmentTime: newTime,
                    });
                } catch (error) {
                    console.error(
                        "Error sending reschedule acceptance email:",
                        error
                    );
                }
            }, 0);

            // Send SMS notification to proposer
            if (proposerPhone) {
                setTimeout(async () => {
                    try {
                        await SmsService.sendRescheduleAcceptedSms({
                            recipientName: proposerName,
                            phoneNumber: proposerPhone,
                            acceptedBy: isClient
                                ? appointmentData.clientName
                                : appointmentData.stylistName,
                            serviceName: appointmentData.serviceName,
                            newAppointmentDate: newDate,
                            newAppointmentTime: newTime,
                        });
                    } catch (error) {
                        console.error(
                            "Error sending reschedule acceptance SMS:",
                            error
                        );
                    }
                }, 0);
            }

            return res.status(200).json({
                success: true,
                message: "Reschedule proposal accepted successfully",
                newDateTime,
            });
        } catch (error) {
            console.error("Error accepting reschedule:", error);
            return res.status(500).json({
                error:
                    error instanceof Error
                        ? error.message
                        : "Unknown error occurred",
            });
        }
    }
);

// Reject Reschedule Proposal Endpoint
app.post(
    "/reject-reschedule",
    validateFirebaseIdToken,
    async (
        req: RequestWithRawBody & {
            body: RescheduleResponseRequest;
            user?: admin.auth.DecodedIdToken;
        },
        res: Response
    ) => {
        try {
            const { bookingId } = req.body;
            const userId = req.user?.uid;

            if (!userId) {
                return res
                    .status(401)
                    .json({ error: "User not authenticated" });
            }

            if (!bookingId) {
                return res
                    .status(400)
                    .json({ error: "Booking ID is required" });
            }

            // Get appointment details
            const appointmentRef = db.collection("bookings").doc(bookingId);
            const appointmentDoc = await appointmentRef.get();

            if (!appointmentDoc.exists) {
                return res.status(404).json({ error: "Appointment not found" });
            }

            const appointmentData = appointmentDoc.data();

            // Verify user is the other party (not the one who proposed)
            const rescheduleProposal = appointmentData?.rescheduleProposal;
            if (
                !rescheduleProposal ||
                rescheduleProposal.status !== "pending"
            ) {
                return res.status(400).json({
                    error: "No pending reschedule proposal found",
                });
            }

            const isClient = appointmentData?.clientId === userId;
            const isStylist = appointmentData?.stylistId === userId;

            if (!isClient && !isStylist) {
                return res
                    .status(403)
                    .json({ error: "Unauthorized access to appointment" });
            }

            // Check that the user is not the one who proposed the reschedule
            const proposedBy = rescheduleProposal.proposedBy;
            if (
                (isClient && proposedBy === "client") ||
                (isStylist && proposedBy === "stylist")
            ) {
                return res.status(400).json({
                    error: "You cannot reject your own reschedule proposal",
                });
            }

            // Remove reschedule proposal
            await appointmentRef.update({
                rescheduleProposal: admin.firestore.FieldValue.delete(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            // Send notification to the person who proposed the reschedule
            const proposerName =
                proposedBy === "client"
                    ? appointmentData.clientName
                    : appointmentData.stylistName;
            const proposerPhone =
                proposedBy === "client"
                    ? appointmentData.clientPhone
                    : appointmentData.stylistPhone;
            const proposerEmail =
                proposedBy === "client"
                    ? appointmentData.clientEmail
                    : appointmentData.stylistEmail;

            const oldDateTime = appointmentData.dateTime;
            const oldDate = format(oldDateTime, "yyyy-MM-dd");
            const oldTime = format(oldDateTime, "HH:mm") + " UTC";
            // Send SMS notification to proposer
            if (proposerPhone) {
                setTimeout(async () => {
                    try {
                        await SmsService.sendRescheduleRejectedSms({
                            recipientName: proposerName,
                            phoneNumber: proposerPhone,
                            rejectedBy: isClient
                                ? appointmentData.clientName
                                : appointmentData.stylistName,
                            serviceName: appointmentData.serviceName,
                            oldAppointmentDate: oldDate,
                            oldAppointmentTime: oldTime,
                        });
                    } catch (error) {
                        console.error(
                            "Error sending reschedule rejection SMS:",
                            error
                        );
                    }
                }, 0);
            }

            // Send email notification to proposer
            if (proposerEmail) {
                setTimeout(async () => {
                    try {
                        await EmailService.sendRescheduleRejectedNotification({
                            recipientName: proposerName,
                            recipientEmail: proposerEmail,
                            rejectedBy: isClient
                                ? appointmentData.clientName
                                : appointmentData.stylistName,
                            serviceName: appointmentData.serviceName,
                            oldAppointmentDate: oldDate,
                            oldAppointmentTime: oldTime,
                        });
                    } catch (error) {
                        console.error(
                            "Error sending reschedule rejection email:",
                            error
                        );
                    }
                }, 0);
            }

            return res.status(200).json({
                success: true,
                message: "Reschedule proposal rejected successfully",
            });
        } catch (error) {
            console.error("Error rejecting reschedule:", error);
            return res.status(500).json({
                error:
                    error instanceof Error
                        ? error.message
                        : "Unknown error occurred",
            });
        }
    }
);

// Google Calendar API Endpoints

// Save Google Calendar tokens
app.post(
    "/google-calendar/tokens",
    validateFirebaseIdToken,
    async (
        req: RequestWithRawBody & {
            body: GoogleCalendarTokensRequest;
            user?: admin.auth.DecodedIdToken;
        },
        res: Response
    ) => {
        try {
            const {
                access_token,
                refresh_token,
                expiry_date,
                scope,
                token_type,
            } = req.body;
            const userId = req.user?.uid;

            if (!userId) {
                return res
                    .status(401)
                    .json({ error: "User not authenticated" });
            }

            if (!access_token) {
                return res
                    .status(400)
                    .json({ error: "Access token is required" });
            }

            // Save tokens to database
            const docRef = db
                .collection("users")
                .doc(userId)
                .collection("settings")
                .doc("googleCalendar");
            await docRef.set({
                isConnected: true,
                tokens: {
                    access_token,
                    refresh_token,
                    expiry_date,
                    scope,
                    token_type,
                },
                lastSyncAt: admin.firestore.FieldValue.serverTimestamp(),
                autoSync: true,
            });

            return res.status(200).json({
                success: true,
                message: "Google Calendar tokens saved successfully",
            });
        } catch (error) {
            console.error("Error saving Google Calendar tokens:", error);
            return res.status(500).json({
                error:
                    error instanceof Error
                        ? error.message
                        : "Unknown error occurred",
            });
        }
    }
);

// Get Google Calendar settings
app.get(
    "/google-calendar/settings",
    validateFirebaseIdToken,
    async (
        req: RequestWithRawBody & {
            user?: admin.auth.DecodedIdToken;
        },
        res: Response
    ) => {
        try {
            const userId = req.user?.uid;

            if (!userId) {
                return res
                    .status(401)
                    .json({ error: "User not authenticated" });
            }

            // Get settings from database
            const docRef = db
                .collection("users")
                .doc(userId)
                .collection("settings")
                .doc("googleCalendar");
            const docSnap = await docRef.get();

            if (!docSnap.exists) {
                return res.status(200).json({
                    isConnected: false,
                    tokens: null,
                    lastSyncAt: null,
                    autoSync: true,
                });
            }

            const data = docSnap.data();
            return res.status(200).json(data);
        } catch (error) {
            console.error("Error getting Google Calendar settings:", error);
            return res.status(500).json({
                error:
                    error instanceof Error
                        ? error.message
                        : "Unknown error occurred",
            });
        }
    }
);

// Update Google Calendar settings
app.put(
    "/google-calendar/settings",
    validateFirebaseIdToken,
    async (
        req: RequestWithRawBody & {
            body: GoogleCalendarSettingsRequest;
            user?: admin.auth.DecodedIdToken;
        },
        res: Response
    ) => {
        try {
            const { isConnected, autoSync } = req.body;
            const userId = req.user?.uid;

            if (!userId) {
                return res
                    .status(401)
                    .json({ error: "User not authenticated" });
            }

            // Update settings in database
            const docRef = db
                .collection("users")
                .doc(userId)
                .collection("settings")
                .doc("googleCalendar");
            await docRef.update({
                ...(isConnected !== undefined && { isConnected }),
                ...(autoSync !== undefined && { autoSync }),
                lastSyncAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            return res.status(200).json({
                success: true,
                message: "Google Calendar settings updated successfully",
            });
        } catch (error) {
            console.error("Error updating Google Calendar settings:", error);
            return res.status(500).json({
                error:
                    error instanceof Error
                        ? error.message
                        : "Unknown error occurred",
            });
        }
    }
);

// Disconnect Google Calendar
app.delete(
    "/google-calendar/disconnect",
    validateFirebaseIdToken,
    async (
        req: RequestWithRawBody & {
            user?: admin.auth.DecodedIdToken;
        },
        res: Response
    ) => {
        try {
            const userId = req.user?.uid;

            if (!userId) {
                return res
                    .status(401)
                    .json({ error: "User not authenticated" });
            }

            // Delete settings from database
            const docRef = db
                .collection("users")
                .doc(userId)
                .collection("settings")
                .doc("googleCalendar");
            await docRef.delete();

            return res.status(200).json({
                success: true,
                message: "Google Calendar disconnected successfully",
            });
        } catch (error) {
            console.error("Error disconnecting Google Calendar:", error);
            return res.status(500).json({
                error:
                    error instanceof Error
                        ? error.message
                        : "Unknown error occurred",
            });
        }
    }
);

// Export the Express app as a Firebase Function
export const api = functions.https.onRequest(app);
