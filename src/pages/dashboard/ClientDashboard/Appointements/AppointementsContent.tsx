import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { AppointmentCard } from "@/components/dashboard/AppointmentCard";
import { useAppointments } from "@/hooks/use-appointments";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Calendar,
    Search,
    CalendarDays,
    Clock,
    DollarSign,
    Plus,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

export function AppointementsContent() {
    const { loading, error, getClientAppointments } = useAppointments();

    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState("today");

    // Get client-specific appointments
    const clientAppointments = getClientAppointments();

    // Filter appointments based on search only
    const filteredAppointments = clientAppointments.filter((appointment) => {
        const appointmentDateTime = new Date(appointment.dateTime);
        const now = new Date();
        return (
            (!searchTerm ||
                appointment.stylistName
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase()) ||
                appointment.businessName
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase()) ||
                appointment.serviceName
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase())) &&
            (appointment.status === "confirmed" ||
                appointment.status === "pending") &&
            appointmentDateTime >= now
        );
    });

    const confirmedAppointments = filteredAppointments.filter(
        (a) => a.status === "confirmed"
    );

    const todaysAppointments = confirmedAppointments.filter((appointment) => {
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

    // Calculate statistics
    const confirmedAppointmentsCount = confirmedAppointments.length;
    const pendingAppointmentsCount = pendingAppointments.length;
    const totalAppointmentsCount =
        confirmedAppointmentsCount + pendingAppointmentsCount;
    const totalSpent = clientAppointments
        .filter((a) => a.paymentStatus === "paid")
        .reduce((sum, a) => sum + a.paymentAmount, 0);

    const handleBookNew = () => {
        navigate("/find-stylists");
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
                                    {totalAppointmentsCount}
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
                                <Clock className="h-5 w-5 text-yellow-600" />
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

                <Card className="border border-gray-200 shadow-md hover:shadow-lg transition-all">
                    <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 rounded-full bg-blue-100">
                                <DollarSign className="h-5 w-5 text-[#3F0052]" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">
                                    Total Spent
                                </p>
                                <p className="text-2xl font-bold text-[#3F0052]">
                                    ${totalSpent.toFixed(2)}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Action Bar */}
            <Card className="border border-gray-200 shadow-sm">
                <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-4 items-center">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Search by stylist, business, or service..."
                                    value={searchTerm}
                                    onChange={(e) =>
                                        setSearchTerm(e.target.value)
                                    }
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                onClick={handleBookNew}
                                className="bg-[#3F0052] hover:bg-[#3F0052]/90"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Book New
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Appointments Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3 bg-gray-100 p-1 rounded-lg">
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
                                <p className="text-gray-600 mb-4">
                                    You don't have any confirmed appointments
                                    scheduled for today. Ready to book your next
                                    styling session?
                                </p>
                                <Button
                                    onClick={handleBookNew}
                                    className="bg-[#3F0052] hover:bg-[#3F0052]/90"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Find a Stylist
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {todaysAppointments.map((appointment) => (
                                <AppointmentCard
                                    key={appointment.id}
                                    appointment={appointment}
                                    userRole="client"
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
                                <p className="text-gray-600 mb-4">
                                    You don't have any confirmed upcoming
                                    appointments. Ready to book your next
                                    styling session?
                                </p>
                                <Button
                                    onClick={handleBookNew}
                                    className="bg-[#3F0052] hover:bg-[#3F0052]/90"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Find a Stylist
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {upcomingAppointments.map((appointment) => (
                                <AppointmentCard
                                    key={appointment.id}
                                    appointment={appointment}
                                    userRole="client"
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
                                <p className="text-gray-600 mb-4">
                                    You don't have any pending appointments
                                    requiring stylist action.
                                </p>
                                <Button
                                    onClick={handleBookNew}
                                    className="bg-[#3F0052] hover:bg-[#3F0052]/90"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Find a Stylist
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {pendingAppointments.map((appointment) => (
                                <AppointmentCard
                                    key={appointment.id}
                                    appointment={appointment}
                                    userRole="client"
                                />
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
