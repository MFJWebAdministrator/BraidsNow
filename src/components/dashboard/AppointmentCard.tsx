"use client";

import {
    Card,
    CardContent,
    CardHeader,
    CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
    Calendar,
    Clock,
    DollarSign,
    Phone,
    Mail,
    AlertCircle,
    CheckCircle,
    XCircle,
    Clock3,
    Copy,
    Check,
    X,
} from "lucide-react";
import { format } from "date-fns";
import type { Appointment } from "@/hooks/use-appointments";
import { useToast } from "@/hooks/use-toast";
import {
    cancelBookingByClient,
    cancelBookingByStylist,
} from "@/lib/api-client";
import { useState } from "react";
import {
    requestPayment,
    payAppointment,
    loadStripe,
    acceptReschedule,
    rejectReschedule,
} from "@/lib/api-client";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RescheduleDialog } from "./RescheduleDialog";

interface AppointmentCardProps {
    appointment: Appointment;
    userRole: "stylist" | "client";
    onContact?: (contactInfo: { phone: string; email: string }) => void;
    onAcceptAppointment?: (appointmentId: string) => void;
    onRejectAppointment?: (appointmentId: string) => void;
    onSuggestReschedule?: (appointmentId: string) => void;
    onCancelAppointment?: (appointmentId: string) => void;
}

export function AppointmentCard({
    appointment,
    userRole,
    onAcceptAppointment,
    onRejectAppointment,
    // onCancelAppointment,
    // onSuggestReschedule,
}: AppointmentCardProps) {
    const { toast } = useToast();
    const [isCancelling, setIsCancelling] = useState(false);
    const [isRescheduling] = useState(false);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [isRequestingPayment, setIsRequestingPayment] = useState(false);
    const [isPaying, setIsPaying] = useState(false);
    const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);
    const [isRescheduleActionLoading, setIsRescheduleActionLoading] =
        useState(false);
    const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const copyToClipboard = async (text: string, type: string) => {
        try {
            await navigator.clipboard.writeText(text);
            toast({
                title: "Copied!",
                description: `${type} copied to clipboard`,
                duration: 2000,
            });
        } catch (err) {
            toast({
                title: "Copy failed",
                description: "Unable to copy to clipboard",
                variant: "destructive",
                duration: 2000,
            });
        }
    };

    const handleAcceptAppointment = () => {
        if (onAcceptAppointment) {
            onAcceptAppointment(appointment.id);
        }
    };

    const handleRejectAppointment = () => {
        if (onRejectAppointment) {
            onRejectAppointment(appointment.id);
        }
    };

    const handleCancelAppointment = () => {
        setShowCancelDialog(true);
    };

    const confirmCancelAppointment = async () => {
        if (isCancelling) return;

        setIsCancelling(true);
        setShowCancelDialog(false);

        try {
            if (userRole === "client") {
                await cancelBookingByClient(appointment.id);
                toast({
                    title: "Appointment Cancelled",
                    description:
                        "Your appointment has been cancelled successfully. You will receive a refund minus the cancellation fee.",
                    duration: 3000,
                });
            } else if (userRole === "stylist") {
                await cancelBookingByStylist(appointment.id);
                toast({
                    title: "Appointment Cancelled",
                    description:
                        "The appointment has been cancelled. A penalty will be applied to your next payout.",
                    duration: 3000,
                });
            }
        } catch (error) {
            console.error("Error cancelling appointment:", error);
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Failed to cancel appointment";
            toast({
                title: "Cancellation Failed",
                description: errorMessage,
                variant: "destructive",
                duration: 3000,
            });
        } finally {
            setIsCancelling(false);
        }
    };

    const handleRescheduleAppointment = () => {
        setShowRescheduleDialog(true);
    };

    const handleAcceptReschedule = async (bookingId: string) => {
        if (isRescheduleActionLoading) return;

        setIsRescheduleActionLoading(true);
        try {
            await acceptReschedule(bookingId);
            toast({
                title: "Reschedule Accepted",
                description:
                    "The appointment has been rescheduled successfully.",
                duration: 2000,
            });
        } catch (error) {
            console.error("Error accepting reschedule:", error);
            toast({
                title: "Error",
                description: "Failed to accept reschedule. Please try again.",
                variant: "destructive",
                duration: 3000,
            });
        } finally {
            setIsRescheduleActionLoading(false);
        }
    };

    const handleRejectReschedule = async (bookingId: string) => {
        if (isRescheduleActionLoading) return;

        setIsRescheduleActionLoading(true);
        try {
            await rejectReschedule(bookingId);
            toast({
                title: "Reschedule Declined",
                description: "The reschedule proposal has been declined.",
                duration: 2000,
            });
        } catch (error) {
            console.error("Error rejecting reschedule:", error);
            toast({
                title: "Error",
                description: "Failed to reject reschedule. Please try again.",
                variant: "destructive",
                duration: 3000,
            });
        } finally {
            setIsRescheduleActionLoading(false);
        }
    };

    const handleRequestPayment = async () => {
        if (!appointment.id) return;

        setIsRequestingPayment(true);
        try {
            const response = await requestPayment(
                appointment.stylistId,
                appointment.id
            );

            if (response.data.success) {
                toast({
                    title: "Payment Requested",
                    description: "Payment request has been sent to the client.",
                    duration: 3000,
                });
            }
        } catch (error) {
            console.error("Error requesting payment:", error);
            toast({
                title: "Error",
                description: "Failed to request payment. Please try again.",
                variant: "destructive",
                duration: 3000,
            });
        } finally {
            setIsRequestingPayment(false);
        }
    };

    const handlePayAppointment = async () => {
        if (!appointment.id) return;

        setIsPaying(true);
        try {
            const response = await payAppointment(
                appointment.clientId,
                appointment.id
            );

            if (response.data.success) {
                if (response.data.sessionId) {
                    // Redirect to Stripe checkout for payment
                    const stripe = await loadStripe(
                        import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
                    );
                    if (stripe) {
                        await stripe.redirectToCheckout({
                            sessionId: response.data.sessionId,
                        });
                    }
                } else {
                    // Payment was processed immediately (transfer flow)
                    toast({
                        title: "Payment Completed",
                        description:
                            "Your payment has been processed successfully.",
                        duration: 3000,
                    });
                }
            }
        } catch (error) {
            console.error("Error processing payment:", error);
            toast({
                title: "Error",
                description: "Failed to process payment. Please try again.",
                variant: "destructive",
                duration: 3000,
            });
        } finally {
            setIsPaying(false);
        }
    };

    const getStatusIcon = (status: string, paymentStatus: string) => {
        if (
            status === "failed" ||
            paymentStatus === "failed" ||
            status === "cancelled" ||
            paymentStatus === "cancelled"
        ) {
            return <XCircle className="h-4 w-4" />;
        }
        if (status === "confirmed" && paymentStatus === "paid") {
            return <CheckCircle className="h-4 w-4" />;
        }
        if (status === "pending") {
            return <Clock3 className="h-4 w-4" />;
        }
        return <AlertCircle className="h-4 w-4" />;
    };

    const getStatusColor = (status: string, paymentStatus: string) => {
        if (
            status === "failed" ||
            paymentStatus === "failed" ||
            status === "cancelled"
        ) {
            return "bg-red-100 text-red-800 hover:bg-red-200";
        }
        if (status === "confirmed" && paymentStatus === "paid") {
            return "bg-green-100 text-green-800 hover:bg-green-200";
        }
        if (status === "pending") {
            return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
        }
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    };

    const getStatusText = (status: string, paymentStatus: string) => {
        if (status === "failed") {
            return "Booking Failed";
        }
        if (paymentStatus === "failed") {
            return "Payment Failed";
        }
        if (status === "cancelled") {
            return "Cancelled";
        }
        if (status === "confirmed" && paymentStatus === "paid") {
            return "Confirmed";
        }
        if (status === "pending") {
            return "Pending";
        }
        return status.charAt(0).toUpperCase() + status.slice(1);
    };

    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return format(date, "MMM dd, yyyy");
        } catch {
            return dateString;
        }
    };

    const formatTime = (timeString: string) => {
        try {
            const [hours, minutes] = timeString.split(":");
            const date = new Date();
            date.setHours(Number.parseInt(hours), Number.parseInt(minutes));
            return format(date, "h:mm a");
        } catch (error) {
            console.log("formatTime error", error);
            return timeString;
        }
    };

    const displayName =
        userRole === "stylist"
            ? appointment.clientName
            : appointment.stylistName;

    const displayBusiness =
        userRole === "client" ? appointment.businessName : "";

    const contactPhone = userRole === "stylist" ? appointment.clientPhone : "";
    const contactEmail = userRole === "stylist" ? appointment.clientEmail : "";

    // Determine if action buttons should be shown
    const showPendingActions =
        appointment.status === "pending" && userRole === "stylist";

    // const showConfirmedActions =
    //     appointment.status === "confirmed" &&
    //     appointment.paymentStatus === "paid";

    const initials = displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase();

    return (
        <Card className="w-full overflow-hidden border border-gray-300 shadow-xl bg-white">
            <CardHeader className="flex flex-row items-center justify-between gap-4 bg-gradient-to-r from-[#3F0052]/100 to-[#3F0052]/80 p-6 text-white">
                <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 border-2 border-white bg-white text-[#3F0052]">
                        <AvatarImage src="/placeholder.svg" />
                        <AvatarFallback className="text-lg font-bold bg-purple-800 text-white">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <h3 className="text-xl font-semibold">{displayName}</h3>
                        {displayBusiness && (
                            <div className="flex items-center gap-1 text-sm">
                                <span className="text-purple-100">
                                    {displayBusiness}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Badge
                        className={`${getStatusColor(appointment.status, appointment.paymentStatus)} px-3 py-1 text-xs font-medium flex items-center gap-1 rounded-full border-0`}
                    >
                        {getStatusIcon(
                            appointment.status,
                            appointment.paymentStatus
                        )}
                        {getStatusText(
                            appointment.status,
                            appointment.paymentStatus
                        )}
                    </Badge>
                    {appointment.rescheduleProposal && (
                        <Badge className="bg-orange-100 text-orange-800 px-2 py-1 text-xs font-medium flex items-center gap-1 rounded-full border-0">
                            <Clock className="h-3 w-3" />
                            Reschedule
                        </Badge>
                    )}
                </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6 bg-white">
                {/* Service Information */}
                <div className="bg-slate-50 p-4 rounded-lg shadow-sm border border-gray-200">
                    <h4 className="font-medium text-slate-800 mb-1">
                        {appointment.serviceName}
                    </h4>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span>
                            {appointment.service.duration.hours} hours{" "}
                            {appointment.service.duration.minutes} minutes
                        </span>
                    </div>
                    {appointment.notes && (
                        <p className="text-sm text-gray-600 mt-2">
                            {appointment.notes}
                        </p>
                    )}
                </div>

                {/* Date and Time */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-gray-500" />
                        <span className="text-sm font-medium">
                            {formatDate(appointment.dateTime.toString())}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-gray-500" />
                        <span className="text-sm font-medium">
                            {formatTime(
                                appointment.dateTime.getHours() +
                                    ":" +
                                    appointment.dateTime.getMinutes()
                            ) +
                                " " +
                                browserTz}
                        </span>
                    </div>
                </div>

                <Separator />

                {/* Payment Information */}
                <div className="grid gap-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm">
                            <DollarSign className="h-4 w-4 text-gray-500" />
                            <span>
                                {appointment.paymentType === "deposit"
                                    ? "Deposit Paid"
                                    : "Total Paid"}
                            </span>
                        </div>
                        <span className="font-semibold">
                            ${appointment.paymentAmount}
                        </span>
                    </div>

                    {appointment.totalAmount !== appointment.paymentAmount && (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm">
                                <DollarSign className="h-4 w-4 text-gray-500" />
                                <span>Total Cost</span>
                            </div>
                            <span className="font-semibold">
                                ${appointment.totalAmount}
                            </span>
                        </div>
                    )}

                    {appointment.totalAmount !== appointment.paymentAmount && (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm">
                                <DollarSign className="h-4 w-4 text-gray-500" />
                                <span>Unpaid</span>
                            </div>
                            <span className="font-semibold text-red-600">
                                $
                                {appointment.totalAmount -
                                    appointment.paymentAmount}
                            </span>
                        </div>
                    )}
                </div>

                {/* Contact Information (for stylists viewing client appointments) */}
                {userRole === "stylist" && (
                    <>
                        <Separator />
                        <div className="grid gap-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-gray-500" />
                                    <span className="text-sm">
                                        {contactPhone}
                                    </span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() =>
                                        copyToClipboard(
                                            contactPhone,
                                            "Phone number"
                                        )
                                    }
                                >
                                    <Copy className="h-4 w-4" />
                                    <span className="sr-only">
                                        Copy phone number
                                    </span>
                                </Button>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-gray-500" />
                                    <span className="text-sm truncate max-w-[200px]">
                                        {contactEmail}
                                    </span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() =>
                                        copyToClipboard(
                                            contactEmail,
                                            "Email address"
                                        )
                                    }
                                >
                                    <Copy className="h-4 w-4" />
                                    <span className="sr-only">Copy email</span>
                                </Button>
                            </div>
                        </div>
                    </>
                )}

                {/* Special Requests */}
                {appointment.clientInfo?.specialRequests && (
                    <>
                        <Separator />
                        <div className="bg-slate-50 p-4 rounded-lg shadow-sm border border-gray-200">
                            <h5 className="text-sm font-medium text-gray-700 mb-1">
                                Special Requests:
                            </h5>
                            <p className="text-sm text-gray-600">
                                {appointment.clientInfo.specialRequests}
                            </p>
                        </div>
                    </>
                )}

                {/* Reschedule Proposal Display */}
                {appointment.rescheduleProposal && (
                    <>
                        <Separator />
                        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                            <div className="flex items-center gap-2 mb-2">
                                <Clock className="h-4 w-4 text-yellow-600" />
                                <span className="font-medium text-yellow-800">
                                    Reschedule Proposal Pending
                                </span>
                            </div>
                            <p className="text-sm text-yellow-700 mb-3">
                                {/* Determine who proposed and who is viewing */}
                                {(() => {
                                    const isClientViewing =
                                        userRole === "client";
                                    const isStylistViewing =
                                        userRole === "stylist";
                                    const isClientProposed =
                                        appointment.rescheduleProposal
                                            .proposedBy === "client";
                                    const isStylistProposed =
                                        appointment.rescheduleProposal
                                            .proposedBy === "stylist";

                                    // If  viewer is the one who proposed
                                    if (
                                        (isClientViewing && isClientProposed) ||
                                        (isStylistViewing && isStylistProposed)
                                    ) {
                                        return "You proposed: ";
                                    }

                                    // If client is viewing and stylist proposed, show "Stylist proposed"
                                    if (isClientViewing && isStylistProposed) {
                                        return "Stylist proposed: ";
                                    }
                                    // If stylist is viewing and client proposed, show "Client proposed"
                                    if (isStylistViewing && isClientProposed) {
                                        return "Client proposed: ";
                                    }
                                    return "Proposed: ";
                                })()}
                                {format(
                                    appointment.rescheduleProposal
                                        .proposedDateTime,
                                    "MMMM dd, yyyy"
                                )}
                                {" at "}
                                {format(
                                    appointment.rescheduleProposal
                                        .proposedDateTime,
                                    "h:mm a"
                                )}
                            </p>
                            {appointment.rescheduleProposal.reason && (
                                <p className="text-sm text-yellow-600 mb-3 italic">
                                    Reason:{" "}
                                    {appointment.rescheduleProposal.reason}
                                </p>
                            )}
                            {/* Only show action buttons to the person who didn't propose */}
                            {(() => {
                                const isClientViewing = userRole === "client";
                                const isStylistViewing = userRole === "stylist";
                                const isClientProposed =
                                    appointment.rescheduleProposal
                                        .proposedBy === "client";
                                const isStylistProposed =
                                    appointment.rescheduleProposal
                                        .proposedBy === "stylist";

                                // Show buttons only if the viewer is NOT the one who proposed
                                const shouldShowButtons =
                                    (isClientViewing && isStylistProposed) ||
                                    (isStylistViewing && isClientProposed);

                                if (!shouldShowButtons) return null;

                                return (
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            onClick={() =>
                                                handleAcceptReschedule(
                                                    appointment.id
                                                )
                                            }
                                            disabled={isRescheduleActionLoading}
                                            className="bg-green-600 hover:bg-green-700"
                                        >
                                            {isRescheduleActionLoading
                                                ? "Accepting..."
                                                : "Accept"}
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() =>
                                                handleRejectReschedule(
                                                    appointment.id
                                                )
                                            }
                                            disabled={isRescheduleActionLoading}
                                        >
                                            {isRescheduleActionLoading
                                                ? "Declining..."
                                                : "Decline"}
                                        </Button>
                                    </div>
                                );
                            })()}
                        </div>
                    </>
                )}

                {/* Payment Failure Information */}
                {appointment.paymentStatus === "failed" &&
                    appointment.paymentFailureReason && (
                        <>
                            <Separator />
                            <div className="bg-red-50 p-4 rounded-lg shadow-sm border border-red-200">
                                <div className="flex items-center space-x-2 text-red-700">
                                    <AlertCircle className="h-4 w-4" />
                                    <span className="text-sm font-medium">
                                        Payment Failed
                                    </span>
                                </div>
                                <p className="text-sm text-red-600 mt-1">
                                    {appointment.paymentFailureReason}
                                </p>
                            </div>
                        </>
                    )}
            </CardContent>

            {/* Action Buttons */}
            {showPendingActions && (
                <CardFooter className="grid grid-cols-2 gap-3 p-6 pt-0">
                    <Button
                        onClick={handleRejectAppointment}
                        className="border-red-200 bg-red-100 text-red-600 hover:bg-red-200 hover:text-red-700"
                    >
                        <X className="h-4 w-4 mr-2" />
                        Reject
                    </Button>
                    <Button
                        onClick={handleAcceptAppointment}
                        className="bg-green-600 text-white hover:bg-green-700"
                    >
                        <Check className="h-4 w-4 mr-2" />
                        Accept
                    </Button>
                </CardFooter>
            )}

            {/*  Confirmed action buttons, cancel and reschedule */}
            {appointment.status === "confirmed" && (
                <CardFooter className="grid grid-cols-2 gap-3 p-6 pt-0">
                    <Button
                        onClick={handleCancelAppointment}
                        disabled={isCancelling}
                        className="bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                    >
                        {isCancelling ? "Cancelling..." : "Cancel"}
                    </Button>
                    <Button
                        onClick={handleRescheduleAppointment}
                        disabled={isRescheduling}
                        className="bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                        {isRescheduling ? "Sending..." : "Propose Reschedule"}
                    </Button>
                </CardFooter>
            )}

            {/* Payment action buttons based on user role and appointment status */}
            {userRole === "stylist" && appointment.status === "to-be-paid" && (
                <CardFooter className="grid grid-cols-1 gap-3 p-6 pt-0">
                    <Button
                        onClick={handleRequestPayment}
                        disabled={isRequestingPayment}
                        className="bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                        {isRequestingPayment
                            ? "Requesting..."
                            : "Request Payment"}
                    </Button>
                </CardFooter>
            )}

            {/* Client payment button */}
            {userRole === "client" && appointment.status === "to-be-paid" && (
                <CardFooter className="grid grid-cols-1 gap-3 p-6 pt-0">
                    <Button
                        onClick={handlePayAppointment}
                        disabled={isPaying}
                        className="bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                    >
                        {isPaying ? "Processing..." : "Pay"}
                    </Button>
                </CardFooter>
            )}

            {/* Cancellation Confirmation Dialog */}
            <AlertDialog
                open={showCancelDialog}
                onOpenChange={setShowCancelDialog}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Cancel Appointment</AlertDialogTitle>
                        <AlertDialogDescription>
                            {userRole === "client"
                                ? "Are you sure you want to cancel this appointment? You will receive a refund minus a 4% cancellation fee."
                                : "Are you sure you want to cancel this appointment? A 4% penalty will be applied to your next payout and the client will receive a full refund."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isCancelling}>
                            Keep Appointment
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmCancelAppointment}
                            disabled={isCancelling}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {isCancelling
                                ? "Cancelling..."
                                : "Cancel Appointment"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Reschedule Dialog */}
            <RescheduleDialog
                isOpen={showRescheduleDialog}
                onClose={() => setShowRescheduleDialog(false)}
                appointment={appointment}
                onRescheduleProposed={() => {
                    // The useAppointments hook will automatically update
                    // due to Firebase real-time listeners
                }}
            />
        </Card>
    );
}
