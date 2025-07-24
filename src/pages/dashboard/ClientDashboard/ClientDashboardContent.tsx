import { Calendar, MessageSquare, Heart } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useUserData } from "@/hooks/use-user-data";
import { useFavorites } from "@/hooks/use-favorites";
import { useAppointments } from "@/hooks/use-appointments";
import { DashboardCard } from "@/components/dashboard/shared/DashboardCard";
import { WelcomeBanner } from "@/components/dashboard/shared/WelcomeBanner";

export function ClientDashboardContent() {
    const { user } = useAuth();
    const { userData } = useUserData(user?.uid);
    const { favorites } = useFavorites();
    const { getAppointmentsByStatus } = useAppointments();

    if (!userData) return null;

    // Get now's appointments for the client
    const clientAppointments = getAppointmentsByStatus("confirmed");
    const now = new Date();
    const nowsAppointments = clientAppointments.filter((appointment) => {
        // Combine date and time into a single string
        const appointmentDateTimeStr = `${appointment.date}T${appointment.time}`;
        // Parse into a Date object
        const appointmentDateTime = new Date(appointmentDateTimeStr);
        // Compare to now
        return (
            appointment.date === now.toISOString().split("T")[0] &&
            appointmentDateTime >= now
        );
    });

    return (
        <div className="space-y-6">
            <WelcomeBanner name={userData.firstName} userType="client" />

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <DashboardCard
                    title="Today's Appointments"
                    description="View your appointments for today"
                    icon={Calendar}
                    value={nowsAppointments.length.toString()}
                    onClick={() =>
                        (window.location.href =
                            "/dashboard/client/appointments")
                    }
                />
                <DashboardCard
                    title="New Messages"
                    description="Check messages from your stylists"
                    icon={MessageSquare}
                    value="0"
                />
                <DashboardCard
                    title="Favorite Stylists"
                    description="Quick access to your preferred stylists"
                    icon={Heart}
                    value={favorites.length.toString()}
                />
            </div>
        </div>
    );
}
