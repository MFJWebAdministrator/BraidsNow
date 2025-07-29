import * as z from "zod";

// Service selection schema
export const serviceSelectionSchema = z.object({
    serviceId: z.string().min(1, "Please select a service"),
    stylistId: z.string().min(1, "Stylist ID is required"),
    price: z.number().min(0, "Price must be positive"),
    depositAmount: z.number().min(0, "Deposit must be positive"),
    duration: z.object({
        hours: z.number().min(0).max(12),
        minutes: z.number().min(0).max(59),
    }),
});

// Date and time selection schema
export const dateTimeSelectionSchema = z.object({
    date: z.date({
        required_error: "Please select a date",
    }),
    time: z.string().min(1, "Please select a time"),
});

// Client information schema
export const clientInformationSchema = z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Invalid email address"),
    phone: z
        .string()
        .length(10, "Phone number must be exactly 10 digits")
        .regex(/^\d+$/, "Phone number must contain only digits"),
    specialRequests: z.string().optional(),
    paymentType: z.enum(["deposit", "full"]),
    paymentAmount: z.number().min(0).optional(),
});

// Combined booking schema
export const bookingSchema = z.object({
    service: serviceSelectionSchema,
    dateTime: dateTimeSelectionSchema,
    clientInfo: clientInformationSchema,
    stylistId: z.string().min(1).optional(),
    clientId: z.string().min(1).optional(),
    serviceName: z.string().min(1).optional(),
    stylistName: z.string().min(1).optional(),
    stylistEmail: z.string().email().optional(),
    stylistPhone: z.string().min(1).optional(),
    businessName: z.string().min(1).optional(),
    date: z.date().optional(),
    time: z.string().min(1).optional(),
    clientName: z.string().min(1).optional(),
    clientEmail: z.string().email().optional(),
    clientPhone: z.string().min(1).optional(),
    notes: z.string().optional(),
    status: z
        .enum([
            "pending",
            "confirmed",
            "rejected",
            "cancelled",
            "auto-cancelled",
        ])
        .optional(),
    paymentType: z.enum(["deposit", "full"]).optional(),
    paymentAmount: z.number().min(0).optional(),
    depositAmount: z.number().min(0).optional(),
    totalAmount: z.number().min(0).optional(),
    paymentStatus: z
        .enum([
            "pending",
            "paid",
            "failed",
            "expired",
            "auto-cancelled",
            "refunded",
        ])
        .optional(),
    bookingSource: z.enum(["website", "app"]).optional(),
    createdAt: z.date().optional(),
});

export type ServiceSelection = z.infer<typeof serviceSelectionSchema>;
export type DateTimeSelection = z.infer<typeof dateTimeSelectionSchema>;
export type ClientInformation = z.infer<typeof clientInformationSchema>;
export type BookingForm = z.infer<typeof bookingSchema>;

export interface Booking extends BookingForm {
    id: string;
    status: "pending" | "confirmed" | "cancelled";
    updatedAt: Date;
}
