// Frontend Email Service using Firebase Functions API
// This service sends emails through our Firebase Functions backend

export interface EmailData {
    to: string;
    templateId: string;
    dynamicTemplateData: Record<string, any>;
}

export interface WelcomeClientData {
    clientName: string;
    clientEmail: string;
}

export interface WelcomeStylistData {
    stylistName: string;
    stylistEmail: string;
}

export interface AppointmentConfirmationData {
    clientName: string;
    clientEmail: string;
    stylistName: string;
    appointmentDate: string;
    appointmentTime: string;
    serviceName: string;
}

export interface StylistAppointmentData {
    stylistName: string;
    stylistEmail: string;
    clientName: string;
    appointmentDate: string;
    appointmentTime: string;
    serviceName: string;
}

export interface PaymentFailureData {
    stylistName: string;
    stylistEmail: string;
}

export interface AccountCancellationData {
    stylistName: string;
    stylistEmail: string;
}

export interface AppointmentDeniedData {
    clientName: string;
    clientEmail: string;
    stylistName: string;
}

export interface FullPaymentReminderData {
    clientName: string;
    clientEmail: string;
    stylistName: string;
    appointmentDate: string;
    appointmentTime: string;
    serviceName: string;
    balanceAmount: string;
}

export interface MessageNotificationData {
    recipientName: string;
    recipientEmail: string;
    senderName: string;
    userType: "client" | "stylist";
}

export class EmailService {
    private static readonly API_BASE_URL =
        import.meta.env.VITE_API_URL ||
        "https://us-central1-braidsnow.cloudfunctions.net/api";

    private static async makeApiRequest(
        endpoint: string,
        data: any
    ): Promise<void> {
        try {
            const response = await fetch(
                `${EmailService.API_BASE_URL}${endpoint}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        // Note: Authentication will be handled by the browser's automatic cookie handling
                        // or you can add your Firebase ID token here if needed
                    },
                    body: JSON.stringify(data),
                    credentials: "include", // Include cookies for authentication
                }
            );

            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(`API error: ${response.status} - ${errorData}`);
            }

            const result = await response.json();
            console.log(
                `Email sent successfully via ${endpoint}:`,
                result.message
            );
        } catch (error) {
            console.error("Error sending email:", error);
            throw error;
        }
    }

    // 1. Welcome Email – Clients
    static async sendWelcomeClientEmail(
        data: WelcomeClientData
    ): Promise<void> {
        await this.makeApiRequest("/send-welcome-client-email", {
            clientName: data.clientName,
            clientEmail: data.clientEmail,
        });
    }

    // 2. Welcome Email – Stylists
    static async sendWelcomeStylistEmail(
        data: WelcomeStylistData
    ): Promise<void> {
        await this.makeApiRequest("/send-welcome-stylist-email", {
            stylistName: data.stylistName,
            stylistEmail: data.stylistEmail,
        });
    }

    // 3. Appointment Confirmation – Client
    static async sendAppointmentConfirmationClient(
        data: AppointmentConfirmationData
    ): Promise<void> {
        await this.makeApiRequest("/send-appointment-confirmation-client", {
            clientName: data.clientName,
            clientEmail: data.clientEmail,
            stylistName: data.stylistName,
            appointmentDate: data.appointmentDate,
            appointmentTime: data.appointmentTime,
            serviceName: data.serviceName,
        });
    }

    // 4. Appointment Confirmation – Stylist
    static async sendAppointmentConfirmationStylist(
        data: StylistAppointmentData
    ): Promise<void> {
        await this.makeApiRequest("/send-appointment-confirmation-stylist", {
            stylistName: data.stylistName,
            stylistEmail: data.stylistEmail,
            clientName: data.clientName,
            appointmentDate: data.appointmentDate,
            appointmentTime: data.appointmentTime,
            serviceName: data.serviceName,
        });
    }

    // 5. Payment Failure – Stylist
    static async sendPaymentFailureStylist(
        data: PaymentFailureData
    ): Promise<void> {
        await this.makeApiRequest("/send-payment-failure-stylist", {
            stylistName: data.stylistName,
            stylistEmail: data.stylistEmail,
        });
    }

    // 6. Account Cancellation – Stylist
    static async sendAccountCancellationStylist(
        data: AccountCancellationData
    ): Promise<void> {
        await this.makeApiRequest("/send-account-cancellation-stylist", {
            stylistName: data.stylistName,
            stylistEmail: data.stylistEmail,
        });
    }

    // 7. Appointment Denied – Client
    static async sendAppointmentDeniedClient(
        data: AppointmentDeniedData
    ): Promise<void> {
        await this.makeApiRequest("/send-appointment-denied-client", {
            clientName: data.clientName,
            clientEmail: data.clientEmail,
            stylistName: data.stylistName,
        });
    }

    // 8. Full Payment Required – Client (After Deposit Paid)
    static async sendFullPaymentReminderClient(
        data: FullPaymentReminderData
    ): Promise<void> {
        await this.makeApiRequest("/send-full-payment-reminder-client", {
            clientName: data.clientName,
            clientEmail: data.clientEmail,
            stylistName: data.stylistName,
            appointmentDate: data.appointmentDate,
            appointmentTime: data.appointmentTime,
            serviceName: data.serviceName,
            balanceAmount: data.balanceAmount,
        });
    }

    // 9. Stylist Receives Message from Client
    static async sendMessageNotificationStylist(
        data: MessageNotificationData
    ): Promise<void> {
        await this.makeApiRequest("/send-message-notification-stylist", {
            recipientName: data.recipientName,
            recipientEmail: data.recipientEmail,
            senderName: data.senderName,
            userType: data.userType,
        });
    }

    // 10. Client Receives Message from Stylist
    static async sendMessageNotificationClient(
        data: MessageNotificationData
    ): Promise<void> {
        await this.makeApiRequest("/send-message-notification-client", {
            recipientName: data.recipientName,
            recipientEmail: data.recipientEmail,
            senderName: data.senderName,
            userType: data.userType,
        });
    }
}
