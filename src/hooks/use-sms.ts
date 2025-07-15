import { useState } from "react";
import {
    sendWelcomeClientSms as sendWelcomeClientSmsAPI,
    sendWelcomeStylistSms as sendWelcomeStylistSmsAPI,
    sendAppointmentBookedStylistSms as sendAppointmentBookedStylistSmsAPI,
    sendSubscriptionPaymentFailedStylistSms as sendSubscriptionPaymentFailedStylistSmsAPI,
    sendNewMessageStylistSms as sendNewMessageStylistSmsAPI,
    sendNewMessageClientSms as sendNewMessageClientSmsAPI,
} from "@/lib/api-client";

interface SmsState {
    loading: boolean;
    error: string | null;
    success: boolean;
}

export const useSms = () => {
    const [state, setState] = useState<SmsState>({
        loading: false,
        error: null,
        success: false,
    });

    const resetState = () => {
        setState({ loading: false, error: null, success: false });
    };

    const sendSms = async (smsFunction: () => Promise<any>) => {
        setState({ loading: true, error: null, success: false });
        try {
            await smsFunction();
            setState({ loading: false, error: null, success: true });
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : "Failed to send SMS";
            setState({ loading: false, error: errorMessage, success: false });
        }
    };

    // Welcome SMS
    const sendWelcomeClientSms = async (
        clientName: string,
        phoneNumber: string
    ) => {
        await sendSms(() => sendWelcomeClientSmsAPI(clientName, phoneNumber));
    };
    const sendWelcomeStylistSms = async (
        stylistName: string,
        phoneNumber: string
    ) => {
        await sendSms(() => sendWelcomeStylistSmsAPI(stylistName, phoneNumber));
    };

    // Appointment Booked SMS
    const sendAppointmentBookedStylistSms = async (data: {
        stylistName: string;
        phoneNumber: string;
        appointmentDate: string;
        appointmentTime: string;
        serviceName: string;
        clientName: string;
    }) => {
        await sendSms(() => sendAppointmentBookedStylistSmsAPI(data));
    };

    // Subscription Payment Failed SMS
    const sendSubscriptionPaymentFailedStylistSms = async (data: {
        stylistName: string;
        phoneNumber: string;
        updatePaymentUrl: string;
    }) => {
        await sendSms(() => sendSubscriptionPaymentFailedStylistSmsAPI(data));
    };

    // New Message Notification SMS
    const sendNewMessageStylistSms = async (data: {
        stylistName: string;
        phoneNumber: string;
        clientName: string;
    }) => {
        await sendSms(() => sendNewMessageStylistSmsAPI(data));
    };
    const sendNewMessageClientSms = async (data: {
        clientName: string;
        phoneNumber: string;
        stylistName: string;
    }) => {
        await sendSms(() => sendNewMessageClientSmsAPI(data));
    };

    return {
        loading: state.loading,
        error: state.error,
        success: state.success,
        resetState,
        sendWelcomeClientSms,
        sendWelcomeStylistSms,
        sendAppointmentBookedStylistSms,
        sendSubscriptionPaymentFailedStylistSms,
        sendNewMessageStylistSms,
        sendNewMessageClientSms,
    };
};
