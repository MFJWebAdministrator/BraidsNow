"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
} from "lucide-react";
import { format } from "date-fns";
import type { Appointment } from "@/hooks/use-appointments";
import { useToast } from "@/hooks/use-toast";

interface AppointmentCardProps {
    appointment: Appointment;
    userRole: "stylist" | "client";
    onContact?: (contactInfo: { phone: string; email: string }) => void;
}

export function AppointmentCard({
    appointment,
    userRole,
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

    const getStatusIcon = (status: string, paymentStatus: string) => {
        if (status === "failed" || paymentStatus === "failed") {
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
        if (status === "failed" || paymentStatus === "failed") {
            return "destructive";
        }
        if (status === "confirmed" && paymentStatus === "paid") {
            return "default";
        }
        if (status === "pending") {
            return "secondary";
        }
        return "outline";
    };

    const getStatusText = (status: string, paymentStatus: string) => {
        if (status === "failed") {
            return "Booking Failed";
        }
        if (paymentStatus === "failed") {
            return "Payment Failed";
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

    return (
        <Card className="w-full border border-gray-200 shadow-sm hover:shadow-md transition-all">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                        <Avatar className="h-12 w-12 ring-2 ring-purple-100">
                            <AvatarImage src="/placeholder.svg" />
                            <AvatarFallback className="bg-[#3F0052] text-white">
                                {displayName
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <h3 className="font-semibold text-lg text-[#3F0052]">
                                {displayName}
                            </h3>
                            {displayBusiness && (
                                <p className="text-sm text-gray-600">
                                    {displayBusiness}
                                </p>
                            )}
                        </div>
                    </div>
                    <Badge
                        variant={getStatusColor(
                            appointment.status,
                            appointment.paymentStatus
                        )}
                        className="flex items-center gap-1 font-medium shadow-sm"
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
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Service Information */}
                <div className="space-y-2 bg-gray-50 p-3 rounded-lg">
                    <h4 className="font-medium text-[#3F0052]">
                        {appointment.serviceName}
                    </h4>
                    {appointment.notes && (
                        <p className="text-sm text-gray-600">
                            {appointment.notes}
                        </p>
                    )}
                </div>

                <Separator className="bg-gray-200" />

                {/* Date and Time */}
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">
                            {formatDate(appointment.date)}
                        </span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">
                            {formatTime(appointment.time)}
                        </span>
                    </div>
                </div>

                {/* Payment Information */}
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center space-x-2">
                        <DollarSign className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">
                            {appointment.paymentType === "deposit"
                                ? "Deposit Paid"
                                : "Total Paid"}
                            : ${appointment.paymentAmount}
                        </span>
                    </div>
                    {appointment.totalAmount !== appointment.paymentAmount && (
                        <div className="flex items-center space-x-2">
                            <DollarSign className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-600">
                                Total Cost: ${appointment.totalAmount}
                            </span>
                        </div>
                    )}
                    {/* Remaining Balance */}
                    {appointment.totalAmount !== appointment.paymentAmount && (
                        <div className="flex items-center space-x-2">
                            <DollarSign className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-600">
                                Unpaid : $
                                {appointment.totalAmount -
                                    appointment.paymentAmount}
                            </span>
                        </div>
                    )}
                </div>

                {/* Contact Information (for stylists viewing client appointments) */}
                {userRole === "stylist" && (
                    <>
                        <Separator className="bg-gray-200" />
                        <div className="space-y-2 bg-gray-50 p-3 rounded-lg">
                            <div
                                className="flex items-center justify-between group"
                                onClick={() =>
                                    copyToClipboard(
                                        contactPhone,
                                        "Phone number"
                                    )
                                }
                            >
                                <div className="flex items-center space-x-2">
                                    <Phone className="h-4 w-4 text-gray-500" />
                                    <span className="text-sm">
                                        {contactPhone}
                                    </span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 p-0 hover:bg-gray-200 rounded-full"
                                >
                                    <Copy className="h-3 w-3" />
                                </Button>
                            </div>
                            <div
                                className="flex items-center justify-between group"
                                onClick={() =>
                                    copyToClipboard(
                                        contactEmail,
                                        "Email address"
                                    )
                                }
                            >
                                <div className="flex items-center space-x-2">
                                    <Mail className="h-4 w-4 text-gray-500" />
                                    <span className="text-sm">
                                        {contactEmail}
                                    </span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 p-0 hover:bg-gray-200 rounded-full"
                                >
                                    <Copy className="h-3 w-3" />
                                </Button>
                            </div>
                        </div>
                    </>
                )}

                {/* Special Requests */}
                {appointment.clientInfo?.specialRequests && (
                    <>
                        <Separator className="bg-gray-200" />
                        <div className="bg-gray-50 p-3 rounded-lg">
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
                            <Separator className="bg-gray-200" />
                            <div className="bg-red-50 p-3 rounded-lg">
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
        </Card>
    );
}
