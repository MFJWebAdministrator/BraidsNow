import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID || "";
const authToken = process.env.TWILIO_AUTH_TOKEN || "";
const fromNumber = process.env.TWILIO_PHONE_NUMBER || "";

const twilioClient =
    accountSid && authToken ? twilio(accountSid, authToken) : null;

type SmsType =
    | "welcomeClient"
    | "welcomeStylist"
    | "appointmentBookedStylist"
    | "subscriptionPaymentFailedStylist"
    | "newMessageStylist"
    | "newMessageClient"
    | "fullPaymentReminderClient"
    | "AppointmentAutoCancelledClient"
    | "AppointmentAutoCancelledStylist"
    | "AppointmentCancelledByClient"
    | "AppointmentCancelledByStylist";

interface SmsData {
    phoneNumber: string;
    clientName?: string;
    stylistName?: string;
}

interface AppointmentSmsData {
    stylistName: string;
    phoneNumber: string;
    appointmentDate: string;
    appointmentTime: string;
    serviceName: string;
    clientName: string;
}

interface SubscriptionPaymentFailedStylistSmsData {
    stylistName: string;
    phoneNumber: string;
    updatePaymentUrl: string;
}

interface NewMessageStylistSmsData {
    stylistName: string;
    phoneNumber: string;
    clientName: string;
}

interface NewMessageClientSmsData {
    clientName: string;
    phoneNumber: string;
    stylistName: string;
}

interface FullPaymentReminderClientSmsData {
    clientName: string;
    phoneNumber: string;
    serviceName: string;
    stylistName: string;
    appointmentDate: string;
    appointmentTime: string;
    balanceAmount: string;
}

interface AppointmentAutoCancelledStylistSmsData extends AppointmentSmsData {}

interface AppointmentAutoCancelledClientSmsData extends AppointmentSmsData {}

export class SmsService {
    private static smsTemplates: Record<SmsType, (data: any) => string> = {
        welcomeClient: (data) =>
            `Hi ${data.clientName}! Welcome to BraidsNow.com 🎉 You can now book with top stylists near you. Ready to get started? 👉 https://braidsnow.com/find-stylists\n— BraidsNow.com`,
        welcomeStylist: (data) =>
            `Hi ${data.stylistName}! Welcome to BraidsNow.com 🎉 Setup payouts, add services, and set your schedule now 👉 https://braidsnow.com/dashboard/stylist\n— BraidsNow.com`,
        appointmentBookedStylist: (data: AppointmentSmsData) =>
            `Hi ${data.stylistName},\nYou have a new appointment request.\n\nDate: ${data.appointmentDate}\nTime: ${data.appointmentTime}\nService: ${data.serviceName}\nClient: ${data.clientName}\n\nPlease review and accept or reject this booking in your dashboard.\n\nThank you,\nBraidsNow.com Team`,
        subscriptionPaymentFailedStylist: (
            data: SubscriptionPaymentFailedStylistSmsData
        ) =>
            `Hi ${data.stylistName},\n\nWe were unable to process your subscription payment for BraidsNow.com.\n\nPlease update your payment information to keep your account active and continue booking clients.\n\n👉 Update Payment Info: ${data.updatePaymentUrl}\n\nIf payment is not completed, your access to stylist features may be paused.\n\nThank you,\nBraidsNow.com Team`,
        newMessageStylist: (data: NewMessageStylistSmsData) =>
            `Hi ${data.stylistName},\nYou’ve received a new message from ${data.clientName}.\nView Message 👉 https://braidsnow.com/dashboard/client/messages.\nBe sure to reply soon to keep your client updated.\n\nThank you,\n- BraidsNow.com Team`,
        newMessageClient: (data: NewMessageClientSmsData) =>
            `Hi ${data.clientName},\nYou’ve received a new message from ${data.stylistName} about your appointment.\nView Message 👉 https://braidsnow.com/dashboard/client/messages.\nWe recommend checking your messages to stay connected with your stylist.\n\nThank you,\n- BraidsNow.com Team`,
        fullPaymentReminderClient: (data: FullPaymentReminderClientSmsData) =>
            `Hi ${data.clientName}, please remember full payment is due at time of service. Balance: ${data.balanceAmount}\n\uD83D\uDCC5 ${data.appointmentDate} \u23F0 ${data.appointmentTime}\nService: ${data.serviceName}\nStylist: ${data.stylistName}\n— BraidsNow.com`,
        AppointmentAutoCancelledClient: (data: AppointmentSmsData) =>
            `Hi ${data.clientName}, your booking for ${data.serviceName} with ${data.stylistName} on ${data.appointmentDate} at ${data.appointmentTime} was automatically cancelled because the stylist did not respond in time. You have not been charged. - BraidsNow.com`,
        AppointmentAutoCancelledStylist: (data: AppointmentSmsData) =>
            `Hi ${data.stylistName}, the booking for ${data.serviceName} with ${data.clientName} on ${data.appointmentDate} at ${data.appointmentTime} was automatically cancelled because you did not respond in time. - BraidsNow.com`,
        AppointmentCancelledByClient: (data: AppointmentSmsData) =>
            `Hi ${data.stylistName}, the appointment for ${data.serviceName} with ${data.clientName} on ${data.appointmentDate} at ${data.appointmentTime} was cancelled by the client. The time slot is now available. - BraidsNow.com`,

        AppointmentCancelledByStylist: (data: AppointmentSmsData) =>
            `Hi ${data.clientName}, your appointment for ${data.serviceName} with ${data.stylistName} on ${data.appointmentDate} at ${data.appointmentTime} was cancelled by the stylist. Any held funds have been released. - BraidsNow.com`,
    };

    /**
     * Generic SMS sender with error handling and templating
     */
    static async sendSms({
        type,
        data,
        customMessage,
    }: {
        type: SmsType;
        data: SmsData;
        customMessage?: string;
    }): Promise<void> {
        if (!twilioClient) {
            console.warn("Twilio not configured. Skipping SMS send.");
            return;
        }

        try {
            const message = customMessage || this.smsTemplates[type](data);
            await twilioClient.messages.create({
                body: message,
                from: fromNumber,
                to: data.phoneNumber,
            });
            console.log(`SMS sent to ${data.phoneNumber} [${type}]`);
        } catch (error) {
            console.error(`Failed to send SMS to ${data.phoneNumber}:`, error);
            throw error;
        }
    }

    /**
     * Welcome SMS for Client
     */
    static async sendWelcomeClientSms(data: {
        clientName: string;
        phoneNumber: string;
    }): Promise<void> {
        await this.sendSms({ type: "welcomeClient", data });
    }

    /**
     * Welcome SMS for Stylist
     */
    static async sendWelcomeStylistSms(data: {
        stylistName: string;
        phoneNumber: string;
    }): Promise<void> {
        await this.sendSms({ type: "welcomeStylist", data });
    }

    /**
     * Appointment booked SMS for Stylist
     */
    static async sendAppointmentBookedStylistSms(
        data: AppointmentSmsData
    ): Promise<void> {
        await this.sendSms({ type: "appointmentBookedStylist", data });
    }

    /**
     * Subscription payment failed SMS for Stylist
     */
    static async sendSubscriptionPaymentFailedStylistSms(
        data: SubscriptionPaymentFailedStylistSmsData
    ): Promise<void> {
        await this.sendSms({ type: "subscriptionPaymentFailedStylist", data });
    }

    /**
     * New message SMS for Stylist
     */
    static async sendNewMessageStylistSms(
        data: NewMessageStylistSmsData
    ): Promise<void> {
        await this.sendSms({ type: "newMessageStylist", data });
    }

    /**
     * New message SMS for Client
     */
    static async sendNewMessageClientSms(
        data: NewMessageClientSmsData
    ): Promise<void> {
        await this.sendSms({ type: "newMessageClient", data });
    }

    /**
     * Full payment reminder SMS for Client
     */
    static async sendFullPaymentReminderForClientSms(
        data: FullPaymentReminderClientSmsData
    ): Promise<void> {
        await this.sendSms({ type: "fullPaymentReminderClient", data });
    }

    /**
     * Appointment accepted SMS for Client
     */
    static async sendAppointmentAcceptedClientSms(data: {
        clientName: string;
        phoneNumber: string;
        stylistName: string;
        appointmentDate: string;
        appointmentTime: string;
        serviceName: string;
    }): Promise<void> {
        const message = `Hi ${data.clientName},\nYour appointment for ${data.serviceName} with ${data.stylistName} on ${data.appointmentDate} at ${data.appointmentTime} has been accepted!\n\nWe look forward to seeing you.\n— BraidsNow.com`;
        await this.sendSms({
            type: null,
            data,
            customMessage: message,
        });
    }

    /**
     * Appointment rejected SMS for Client
     */
    static async sendAppointmentRejectedClientSms(data: {
        clientName: string;
        phoneNumber: string;
        stylistName: string;
        appointmentDate: string;
        appointmentTime: string;
        serviceName: string;
    }): Promise<void> {
        const message = `Hi ${data.clientName},\nUnfortunately, your appointment for ${data.serviceName} with ${data.stylistName} on ${data.appointmentDate} at ${data.appointmentTime} was rejected.\n\nYour payment will be automatically refunded.\n— BraidsNow.com`;
        await this.sendSms({
            type: null,
            data,
            customMessage: message,
        });
    }

    /**
     * Notify client that their appointment was auto-cancelled
     */
    static async sendAppointmentAutoCancelledClientSms(
        data: AppointmentSmsData
    ) {
        return this.sendSms({
            type: "AppointmentAutoCancelledClient",
            data,
        });
    }

    /**
     * Notify stylist that the appointment was auto-cancelled
     */
    static async sendAppointmentAutoCancelledStylistSms(
        data: AppointmentSmsData
    ) {
        return this.sendSms({
            type: "AppointmentAutoCancelledStylist",
            data,
        });
    }

    /**
     * Notify client that the appointment was cancelled by the stylist
     */
    static async sendAppointmentCancelledSmsForClient(
        data: AppointmentSmsData
    ) {
        return this.sendSms({
            type: "AppointmentCancelledByStylist",
            data,
        });
    }

    /**
     * Notify stylist that the appointment was cancelled by the client
     */
    static async sendAppointmentCancelledSmsForStylist(
        data: AppointmentSmsData
    ) {
        return this.sendSms({
            type: "AppointmentCancelledByClient",
            data,
        });
    }
}
