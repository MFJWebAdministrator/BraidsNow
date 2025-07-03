import React, { useState } from "react";
import { useEmail } from "@/hooks/use-email";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

// Example: Welcome Email Form
export const WelcomeEmailForm = () => {
    const [clientName, setClientName] = useState("");
    const [clientEmail, setClientEmail] = useState("");
    const { sendWelcomeClientEmail, loading, error, success, resetState } =
        useEmail();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await sendWelcomeClientEmail({
            clientName,
            clientEmail,
        });
    };

    return (
        <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle>Send Welcome Email</CardTitle>
                <CardDescription>
                    Send a welcome email to a new client
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="clientName">Client Name</Label>
                        <Input
                            id="clientName"
                            value={clientName}
                            onChange={(e) => setClientName(e.target.value)}
                            placeholder="Enter client name"
                            required
                        />
                    </div>
                    <div>
                        <Label htmlFor="clientEmail">Client Email</Label>
                        <Input
                            id="clientEmail"
                            type="email"
                            value={clientEmail}
                            onChange={(e) => setClientEmail(e.target.value)}
                            placeholder="Enter client email"
                            required
                        />
                    </div>

                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {success && (
                        <Alert>
                            <CheckCircle className="h-4 w-4" />
                            <AlertDescription>
                                Welcome email sent successfully!
                            </AlertDescription>
                        </Alert>
                    )}

                    <Button type="submit" disabled={loading} className="w-full">
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Sending...
                            </>
                        ) : (
                            "Send Welcome Email"
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
};

// Example: Appointment Confirmation Form
export const AppointmentConfirmationForm = () => {
    const [formData, setFormData] = useState({
        clientName: "",
        clientEmail: "",
        stylistName: "",
        appointmentDate: "",
        appointmentTime: "",
        serviceName: "",
    });

    const {
        sendAppointmentConfirmationClient,
        loading,
        error,
        success,
        resetState,
    } = useEmail();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await sendAppointmentConfirmationClient(formData);
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    return (
        <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle>Appointment Confirmation</CardTitle>
                <CardDescription>
                    Send appointment confirmation to client
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="clientName">Client Name</Label>
                            <Input
                                id="clientName"
                                value={formData.clientName}
                                onChange={(e) =>
                                    handleInputChange(
                                        "clientName",
                                        e.target.value
                                    )
                                }
                                placeholder="Client name"
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="clientEmail">Client Email</Label>
                            <Input
                                id="clientEmail"
                                type="email"
                                value={formData.clientEmail}
                                onChange={(e) =>
                                    handleInputChange(
                                        "clientEmail",
                                        e.target.value
                                    )
                                }
                                placeholder="Client email"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="stylistName">Stylist Name</Label>
                        <Input
                            id="stylistName"
                            value={formData.stylistName}
                            onChange={(e) =>
                                handleInputChange("stylistName", e.target.value)
                            }
                            placeholder="Stylist name"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="appointmentDate">Date</Label>
                            <Input
                                id="appointmentDate"
                                type="date"
                                value={formData.appointmentDate}
                                onChange={(e) =>
                                    handleInputChange(
                                        "appointmentDate",
                                        e.target.value
                                    )
                                }
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="appointmentTime">Time</Label>
                            <Input
                                id="appointmentTime"
                                type="time"
                                value={formData.appointmentTime}
                                onChange={(e) =>
                                    handleInputChange(
                                        "appointmentTime",
                                        e.target.value
                                    )
                                }
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="serviceName">Service</Label>
                        <Input
                            id="serviceName"
                            value={formData.serviceName}
                            onChange={(e) =>
                                handleInputChange("serviceName", e.target.value)
                            }
                            placeholder="Service name"
                            required
                        />
                    </div>

                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {success && (
                        <Alert>
                            <CheckCircle className="h-4 w-4" />
                            <AlertDescription>
                                Appointment confirmation sent successfully!
                            </AlertDescription>
                        </Alert>
                    )}

                    <Button type="submit" disabled={loading} className="w-full">
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Sending...
                            </>
                        ) : (
                            "Send Confirmation"
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
};

// Example: Message Notification Form
export const MessageNotificationForm = () => {
    const [formData, setFormData] = useState({
        recipientName: "",
        recipientEmail: "",
        senderName: "",
        userType: "client" as "client" | "stylist",
    });

    const {
        sendMessageNotificationClient,
        sendMessageNotificationStylist,
        loading,
        error,
        success,
    } = useEmail();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.userType === "client") {
            await sendMessageNotificationClient(formData);
        } else {
            await sendMessageNotificationStylist(formData);
        }
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    return (
        <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle>Message Notification</CardTitle>
                <CardDescription>
                    Send message notification email
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="userType">Recipient Type</Label>
                        <select
                            id="userType"
                            value={formData.userType}
                            onChange={(e) =>
                                handleInputChange("userType", e.target.value)
                            }
                            className="w-full p-2 border rounded-md"
                        >
                            <option value="client">Client</option>
                            <option value="stylist">Stylist</option>
                        </select>
                    </div>

                    <div>
                        <Label htmlFor="recipientName">Recipient Name</Label>
                        <Input
                            id="recipientName"
                            value={formData.recipientName}
                            onChange={(e) =>
                                handleInputChange(
                                    "recipientName",
                                    e.target.value
                                )
                            }
                            placeholder="Recipient name"
                            required
                        />
                    </div>

                    <div>
                        <Label htmlFor="recipientEmail">Recipient Email</Label>
                        <Input
                            id="recipientEmail"
                            type="email"
                            value={formData.recipientEmail}
                            onChange={(e) =>
                                handleInputChange(
                                    "recipientEmail",
                                    e.target.value
                                )
                            }
                            placeholder="Recipient email"
                            required
                        />
                    </div>

                    <div>
                        <Label htmlFor="senderName">Sender Name</Label>
                        <Input
                            id="senderName"
                            value={formData.senderName}
                            onChange={(e) =>
                                handleInputChange("senderName", e.target.value)
                            }
                            placeholder="Sender name"
                            required
                        />
                    </div>

                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {success && (
                        <Alert>
                            <CheckCircle className="h-4 w-4" />
                            <AlertDescription>
                                Message notification sent successfully!
                            </AlertDescription>
                        </Alert>
                    )}

                    <Button type="submit" disabled={loading} className="w-full">
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Sending...
                            </>
                        ) : (
                            "Send Notification"
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
};

// Main Email Examples Component
export const EmailExamples = () => {
    return (
        <div className="container mx-auto p-6 space-y-8">
            <h1 className="text-3xl font-bold text-center mb-8">
                Email Service Examples
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <WelcomeEmailForm />
                <AppointmentConfirmationForm />
                <MessageNotificationForm />
            </div>
        </div>
    );
};
