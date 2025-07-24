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
    // onSuggestReschedule,
    // onCancelAppointment,
}: AppointmentCardProps) {
    const { toast } = useToast();

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
        } catch {
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
            </CardHeader>

            <CardContent className="p-6 space-y-6 bg-white">
                {/* Service Information */}
                <div className="bg-slate-50 p-4 rounded-lg shadow-sm border border-gray-200">
                    <h4 className="font-medium text-slate-800 mb-1">
                        {appointment.serviceName}
                    </h4>
                    {appointment.notes && (
                        <p className="text-sm text-gray-600">
                            {appointment.notes}
                        </p>
                    )}
                </div>

                {/* Date and Time */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-gray-500" />
                        <span className="text-sm font-medium">
                            {formatDate(appointment.date)}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-gray-500" />
                        <span className="text-sm font-medium">
                            {formatTime(appointment.time)}
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
        </Card>
    );
}
