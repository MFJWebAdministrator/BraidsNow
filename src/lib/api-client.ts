import axios from "axios";
import { auth } from "@/lib/firebase/config";

// Define the API base URL - make sure we're using the correct endpoint
// During development, you might want to use the emulator URL
const isLocalDev =
    process.env.NODE_ENV === "development" &&
    process.env.REACT_APP_USE_EMULATOR === "true";
const API_BASE_URL = isLocalDev
    ? "http://localhost:5001/braidsnow/us-central1/api"
    : import.meta.env.VITE_API_URL;

// Helper function to get a fresh ID token
const getIdToken = async () => {
    if (!auth.currentUser) {
        throw new Error("No authenticated user");
    }
    return auth.currentUser.getIdToken(true);
};

// Helper function to make authenticated API requests
// Add error handling and logging to help debug issues
const apiRequest = async (endpoint: string, data: any) => {
    try {
        const idToken = await getIdToken();
        console.log(`Making API request to ${endpoint}`);

        const response = await axios.post(`${API_BASE_URL}${endpoint}`, data, {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${idToken}`,
            },
        });

        console.log(`API response from ${endpoint}:`, response.status);
        return response;
    } catch (error) {
        console.error(`API request to ${endpoint} failed:`, error);
        if (axios.isAxiosError(error) && error.response) {
            console.error("Response data:", error.response.data);
            console.error("Response status:", error.response.status);
        }
        throw error;
    }
};

// API functions
export const checkAccountStatus = async (userId: string) => {
    return apiRequest("/check-account-status", { userId });
};

export const createCheckoutSession = async (
    userId: string,
    email: string,
    successUrl?: string,
    cancelUrl?: string
) => {
    return apiRequest("/create-checkout-session", {
        userId,
        email,
        successUrl,
        cancelUrl,
    });
};

export const createConnectAccount = async (
    userId: string,
    email: string,
    origin: string
) => {
    return apiRequest("/create-connect-account", {
        userId,
        email,
        origin,
    });
};

// Helper function to load Stripe
export const loadStripe = async (key: string) => {
    if (!window.Stripe) {
        const script = document.createElement("script");
        script.src = "https://js.stripe.com/v3/";
        script.async = true;
        document.body.appendChild(script);

        await new Promise((resolve) => {
            script.onload = resolve;
        });
    }

    return window.Stripe(key);
};

// Add Stripe to the Window interface
declare global {
    interface Window {
        Stripe?: any;
    }
}
