import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, AlertCircle } from "lucide-react";
import axios from "axios";
import type { BookingForm } from "@/lib/schemas/booking";

interface BookingConfirmationProps {
    booking: BookingForm;
    onComplete: () => void;
}

export function BookingConfirmation({
    booking,
    onComplete,
}: BookingConfirmationProps) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const { toast } = useToast();
    const navigate = useNavigate();
    const { user } = useAuth();
    const API_BASE_URL = import.meta.env.VITE_API_URL;
    const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // Calculate payment amount based on payment type (in cents for Stripe)
    const paymentAmount =
        booking.paymentType === "deposit" && booking.depositAmount
            ? booking.depositAmount * 100
            : booking.totalAmount
              ? booking.totalAmount * 100
              : 0;
    const isPaymentRequired = paymentAmount > 0;
    const date: any =
        booking.dateTime instanceof Date
            ? format(booking.dateTime, "yyyy-MM-dd")
            : undefined;
    const time: any =
        booking.dateTime instanceof Date
            ? format(booking.dateTime, "HH:mm")
            : undefined;

    const handleConfirm = async () => {
        try {
            setErrorMessage(null);
            setIsProcessing(true);

            // Validate booking data
            if (
                !booking.stylistId ||
                !booking.serviceName ||
                !booking.dateTime
            ) {
                throw new Error("Missing required booking information");
            }

            if (!user || !user.uid) {
                throw new Error(
                    "You must be logged in to complete this booking"
                );
            }

            const completeBookingData = {
                ...booking,
                dateTime: booking.dateTime.toISOString(),
                clientId: user.uid,
                status: "pending",
                paymentStatus: isPaymentRequired ? "pending" : "not_required",
                paymentAmount: paymentAmount / 100, // Store in dollars
                paymentType: booking.paymentType,
                createdAt: new Date().toISOString(),
            };

            if (!isPaymentRequired) {
                // Handle free booking
                try {
                    // Get fresh ID token
                    const idToken = await user.getIdToken(true);

                    // Create booking through API
                    const response = await axios.post(
                        `${API_BASE_URL}/create-booking`,
                        completeBookingData,
                        {
                            headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${idToken}`,
                            },
                        }
                    );

                    if (response.data?.bookingId) {
                        toast({
                            title: "Booking Confirmed",
                            description:
                                "Your appointment has been successfully booked!",
                        });

                        onComplete();
                    } else {
                        throw new Error("Failed to create booking");
                    }
                } catch (apiError: any) {
                    console.error("API error details:", apiError);
                    throw apiError;
                }
            } else {
                const idToken = await user.getIdToken(true);
                if (!idToken) {
                    throw new Error(
                        "Authentication error. Please log in again."
                    );
                }

                const origin = window.location.origin;
                const successUrl = `${origin}/payment-success`;
                const cancelUrl = `${origin}/payment-cancel`;

                const response = await axios.post(
                    `${API_BASE_URL}/create-payment-to-stylist`,
                    {
                        userId: user.uid,
                        stylistId: booking.stylistId,
                        amount: paymentAmount,
                        serviceDescription: `${booking.paymentType === "deposit" ? "Deposit" : "Full payment"} for ${booking.serviceName} with ${booking.stylistName}`,
                        successUrl,
                        cancelUrl,
                        bookingData: completeBookingData,
                    },
                    {
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${idToken}`,
                        },
                        timeout: 1000000,
                    }
                );

                if (response.data?.url) {
                    window.location.href = response.data.url;
                } else {
                    throw new Error(
                        "Payment session creation failed - no URL returned"
                    );
                }
            }
        } catch (error) {
            console.error("Error processing booking:", error);

            let message =
                "There was an error processing your booking. Please try again.";

            // Check for specific error response
            if (axios.isAxiosError(error) && error.response) {
                if (error.response.status === 403) {
                    message =
                        "Permission denied. Please log in again or contact support.";
                } else if (error.response.status === 401) {
                    message = "Your session has expired. Please log in again.";
                } else if (
                    error.response.data?.error ===
                    "Stylist does not have an active payment account"
                ) {
                    message =
                        "This stylist is not set up to receive payments yet. Please contact them directly.";
                } else if (error.response.data?.error) {
                    message = error.response.data.error;
                }
            } else if (error instanceof Error) {
                message = error.message;
            }

            // Set error message state instead of just showing toast
            setErrorMessage(message);

            // Also show toast
            toast({
                title: "Booking Failed",
                description: message,
                variant: "destructive",
            });

            // Make sure to set processing to false
            setIsProcessing(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-light text-[#3F0052] mb-2">
                    Booking Confirmation
                </h2>
                <p className="text-gray-600">
                    Please review your booking details
                </p>
            </div>

            {/* Show error message if present */}
            {errorMessage && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-800">
                    <div className="flex items-start">
                        <AlertCircle className="h-5 w-5 mr-2 text-red-600 flex-shrink-0" />
                        <p>{errorMessage}</p>
                    </div>
                </div>
            )}

            <Card className="p-6 space-y-4">
                <div>
                    <h3 className="font-medium mb-2">Service Details</h3>
                    <p>
                        Service:{" "}
                        {booking.serviceName || booking.service.serviceId}
                    </p>
                    <p>
                        Date:{" "}
                        {date instanceof Date
                            ? format(date, "MMMM d, yyyy")
                            : date
                              ? format(date, "MMMM d, yyyy")
                              : "Not specified"}
                    </p>
                    <p>
                        Time: {time} {browserTz}
                    </p>
                    <p>Stylist: {booking.stylistName}</p>
                    {booking.businessName && (
                        <p>Business: {booking.businessName}</p>
                    )}
                </div>

                <div>
                    <h3 className="font-medium mb-2">Client Information</h3>
                    <p>
                        Name:{" "}
                        {booking.clientName ||
                            `${booking.clientInfo.firstName} ${booking.clientInfo.lastName}`}
                    </p>
                    <p>
                        Email: {booking.clientEmail || booking.clientInfo.email}
                    </p>
                    <p>
                        Phone: {booking.clientPhone || booking.clientInfo.phone}
                    </p>
                    {(booking.notes || booking.clientInfo.specialRequests) && (
                        <p>
                            Special Requests:{" "}
                            {booking.notes ||
                                booking.clientInfo.specialRequests}
                        </p>
                    )}
                </div>

                <div>
                    <h3 className="font-medium mb-2">Payment Details</h3>
                    <p>Total Service Price: ${booking.totalAmount}</p>
                    <p>
                        Payment Type:{" "}
                        {booking.paymentType === "deposit"
                            ? "Deposit"
                            : "Full Payment"}
                    </p>
                    <p>
                        Amount Due Now: $
                        {booking.paymentType === "deposit"
                            ? booking.depositAmount
                            : booking.totalAmount}
                    </p>
                    {booking.paymentType === "deposit" && (
                        <p className="text-sm text-gray-600">
                            Remaining Balance: $
                            {booking.totalAmount && booking.depositAmount
                                ? booking.totalAmount - booking.depositAmount
                                : null}
                        </p>
                    )}
                </div>
            </Card>

            <div className="flex justify-end space-x-4">
                <Button
                    variant="outline"
                    onClick={() => navigate(-1)}
                    disabled={isProcessing}
                >
                    Back
                </Button>
                <Button
                    onClick={handleConfirm}
                    disabled={isProcessing}
                    className="bg-[#3F0052] hover:bg-[#3F0052]/90"
                >
                    {isProcessing ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                        </>
                    ) : isPaymentRequired ? (
                        `Confirm & Pay ${booking.paymentType === "deposit" ? "Deposit" : "Full Amount"}`
                    ) : (
                        "Confirm Booking"
                    )}
                </Button>
            </div>
        </div>
    );
}
