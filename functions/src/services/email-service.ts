import sgMail from "@sendgrid/mail";

// Initialize SendGrid
const apiKey = process.env.SENDGRID_API_KEY || "";

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
    serviceName: string;
    appointmentDate: string;
    appointmentTime: string;
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
}

export interface PaymentRequestedData {
    clientName: string;
    clientEmail: string;
    stylistName: string;
    serviceName: string;
    appointmentDate: string;
    appointmentTime: string;
}

export interface RescheduleProposalData {
    recipientName: string;
    recipientEmail: string;
    proposedBy: string; // Name of person who proposed the reschedule
    serviceName: string;
    oldAppointmentDate: string;
    oldAppointmentTime: string;
    newAppointmentDate: string;
    newAppointmentTime: string;
}

export interface RescheduleAcceptedData {
    recipientName: string;
    recipientEmail: string;
    acceptedBy: string; // Name of person who accepted the reschedule
    serviceName: string;
    newAppointmentDate: string;
    newAppointmentTime: string;
}

export interface RescheduleRejectedData {
    recipientName: string;
    recipientEmail: string;
    rejectedBy: string; // Name of person who rejected the reschedule
    serviceName: string;
    oldAppointmentDate: string;
    oldAppointmentTime: string;
}

export class EmailService {
    private static readonly FROM_EMAIL = "noreply@braidsnow.com";
    private static readonly FROM_NAME = "BraidsNow.com Team";

    // SendGrid Template IDs - Replace with your actual template IDs
    private static readonly TEMPLATE_IDS = {
        WELCOME_CLIENT: "d-dbd9d2febc2c49c8b6f65e78a77f4afa",
        WELCOME_STYLIST: "d-d5a94d15d6a54b0db3c7e7e0662f11af",
        NEW_APPOINTMENT_STYLIST: "d-820164bfe177443cb64e676dbd5b391c",
        APPOINTMENT_CONFIRMATION_CLIENT: "d-cc30e8a95686446982237661f1039c64",
        APPOINTMENT_DENIED_CLIENT: "d-fe871d8b2cda4185b06da9298ea2c33f",
        APPOINTMENT_AUTO_CANCELLED_CLIENT: "d-68772c7964ec4b70a04cbf17afd95c5d",
        APPOINTMENT_AUTO_CANCELLED_STYLIST:
            "d-b50b1471906d487fbea8a99860d20f7b",
        APPOINTMENT_CANCELLED_CLIENT: "d-d8243e24a5484130814ec6644fd3df72",
        APPOINTMENT_CANCELLED_STYLIST: "d-62c1442cb3c04f67955c421424fd7c35",
        PAYMENT_FAILURE_STYLIST: "d-a644b936e4ee4c83b5e7df7b04e9d884",
        ACCOUNT_CANCELLATION_STYLIST: "d-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        FULL_PAYMENT_REMINDER_CLIENT: "d-79af3603646a4d218a406bcdf401af97",
        MESSAGE_NOTIFICATION_STYLIST: "d-68598dcf61564e578cb04e7de2e869c7",
        MESSAGE_NOTIFICATION_CLIENT: "d-923ac4cd221c45318d58f167f3bcaafb",
        PAYMENT_REQUESTED_CLIENT: "d-88c8f0652d9d4b39802b5864325a1bb8",
        RESCHEDULE_PROPOSAL: "d-c4dcc8b85ead46e3a228c2227d50e3f6",
        RESCHEDULE_ACCEPTED: "d-6e355af5524c4cf781a9dc43603dca22",
        RESCHEDULE_REJECTED: "d-08bb1d1a74fb494cb58dfce8e780180c",
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

            const response = await sgMail.send(msg);
            console.log("response", response);
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

    // 3. Appointment Confirmation – Stylist
    static async sendNewAppointmentForStylist(
        data: StylistAppointmentData
    ): Promise<void> {
        console.log("sending new appointment for stylist", data);
        await this.sendEmail({
            to: data.stylistEmail,
            templateId: EmailService.TEMPLATE_IDS.NEW_APPOINTMENT_STYLIST,
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

    // 4. Appointment Confirmation – Client
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
            },
        });
    }

    // 5. Appointment Denied – Client
    static async sendAppointmentDeniedClient(
        data: AppointmentDeniedData
    ): Promise<void> {
        await this.sendEmail({
            to: data.clientEmail,
            templateId: EmailService.TEMPLATE_IDS.APPOINTMENT_DENIED_CLIENT,
            dynamicTemplateData: {
                clientName: data.clientName,
                stylistName: data.stylistName,
                serviceName: data.serviceName,
                appointmentDate: data.appointmentDate,
                appointmentTime: data.appointmentTime,
                findStylistsUrl: "https://braidsnow.com/find-stylists",
            },
        });
    }

    // Automatically rejected email
    static async sendAppointmentAutoCancelledForClient(
        data: AppointmentDeniedData
    ): Promise<void> {
        await this.sendEmail({
            to: data.clientEmail,
            templateId:
                EmailService.TEMPLATE_IDS.APPOINTMENT_AUTO_CANCELLED_CLIENT,
            dynamicTemplateData: {
                clientName: data.clientName,
                stylistName: data.stylistName,
                serviceName: data.serviceName,
                appointmentDate: data.appointmentDate,
                appointmentTime: data.appointmentTime,
                findStylistsUrl: "https://braidsnow.com/find-stylists",
            },
        });
    }

    static async sendAppointmentAutoCancelledForStylist(
        data: StylistAppointmentData
    ): Promise<void> {
        await this.sendEmail({
            to: data.stylistEmail,
            templateId:
                EmailService.TEMPLATE_IDS.APPOINTMENT_AUTO_CANCELLED_STYLIST,
            dynamicTemplateData: {
                clientName: data.clientName,
                stylistName: data.stylistName,
                serviceName: data.serviceName,
                appointmentDate: data.appointmentDate,
                appointmentTime: data.appointmentTime,
                findStylistsUrl: "https://braidsnow.com/find-stylists",
            },
        });
    }

    // Appointment cancelled
    static async sendAppointmentCancelledEmailForClient(
        data: AppointmentDeniedData
    ): Promise<void> {
        await this.sendEmail({
            to: data.clientEmail,
            templateId: EmailService.TEMPLATE_IDS.APPOINTMENT_CANCELLED_CLIENT,
            dynamicTemplateData: {
                clientName: data.clientName,
                stylistName: data.stylistName,
                serviceName: data.serviceName,
                appointmentDate: data.appointmentDate,
                appointmentTime: data.appointmentTime,
            },
        });
    }

    static async sendAppointmentCancelledEmailForStylist(
        data: StylistAppointmentData
    ): Promise<void> {
        await this.sendEmail({
            to: data.stylistEmail,
            templateId: EmailService.TEMPLATE_IDS.APPOINTMENT_CANCELLED_STYLIST,
            dynamicTemplateData: {
                clientName: data.clientName,
                stylistName: data.stylistName,
                serviceName: data.serviceName,
                appointmentDate: data.appointmentDate,
                appointmentTime: data.appointmentTime,
            },
        });
    }

    // 6. Payment Failure – Stylist
    static async sendPaymentFailureForStylist(
        data: PaymentFailureData
    ): Promise<void> {
        await this.sendEmail({
            to: data.stylistEmail,
            templateId: EmailService.TEMPLATE_IDS.PAYMENT_FAILURE_STYLIST,
            dynamicTemplateData: {
                stylistName: data.stylistName,
            },
        });
    }

    // 7. Account Cancellation – Stylist
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

    // 8. Full Payment Required – Client (After Deposit Paid)
    static async sendFullPaymentReminderForClient(
        data: FullPaymentReminderData
    ): Promise<void> {
        console.log("sending full payment reminder for client", data);
        const response = await this.sendEmail({
            to: data.clientEmail,
            templateId: EmailService.TEMPLATE_IDS.FULL_PAYMENT_REMINDER_CLIENT,
            dynamicTemplateData: {
                clientName: data.clientName,
                stylistName: data.stylistName,
                appointmentDate: data.appointmentDate,
                appointmentTime: data.appointmentTime,
                serviceName: data.serviceName,
                balanceAmount: data.balanceAmount,
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
                stylistName: data.senderName,
                clientName: data.recipientName,
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
                clientName: data.recipientName,
                stylistName: data.senderName,
            },
        });
    }

    // 11. Payment Requested – Client
    static async sendPaymentRequestedClient(
        data: PaymentRequestedData
    ): Promise<void> {
        await this.sendEmail({
            to: data.clientEmail,
            templateId: EmailService.TEMPLATE_IDS.PAYMENT_REQUESTED_CLIENT,
            dynamicTemplateData: {
                clientName: data.clientName,
                stylistName: data.stylistName,
                serviceName: data.serviceName,
                appointmentDate: data.appointmentDate,
                appointmentTime: data.appointmentTime,
                dashboardUrl:
                    "https://braidsnow.com/dashboard/client/appointments",
            },
        });
    }

    // 12. Reschedule Proposal Notification
    static async sendRescheduleProposalNotification(
        data: RescheduleProposalData
    ): Promise<void> {
        await this.sendEmail({
            to: data.recipientEmail,
            templateId: EmailService.TEMPLATE_IDS.RESCHEDULE_PROPOSAL,
            dynamicTemplateData: {
                recipientName: data.recipientName,
                proposedBy: data.proposedBy,
                serviceName: data.serviceName,
                oldAppointmentDate: data.oldAppointmentDate,
                oldAppointmentTime: data.oldAppointmentTime,
                newAppointmentDate: data.newAppointmentDate,
                newAppointmentTime: data.newAppointmentTime,
            },
        });
    }

    // 13. Reschedule Accepted Notification
    static async sendRescheduleAcceptedNotification(
        data: RescheduleAcceptedData
    ): Promise<void> {
        await this.sendEmail({
            to: data.recipientEmail,
            templateId: EmailService.TEMPLATE_IDS.RESCHEDULE_ACCEPTED,
            dynamicTemplateData: {
                recipientName: data.recipientName,
                acceptedBy: data.acceptedBy,
                serviceName: data.serviceName,
                newAppointmentDate: data.newAppointmentDate,
                newAppointmentTime: data.newAppointmentTime,
            },
        });
    }

    // 14. Reschedule Rejected Notification
    static async sendRescheduleRejectedNotification(
        data: RescheduleRejectedData
    ): Promise<void> {
        await this.sendEmail({
            to: data.recipientEmail,
            templateId: EmailService.TEMPLATE_IDS.RESCHEDULE_REJECTED,
            dynamicTemplateData: {
                recipientName: data.recipientName,
                rejectedBy: data.rejectedBy,
                serviceName: data.serviceName,
                oldAppointmentDate: data.oldAppointmentDate,
                oldAppointmentTime: data.oldAppointmentTime,
            },
        });
    }
}
