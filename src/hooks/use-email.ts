import { useState } from "react";
import {
    sendWelcomeClientEmail as sendWelcomeClientEmailAPI,
    sendWelcomeStylistEmail as sendWelcomeStylistEmailAPI,
    sendAppointmentConfirmationClient as sendAppointmentConfirmationClientAPI,
    sendNewAppointmentForStylist as sendNewAppointmentForStylistAPI,
    sendPaymentFailureForStylist as sendPaymentFailureStylistAPI,
    sendAccountCancellationStylist as sendAccountCancellationStylistAPI,
    sendAppointmentDeniedClient as sendAppointmentDeniedClientAPI,
    sendFullPaymentReminderForClient as sendFullPaymentReminderForClientAPI,
    sendMessageNotificationStylist as sendMessageNotificationStylistAPI,
    sendMessageNotificationClient as sendMessageNotificationClientAPI,
} from "@/lib/api-client";

import type {
    WelcomeClientData,
    WelcomeStylistData,
    AppointmentConfirmationData,
    StylistAppointmentData,
    PaymentFailureData,
    AccountCancellationData,
    AppointmentDeniedData,
    FullPaymentReminderData,
    MessageNotificationData,
} from "@/lib/email-service";

interface EmailState {
    loading: boolean;
    error: string | null;
    success: boolean;
}

export const useEmail = () => {
    const [state, setState] = useState<EmailState>({
        loading: false,
        error: null,
        success: false,
    });

    const resetState = () => {
        setState({ loading: false, error: null, success: false });
    };

    const sendEmail = async (emailFunction: () => Promise<any>) => {
        setState({ loading: true, error: null, success: false });

        try {
            await emailFunction();
            setState({ loading: false, error: null, success: true });
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : "Failed to send email";
            setState({ loading: false, error: errorMessage, success: false });
        }
    };

    // Welcome Emails
    const sendWelcomeClientEmail = async (data: WelcomeClientData) => {
        await sendEmail(() =>
            sendWelcomeClientEmailAPI(data.clientName, data.clientEmail)
        );
    };

    const sendWelcomeStylistEmail = async (data: WelcomeStylistData) => {
        await sendEmail(() =>
            sendWelcomeStylistEmailAPI(data.stylistName, data.stylistEmail)
        );
    };

    // Appointment Emails
    const sendAppointmentConfirmationClient = async (
        data: AppointmentConfirmationData
    ) => {
        await sendEmail(() => sendAppointmentConfirmationClientAPI(data));
    };

    const sendNewAppointmentForStylist = async (
        data: StylistAppointmentData
    ) => {
        await sendEmail(() => sendNewAppointmentForStylistAPI(data));
    };

    const sendAppointmentDeniedClient = async (data: AppointmentDeniedData) => {
        await sendEmail(() => sendAppointmentDeniedClientAPI(data));
    };

    const sendFullPaymentReminderForClient = async (
        data: FullPaymentReminderData
    ) => {
        await sendEmail(() => sendFullPaymentReminderForClientAPI(data));
    };

    // Payment & Account Emails
    const sendPaymentFailureForStylist = async (data: PaymentFailureData) => {
        await sendEmail(() =>
            sendPaymentFailureStylistAPI(data.stylistName, data.stylistEmail)
        );
    };

    const sendAccountCancellationStylist = async (
        data: AccountCancellationData
    ) => {
        await sendEmail(() =>
            sendAccountCancellationStylistAPI(
                data.stylistName,
                data.stylistEmail
            )
        );
    };

    // Message Notification Emails
    const sendMessageNotificationStylist = async (
        data: MessageNotificationData
    ) => {
        await sendEmail(() => sendMessageNotificationStylistAPI(data));
    };

    const sendMessageNotificationClient = async (
        data: MessageNotificationData
    ) => {
        await sendEmail(() => sendMessageNotificationClientAPI(data));
    };

    return {
        // State
        loading: state.loading,
        error: state.error,
        success: state.success,

        // Actions
        resetState,

        // Email functions
        sendWelcomeClientEmail,
        sendWelcomeStylistEmail,
        sendAppointmentConfirmationClient,
        sendNewAppointmentForStylist,
        sendAppointmentDeniedClient,
        sendFullPaymentReminderForClient,
        sendPaymentFailureForStylist,
        sendAccountCancellationStylist,
        sendMessageNotificationStylist,
        sendMessageNotificationClient,
    };
};
