import sgMail from "@sendgrid/mail";
import * as functions from "firebase-functions";

// Initialize SendGrid
const config = functions.config();
const apiKey = config.sendgrid?.api_key || process.env.SENDGRID_API_KEY || "";

console.log("API Key length:", apiKey.length);
console.log("API Key starts with SG:", apiKey.startsWith("SG."));

if (!apiKey) {
    console.warn(
        "SendGrid API key not found. Email functionality will be disabled."
    );
} else {
    console.log("SendGrid API key found, initializing...");
    sgMail.setApiKey(apiKey);
}

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
    private static readonly FROM_EMAIL = "noreply@braidsnow.com";
    private static readonly FROM_NAME = "BraidsNow.com Team";

    // SendGrid Template IDs - Replace with your actual template IDs
    private static readonly TEMPLATE_IDS = {
        WELCOME_CLIENT: "d-dbd9d2febc2c49c8b6f65e78a77f4afa",
        WELCOME_STYLIST: "d-d5a94d15d6a54b0db3c7e7e0662f11af",
        APPOINTMENT_CONFIRMATION_CLIENT: "d-cc30e8a95686446982237661f1039c64",
        NEW_APPOINTMENT_STYLIST: "d-820164bfe177443cb64e676dbd5b391c",
        PAYMENT_FAILURE_STYLIST: "d-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        ACCOUNT_CANCELLATION_STYLIST: "d-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        APPOINTMENT_DENIED_CLIENT: "d-fe871d8b2cda4185b06da9298ea2c33f",
        FULL_PAYMENT_REMINDER_CLIENT: "d-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        MESSAGE_NOTIFICATION_STYLIST: "d-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        MESSAGE_NOTIFICATION_CLIENT: "d-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    };

    private static async sendEmail(emailData: EmailData): Promise<void> {
        try {
            // Check if SendGrid API key is properly configured
            if (!apiKey) {
                console.warn("SendGrid not configured. Skipping email send.");
                return;
            }

            const msg = {
                to: emailData.to,
                from: {
                    email: EmailService.FROM_EMAIL,
                    name: EmailService.FROM_NAME,
                },
                templateId: emailData.templateId,
                dynamicTemplateData: emailData.dynamicTemplateData,
            };

            await sgMail.send(msg);
            console.log(
                `Email sent successfully to ${emailData.to} using template ${emailData.templateId}`
            );
        } catch (error) {
            console.error(
                "Error sending email:",
                error.response,
                error.response.body
            );
            throw error;
        }
    }

    // 1. Welcome Email – Clients
    static async sendWelcomeClientEmail(
        data: WelcomeClientData
    ): Promise<void> {
        await this.sendEmail({
            to: data.clientEmail,
            templateId: EmailService.TEMPLATE_IDS.WELCOME_CLIENT,
            dynamicTemplateData: {
                clientName: data.clientName,
                dashboardUrl: "https://braidsnow.com/dashboard/client",
                findStylistsUrl: "https://braidsnow.com/find-stylists",
            },
        });
    }

    // 2. Welcome Email – Stylists
    static async sendWelcomeStylistEmail(
        data: WelcomeStylistData
    ): Promise<void> {
        await this.sendEmail({
            to: data.stylistEmail,
            templateId: EmailService.TEMPLATE_IDS.WELCOME_STYLIST,
            dynamicTemplateData: {
                stylistName: data.stylistName,
                dashboardUrl: "https://braidsnow.com/dashboard/stylist",
                paymentsUrl: "https://braidsnow.com/dashboard/stylist/payments",
            },
        });
    }

    // 3. Appointment Confirmation – Client
    static async sendAppointmentConfirmationClient(
        data: AppointmentConfirmationData
    ): Promise<void> {
        await this.sendEmail({
            to: data.clientEmail,
            templateId:
                EmailService.TEMPLATE_IDS.APPOINTMENT_CONFIRMATION_CLIENT,
            dynamicTemplateData: {
                clientName: data.clientName,
                stylistName: data.stylistName,
                appointmentDate: data.appointmentDate,
                appointmentTime: data.appointmentTime,
                serviceName: data.serviceName,
                dashboardUrl: "https://braidsnow.com/dashboard/client",
            },
        });
    }

    // 4. Appointment Confirmation – Stylist
    static async sendNewAppointmentForStylist(
        data: StylistAppointmentData
    ): Promise<void> {
        await this.sendEmail({
            to: data.stylistEmail,
            templateId:
                EmailService.TEMPLATE_IDS.NEW_APPOINTMENT_STYLIST,
            dynamicTemplateData: {
                stylistName: data.stylistName,
                clientName: data.clientName,
                appointmentDate: data.appointmentDate,
                appointmentTime: data.appointmentTime,
                serviceName: data.serviceName,
                url: "https://braidsnow.com/dashboard/stylist/appointments",
            },
        });
    }

    // 5. Payment Failure – Stylist
    static async sendPaymentFailureStylist(
        data: PaymentFailureData
    ): Promise<void> {
        await this.sendEmail({
            to: data.stylistEmail,
            templateId: EmailService.TEMPLATE_IDS.PAYMENT_FAILURE_STYLIST,
            dynamicTemplateData: {
                stylistName: data.stylistName,
                paymentsUrl: "https://braidsnow.com/dashboard/stylist/payments",
            },
        });
    }

    // 6. Account Cancellation – Stylist
    static async sendAccountCancellationStylist(
        data: AccountCancellationData
    ): Promise<void> {
        await this.sendEmail({
            to: data.stylistEmail,
            templateId: EmailService.TEMPLATE_IDS.ACCOUNT_CANCELLATION_STYLIST,
            dynamicTemplateData: {
                stylistName: data.stylistName,
                reactivateUrl: "https://braidsnow.com/stylist-community",
            },
        });
    }

    // 7. Appointment Denied – Client
    static async sendAppointmentDeniedClient(
        data: AppointmentDeniedData
    ): Promise<void> {
        await this.sendEmail({
            to: data.clientEmail,
            templateId: EmailService.TEMPLATE_IDS.APPOINTMENT_DENIED_CLIENT,
            dynamicTemplateData: {
                clientName: data.clientName,
                stylistName: data.stylistName,
                findStylistsUrl: "https://braidsnow.com/find-stylists",
            },
        });
    }

    // 8. Full Payment Required – Client (After Deposit Paid)
    static async sendFullPaymentReminderClient(
        data: FullPaymentReminderData
    ): Promise<void> {
        await this.sendEmail({
            to: data.clientEmail,
            templateId: EmailService.TEMPLATE_IDS.FULL_PAYMENT_REMINDER_CLIENT,
            dynamicTemplateData: {
                clientName: data.clientName,
                stylistName: data.stylistName,
                appointmentDate: data.appointmentDate,
                appointmentTime: data.appointmentTime,
                serviceName: data.serviceName,
                balanceAmount: data.balanceAmount,
                dashboardUrl: "https://braidsnow.com/dashboard/client",
            },
        });
    }

    // 9. Stylist Receives Message from Client
    static async sendMessageNotificationStylist(
        data: MessageNotificationData
    ): Promise<void> {
        await this.sendEmail({
            to: data.recipientEmail,
            templateId: EmailService.TEMPLATE_IDS.MESSAGE_NOTIFICATION_STYLIST,
            dynamicTemplateData: {
                recipientName: data.recipientName,
                senderName: data.senderName,
                dashboardUrl: "https://braidsnow.com/dashboard/stylist",
            },
        });
    }

    // 10. Client Receives Message from Stylist
    static async sendMessageNotificationClient(
        data: MessageNotificationData
    ): Promise<void> {
        await this.sendEmail({
            to: data.recipientEmail,
            templateId: EmailService.TEMPLATE_IDS.MESSAGE_NOTIFICATION_CLIENT,
            dynamicTemplateData: {
                recipientName: data.recipientName,
                senderName: data.senderName,
                dashboardUrl: "https://braidsnow.com/dashboard/client",
            },
        });
    }

    // Add this method to your EmailService class
    static async sendTestEmail(to: string): Promise<void> {
        try {
            if (!apiKey) {
                console.warn("SendGrid not configured. Skipping test email.");
                return;
            }

            const msg = {
                to: to,
                from: {
                    email: EmailService.FROM_EMAIL,
                    name: EmailService.FROM_NAME,
                },
                subject: "Test Email from BraidsNow",
                html: "<p>This is a test email to verify SendGrid is working.</p>",
            };

            await sgMail.send(msg);
            console.log(`Test email sent successfully to ${to}`);
        } catch (error) {
            console.error("Error sending test email:", error);
            throw error;
        }
    }
}
