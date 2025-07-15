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
}
