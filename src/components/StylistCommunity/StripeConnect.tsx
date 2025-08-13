import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, CreditCard } from "lucide-react";
import { loadStripe as loadStripeLib } from "@stripe/stripe-js";

import axios from "axios";
import { auth } from "@/lib/firebase/config";

// Use the same API base URL as in PaymentsContent.tsx
const API_BASE_URL = "https://api-5prtp2eqea-uc.a.run.app";

// Helper function to ensure origin URL is properly formatted for Stripe
const getFormattedOriginUrl = () => {
    const origin = window.location.origin;

    // Stripe accepts localhost URLs, but we need to ensure they're properly formatted
    if (origin.includes("localhost")) {
        // Make sure it has the proper protocol
        if (!origin.startsWith("http://") && !origin.startsWith("https://")) {
            return `http://${origin}`;
        }
    }

    return origin;
};

interface StripeConnectProps {
    subscriptionActive: boolean;
    subscriptionPrice?: number;
    subscriptionInterval?: string;
}

export function StripeConnect({
    subscriptionActive,
    subscriptionPrice = 19.99,
    subscriptionInterval = "month",
}: StripeConnectProps) {
    const [loading, setLoading] = useState<"subscription" | null>(null);
    const { toast } = useToast();
    const { user } = useAuth();

    const handleSubscribe = async () => {
        if (!user || !user.uid) {
            toast({
                title: "Authentication Error",
                description: "You must be logged in to subscribe.",
                variant: "destructive",
                duration: 3000,
            });
            return;
        }

        // If subscription is already active, don't allow subscribing again
        if (subscriptionActive) {
            toast({
                title: "Subscription Active",
                description: "You already have an active subscription.",
                variant: "destructive",
                duration: 3000,
            });
            return;
        }

        setLoading("subscription");
        try {
            console.log("Setting up subscription for user ID:", user.uid);

            // Get fresh ID token
            const idToken = await auth.currentUser?.getIdToken(true);
            if (!idToken) {
                throw new Error("Failed to get authentication token");
            }

            // Get properly formatted origin URL
            const originUrl = getFormattedOriginUrl();

            // Call the Express API endpoint
            const response = await axios.post(
                `${API_BASE_URL}/create-checkout-session`,
                {
                    userId: user.uid,
                    email: user.email || "",
                    successUrl: `${originUrl}/dashboard/stylist/payments?success=true`,
                    cancelUrl: `${originUrl}/dashboard/stylist/payments?canceled=true`,
                    mode: "subscription", // Explicitly set mode to subscription
                    priceId: import.meta.env.VITE_STRIPE_PRICE_ID, // Use the price ID from environment variables
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${idToken}`,
                    },
                }
            );

            console.log("Checkout session created:", response.data);

            // Show processing toast before redirect
            toast({
                title: "Processing Subscription",
                description:
                    "You're being redirected to the secure payment page.",
                variant: "default",
                duration: 3000,
            });

            // Redirect to Stripe Checkout
            const { sessionId } = response.data;
            const stripe = await loadStripe(
                import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
            );
            if (stripe) {
                await stripe.redirectToCheckout({ sessionId });
            } else {
                throw new Error("Failed to load Stripe");
            }
        } catch (error) {
            console.error("Error setting up subscription:", error);

            // Provide more specific error messages based on the error type
            let errorMessage =
                "Failed to set up subscription. Please try again.";

            if (error instanceof Error) {
                if (error.message.includes("authentication")) {
                    errorMessage =
                        "Authentication error. Please log out and log back in.";
                } else if (error.message.includes("network")) {
                    errorMessage =
                        "Network error. Please check your internet connection.";
                } else if (error.message.includes("Stripe")) {
                    errorMessage =
                        "Payment processor error. Please try again later.";
                } else if (error.message.includes("recurring price")) {
                    errorMessage =
                        "Subscription configuration error. Please contact support.";
                }
            }

            toast({
                title: "Subscription Error",
                description: errorMessage,
                variant: "destructive",
                duration: 3000,
            });
        } finally {
            setLoading(null);
        }
    };

    // Format the price with currency symbol
    const formattedPrice = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
    }).format(subscriptionPrice);

    return (
        <div className="space-y-4">
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <h3 className="text-xl font-semibold mb-2 text-[#3F0052]">
                    Professional Stylist Plan
                </h3>
                <div className="flex items-baseline mb-4">
                    <span className="text-3xl font-bold">{formattedPrice}</span>
                    <span className="text-gray-500 ml-1">
                        /{subscriptionInterval}
                    </span>
                </div>

                <ul className="space-y-2 mb-6">
                    <li className="flex items-start">
                        <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                        <span>Accept client bookings</span>
                    </li>
                    <li className="flex items-start">
                        <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                        <span>Process payments securely</span>
                    </li>
                    <li className="flex items-start">
                        <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                        <span>Showcase your portfolio</span>
                    </li>
                    <li className="flex items-start">
                        <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                        <span>Priority customer support</span>
                    </li>
                </ul>

                <Button
                    onClick={handleSubscribe}
                    className="w-full bg-[#3F0052] hover:bg-[#2A0038] text-white"
                    disabled={loading === "subscription"}
                >
                    {loading === "subscription" ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                        </>
                    ) : (
                        <>
                            <CreditCard className="mr-2 h-4 w-4" />
                            Subscribe Now
                        </>
                    )}
                </Button>

                <p className="text-sm text-gray-500 text-center mt-4">
                    Cancel anytime. Subscription renews monthly.
                </p>
            </div>
        </div>
    );
}

// Helper function to load Stripe
export async function loadStripe(key: string) {
    return loadStripeLib(key);
}

// Simple check icon component
function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <polyline points="20 6 9 17 4 12" />
        </svg>
    );
}
