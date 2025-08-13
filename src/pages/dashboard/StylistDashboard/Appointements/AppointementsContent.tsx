import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { AppointmentCard } from "@/components/dashboard/AppointmentCard";
import { useAppointments } from "@/hooks/use-appointments";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Search, CalendarDays, Clock, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getAuthToken } from "@/lib/firebase/auth";
import axios from "axios";
import { format } from "date-fns";
const API_BASE_URL = import.meta.env.VITE_API_URL;

export function AppointementsContent() {
    const { loading, error, getStylistAppointments } = useAppointments();

    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState("today");

    // Get stylist-specific appointments
    const stylistAppointments = getStylistAppointments();

    // Filter appointments based on search
    const filteredAppointments = stylistAppointments.filter((appointment) => {
        const now = new Date();

        return (
            (!searchTerm ||
                appointment.clientName
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase()) ||
                appointment.serviceName
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase())) &&
            (appointment.status === "confirmed" ||
                appointment.status === "pending") &&
            appointment.dateTime.getTime() >= now.getTime()
        );
    });

    // Confirmed appointments
    const confirmedAppointments = filteredAppointments.filter(
        (a) => a.status === "confirmed"
    );

    const todaysAppointments = confirmedAppointments.filter((appointment) => {
        /*
        TODO:
        Here we are comparing the date string of the appointment with the date string of the current date. A more consistent way to work with 
        dates is needed.
        */
        const now = new Date();
        const todayStr = format(now, "yyyy-MM-dd");
        const appointmentDateStr = format(appointment.dateTime, "yyyy-MM-dd");
        return appointmentDateStr === todayStr;
    });

    const upcomingAppointments = confirmedAppointments.filter((appointment) => {
        const now = new Date();
        const todayStr = format(now, "yyyy-MM-dd");
        const appointmentDateStr = format(appointment.dateTime, "yyyy-MM-dd");
        return appointmentDateStr > todayStr;
    });

    const pendingAppointments = filteredAppointments.filter(
        (appointment) => appointment.status === "pending"
    );

    // Get appointments with to-be-paid status (for stylists to see appointments waiting for payment)
    const toBePaidAppointments = stylistAppointments.filter(
        (appointment) => appointment.status === "to-be-paid"
    );

    // Calculate statistics
    const confirmedAppointmentsCount = confirmedAppointments.length;
    const pendingAppointmentsCount = pendingAppointments.length;
    const toBePaidAppointmentsCount = toBePaidAppointments.length;
    const totalAppointments =
        confirmedAppointmentsCount +
        pendingAppointmentsCount +
        toBePaidAppointmentsCount;

    // handle accept appointment
    const handleAcceptAppointment = async (appointmentId: string) => {
        try {
            const token = await getAuthToken();
            const response = await axios.post(
                `${API_BASE_URL}/accept-booking`,
                { bookingId: appointmentId },
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const result = response.data;

            if (response.status === 200) {
                toast({
                    title: "Success",
                    description: "Appointment accepted successfully!",
                    duration: 3000,
                });
                // Refresh appointments
                getStylistAppointments();
            } else {
                toast({
                    title: "Error",
                    description: result.error || "Failed to accept appointment",
                    variant: "destructive",
                    duration: 3000,
                });
            }
        } catch (error: any) {
            console.error("Error accepting appointment:", error);
            const errorMessage =
                error.response?.data?.error ||
                "Failed to accept appointment. Please try again.";
            toast({
                title: "Error",
                description: errorMessage,
                variant: "destructive",
                duration: 3000,
            });
        }
    };

    // handle reject appointment
    const handleRejectAppointment = async (appointmentId: string) => {
        try {
            const token = await getAuthToken();
            await axios.post(
                `${API_BASE_URL}/reject-booking`,
                { bookingId: appointmentId },
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            toast({
                title: "Success",
                description: "Appointment rejected successfully!",
                duration: 3000,
            });
            // Refresh appointments
            getStylistAppointments();
        } catch (error: any) {
            console.error("Error rejecting appointment:", error);
            toast({
                title: "Error",
                description: "Failed to reject appointment. Please try again.",
                variant: "destructive",
                duration: 3000,
            });
        }
    };

    const handleContact = (contactInfo: { phone: string; email: string }) => {
        // TODO: Implement contact functionality
        toast({
            title: "Contact Client",
            description: `Phone: ${contactInfo.phone}, Email: ${contactInfo.email}`,
            duration: 3000,
        });
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-24" />
                    ))}
                </div>
                <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-48" />
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="text-center text-red-600">
                        <p>Error loading appointments: {error}</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border border-gray-200 shadow-md hover:shadow-lg transition-all">
                    <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 rounded-full bg-purple-100">
                                <CalendarDays className="h-5 w-5 text-[#3F0052]" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">
                                    Total Appointments
                                </p>
                                <p className="text-2xl font-bold text-[#3F0052]">
                                    {totalAppointments}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border border-gray-200 shadow-md hover:shadow-lg transition-all">
                    <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 rounded-full bg-green-100">
                                <Clock className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">
                                    Confirmed
                                </p>
                                <p className="text-2xl font-bold text-green-600">
                                    {confirmedAppointmentsCount}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border border-gray-200 shadow-md hover:shadow-lg transition-all">
                    <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 rounded-full bg-yellow-100">
                                <Users className="h-5 w-5 text-yellow-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Pending</p>
                                <p className="text-2xl font-bold text-yellow-600">
                                    {pendingAppointmentsCount}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search Only */}
            <Card className="border border-gray-200 shadow-sm">
                <CardContent className="p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search by client name or service..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </CardContent>
            </Card>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4 bg-gray-100 p-1 rounded-lg">
                    <TabsTrigger
                        className="data-[state=active]:bg-white data-[state=active]:shadow-sm font-medium"
                        value="to-be-paid"
                    >
                        Awaiting Payment ({toBePaidAppointmentsCount})
                    </TabsTrigger>
                    <TabsTrigger
                        className="data-[state=active]:bg-white data-[state=active]:shadow-sm font-medium"
                        value="today"
                    >
                        Today ({todaysAppointments.length})
                    </TabsTrigger>
                    <TabsTrigger
                        className="data-[state=active]:bg-white data-[state=active]:shadow-sm font-medium"
                        value="upcoming"
                    >
                        Upcoming ({upcomingAppointments.length})
                    </TabsTrigger>
                    <TabsTrigger
                        className="data-[state=active]:bg-white data-[state=active]:shadow-sm font-medium"
                        value="pending"
                    >
                        Pending ({pendingAppointments.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="today" className="space-y-4">
                    {todaysAppointments.length === 0 ? (
                        <Card className="border border-gray-200 shadow-sm">
                            <CardContent className="p-8 text-center">
                                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    No appointments today
                                </h3>
                                <p className="text-gray-600">
                                    You don't have any confirmed appointments
                                    scheduled for today.
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {todaysAppointments.map((appointment) => (
                                <AppointmentCard
                                    key={appointment.id}
                                    appointment={appointment}
                                    userRole="stylist"
                                    onContact={handleContact}
                                    onAcceptAppointment={
                                        handleAcceptAppointment
                                    }
                                    onRejectAppointment={
                                        handleRejectAppointment
                                    }
                                />
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="upcoming" className="space-y-4">
                    {upcomingAppointments.length === 0 ? (
                        <Card className="border border-gray-200 shadow-sm">
                            <CardContent className="p-8 text-center">
                                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    No upcoming appointments
                                </h3>
                                <p className="text-gray-600">
                                    You don't have any confirmed upcoming
                                    appointments at the moment.
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {upcomingAppointments.map((appointment) => (
                                <AppointmentCard
                                    key={appointment.id}
                                    appointment={appointment}
                                    userRole="stylist"
                                    onContact={handleContact}
                                    onAcceptAppointment={
                                        handleAcceptAppointment
                                    }
                                    onRejectAppointment={
                                        handleRejectAppointment
                                    }
                                />
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="pending" className="space-y-4">
                    {pendingAppointments.length === 0 ? (
                        <Card className="border border-gray-200 shadow-sm">
                            <CardContent className="p-8 text-center">
                                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    No pending appointments
                                </h3>
                                <p className="text-gray-600">
                                    You don't have any pending appointments
                                    requiring your action.
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {pendingAppointments.map((appointment: any) => (
                                <AppointmentCard
                                    key={appointment.id}
                                    appointment={appointment}
                                    userRole="stylist"
                                    onContact={handleContact}
                                    onAcceptAppointment={
                                        handleAcceptAppointment
                                    }
                                    onRejectAppointment={
                                        handleRejectAppointment
                                    }
                                />
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="to-be-paid" className="space-y-4">
                    {toBePaidAppointments.length === 0 ? (
                        <Card className="border border-gray-200 shadow-sm">
                            <CardContent className="p-8 text-center">
                                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    No payments due
                                </h3>
                                <p className="text-gray-600">
                                    You don't have any appointments waiting for
                                    payment.
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {toBePaidAppointments.map((appointment) => (
                                <AppointmentCard
                                    key={appointment.id}
                                    appointment={appointment}
                                    userRole="stylist"
                                    onContact={handleContact}
                                    onAcceptAppointment={
                                        handleAcceptAppointment
                                    }
                                    onRejectAppointment={
                                        handleRejectAppointment
                                    }
                                />
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
