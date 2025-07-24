import { Calendar, Users } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useUserData } from "@/hooks/use-user-data";
import { useStylistFavorites } from "@/hooks/use-stylist-favorites";
import { useAppointments } from "@/hooks/use-appointments";
import { DashboardCard } from "@/components/dashboard/shared/DashboardCard";
import { WelcomeBanner } from "@/components/dashboard/shared/WelcomeBanner";

export function StylistDashboardContent() {
    const { user } = useAuth();
    const { userData } = useUserData(user?.uid);
    const { favoriteClients } = useStylistFavorites();
    const { getAppointmentsByStatus } = useAppointments();

    if (!userData) return null;

    // Get today's appointments for the stylist
    const now = new Date();
    const stylistAppointments = getAppointmentsByStatus("confirmed");

    const todaysAppointments = stylistAppointments.filter((appointment) => {
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
            <WelcomeBanner name={userData.firstName} userType="stylist" />

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <DashboardCard
                    title="Today's Appointments"
                    description="View your schedule for today"
                    icon={Calendar}
                    value={todaysAppointments.length.toString()}
                    onClick={() =>
                        (window.location.href =
                            "/dashboard/stylist/appointments")
                    }
                />
                <DashboardCard
                    title="Total Favorites"
                    description="Clients who favorited you"
                    icon={Users}
                    value={favoriteClients.length.toString()}
                />
                {/* <DashboardCard
                    title="Monthly Earnings"
                    description="Your earnings this month"
                    icon={DollarSign}
                    value={`$${monthlyEarnings.toFixed(2)}`}
                /> */}
            </div>
        </div>
    );
}
