import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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

export function AppointementsContent() {
    const { loading, error, getClientAppointments } = useAppointments();

    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [activeTab, setActiveTab] = useState("today");

    // Get client-specific appointments
    const clientAppointments = getClientAppointments();

    // Filter appointments based on search and status
    const filteredAppointments = clientAppointments.filter((appointment) => {
        const matchesSearch =
            appointment.stylistName
                .toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
            appointment.businessName
                .toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
            appointment.serviceName
                .toLowerCase()
                .includes(searchTerm.toLowerCase());
        const matchesStatus =
            statusFilter === "all" || appointment.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    // Separate appointments by time
    const upcomingAppointments = filteredAppointments.filter((appointment) => {
        const today = new Date().toISOString().split("T")[0];
        return appointment.date >= today;
    });

    const pastAppointments = filteredAppointments.filter((appointment) => {
        const today = new Date().toISOString().split("T")[0];
        return appointment.date < today;
    });

    const todaysAppointments = filteredAppointments.filter((appointment) => {
        const today = new Date().toISOString().split("T")[0];
        return appointment.date === today;
    });

    // Calculate statistics
    const totalAppointments = clientAppointments.length;
    const confirmedAppointments = clientAppointments.filter(
        (a) => a.status === "confirmed"
    ).length;
    const pendingAppointments = clientAppointments.filter(
        (a) => a.status === "pending"
    ).length;
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
                                    {confirmedAppointments}
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
                                    {pendingAppointments}
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
                            <Select
                                value={statusFilter}
                                onValueChange={setStatusFilter}
                            >
                                <SelectTrigger className="w-48">
                                    <SelectValue placeholder="Filter by status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        All Status
                                    </SelectItem>
                                    <SelectItem value="confirmed">
                                        Confirmed
                                    </SelectItem>
                                    <SelectItem value="pending">
                                        Pending
                                    </SelectItem>
                                    <SelectItem value="failed">
                                        Failed
                                    </SelectItem>
                                </SelectContent>
                            </Select>
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
                        value="past"
                    >
                        Past ({pastAppointments.length})
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
                                    You don't have any appointments scheduled
                                    for today. Ready to book your next styling
                                    session?
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
                                    You don't have any upcoming appointments.
                                    Ready to book your next styling session?
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

                <TabsContent value="past" className="space-y-4">
                    {pastAppointments.length === 0 ? (
                        <Card className="border border-gray-200 shadow-sm">
                            <CardContent className="p-8 text-center">
                                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    No past appointments
                                </h3>
                                <p className="text-gray-600 mb-4">
                                    You haven't had any appointments yet. Start
                                    your styling journey today!
                                </p>
                                <Button
                                    onClick={handleBookNew}
                                    className="bg-[#3F0052] hover:bg-[#3F0052]/90"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Book Your First Appointment
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {pastAppointments.map((appointment) => (
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
