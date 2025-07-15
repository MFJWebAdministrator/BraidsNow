import axios from "axios";
import { auth } from "@/lib/firebase/config";
import { loadStripe as loadStripeLib } from "@stripe/stripe-js";

// Define the API base URL - make sure we're using the correct endpoint
// During development, you might want to use the emulator URL
const isLocalDev =
    import.meta.env.DEV && import.meta.env.VITE_USE_EMULATOR === "true";
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
    return loadStripeLib(key);
};

// Email API functions
export const sendWelcomeClientEmail = async (
    clientName: string,
    clientEmail: string
) => {
    return apiRequest("/send-welcome-client-email", {
        clientName,
        clientEmail,
    });
};

export const sendWelcomeStylistEmail = async (
    stylistName: string,
    stylistEmail: string
) => {
    return apiRequest("/send-welcome-stylist-email", {
        stylistName,
        stylistEmail,
    });
};

export const sendAppointmentConfirmationClient = async (data: {
    clientName: string;
    clientEmail: string;
    stylistName: string;
    appointmentDate: string;
    appointmentTime: string;
    serviceName: string;
}) => {
    return apiRequest("/send-appointment-confirmation-client", data);
};

export const sendNewAppointmentForStylist = async (data: {
    stylistName: string;
    stylistEmail: string;
    clientName: string;
    appointmentDate: string;
    appointmentTime: string;
    serviceName: string;
}) => {
    console.log("data", data);
    return apiRequest("/send-new-appointment-email-to-stylist", data);
};

export const sendPaymentFailureForStylist = async (
    stylistName: string,
    stylistEmail: string
) => {
    return apiRequest("/send-payment-failure-stylist", {
        stylistName,
        stylistEmail,
    });
};

export const sendAccountCancellationStylist = async (
    stylistName: string,
    stylistEmail: string
) => {
    return apiRequest("/send-account-cancellation-stylist", {
        stylistName,
        stylistEmail,
    });
};

export const sendAppointmentDeniedClient = async (data: {
    clientName: string;
    clientEmail: string;
    stylistName: string;
}) => {
    return apiRequest("/send-appointment-denied-client", data);
};

export const sendFullPaymentReminderForClient = async (data: {
    clientName: string;
    clientEmail: string;
    stylistName: string;
    appointmentDate: string;
    appointmentTime: string;
    serviceName: string;
    balanceAmount: string;
}) => {
    return apiRequest("/send-full-payment-reminder-client", data);
};

export const sendMessageNotificationStylist = async (data: {
    recipientName: string;
    recipientEmail: string;
    senderName: string;
}) => {
    return apiRequest("/send-message-notification-stylist", data);
};

export const sendMessageNotificationClient = async (data: {
    recipientName: string;
    recipientEmail: string;
    senderName: string;
}) => {
    return apiRequest("/send-message-notification-client", data);
};

// SMS API functions
export const sendWelcomeClientSms = async (
    clientName: string,
    phoneNumber: string
) => {
    return apiRequest("/send-welcome-client-sms", {
        clientName,
        phoneNumber,
    });
};

export const sendWelcomeStylistSms = async (
    stylistName: string,
    phoneNumber: string
) => {
    return apiRequest("/send-welcome-stylist-sms", {
        stylistName,
        phoneNumber,
    });
};

export const sendAppointmentBookedStylistSms = async (data: {
    stylistName: string;
    phoneNumber: string;
    appointmentDate: string;
    appointmentTime: string;
    serviceName: string;
    clientName: string;
}) => {
    return apiRequest("/send-appointment-booked-stylist-sms", data);
};

export const sendSubscriptionPaymentFailedStylistSms = async (data: {
    stylistName: string;
    phoneNumber: string;
    updatePaymentUrl: string;
}) => {
    return apiRequest("/send-subscription-payment-failed-stylist-sms", data);
};

export const sendNewMessageStylistSms = async (data: {
    stylistName: string;
    phoneNumber: string;
    clientName: string;
}) => {
    return apiRequest("/send-new-message-stylist-sms", data);
};

export const sendNewMessageClientSms = async (data: {
    clientName: string;
    phoneNumber: string;
    stylistName: string;
}) => {
    return apiRequest("/send-new-message-client-sms", data);
};
