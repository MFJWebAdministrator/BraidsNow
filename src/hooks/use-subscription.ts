import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./use-auth";
import { auth } from "@/lib/firebase/config";
import axios from "axios";

// Use the same interface as PaymentsContent.tsx for consistency
export interface SubscriptionStatus {
    status?: string;
    subscription?: {
        id?: string;
        status?: string;
        currentPeriodStart?: {
            _seconds: number;
            _nanoseconds: number;
        };
        currentPeriodEnd?: {
            _seconds: number;
            _nanoseconds: number;
        };
        priceId?: string;
        cancelAtPeriodEnd?: boolean;
        canceledAt?: {
            _seconds: number;
            _nanoseconds: number;
        };
        updatedAt?: {
            _seconds: number;
            _nanoseconds: number;
        };
    };
    details?: {
        chargesEnabled?: boolean;
        payoutsEnabled?: boolean;
        requirementsPending?: boolean;
        requirementsCurrentlyDue?: string[];
        detailsSubmitted?: boolean;
    };
    statusChanged?: boolean;
    priceInfo?: {
        amount?: number;
        currency?: string;
        interval?: string;
    };
}

interface UseSubscriptionReturn {
    isActive: boolean;
    isLoading: boolean;
    subscriptionStatus: SubscriptionStatus | null;
    hasAccess: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

const API_BASE_URL = import.meta.env.VITE_API_URL;

export function useSubscription(): UseSubscriptionReturn {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [subscriptionStatus, setSubscriptionStatus] =
        useState<SubscriptionStatus | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Function to fetch subscription status from Firebase function
    const fetchSubscriptionStatus = useCallback(async () => {
        if (!user?.uid) {
            setIsLoading(false);
            setSubscriptionStatus(null);
            setError(null);
            return;
        }

        try {
            setIsLoading(true);
            setError(null);

            // Get fresh ID token
            const idToken = await auth.currentUser?.getIdToken(true);

            // Call the Express API endpoint (same as PaymentsContent)
            const response = await axios.post(
                `${API_BASE_URL}/check-account-status`,
                { userId: user.uid },
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${idToken}`,
                    },
                }
            );

            setSubscriptionStatus(response.data);
        } catch (err) {
            console.error("Error fetching subscription status:", err);
            setError("Failed to load subscription status");
        } finally {
            setIsLoading(false);
        }
    }, [user?.uid]);

    // Initial fetch
    useEffect(() => {
        fetchSubscriptionStatus();
    }, [fetchSubscriptionStatus]);

    // Determine if subscription is active
    const isActive = (() => {
        if (!subscriptionStatus?.subscription) return false;

        // Check if subscription status is active
        if (subscriptionStatus.subscription.status !== "active") return false;

        // Check if subscription is not canceled or if it's canceled but still within the period
        if (subscriptionStatus.subscription.cancelAtPeriodEnd) {
            // If canceled but still within the period, consider it active
            if (subscriptionStatus.subscription.currentPeriodEnd) {
                const periodEnd = new Date(
                    subscriptionStatus.subscription.currentPeriodEnd._seconds *
                        1000
                );
                return new Date() < periodEnd;
            }
            return false;
        }

        return true;
    })();

    // Determine if user has access to premium features
    // Access requires both active subscription AND payout account enabled
    const hasAccess =
        isActive && subscriptionStatus?.details?.payoutsEnabled === true;

    return {
        isActive,
        isLoading,
        subscriptionStatus,
        hasAccess,
        error,
        refetch: fetchSubscriptionStatus,
    };
}
