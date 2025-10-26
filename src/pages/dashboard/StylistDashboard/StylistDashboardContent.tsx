import { Calendar, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { useUserData } from "@/hooks/use-user-data";
import { useStylistFavorites } from "@/hooks/use-stylist-favorites";
import { useAppointments } from "@/hooks/use-appointments";
import { DashboardCard } from "@/components/dashboard/shared/DashboardCard";
import { WelcomeBanner } from "@/components/dashboard/shared/WelcomeBanner";
import { format } from "date-fns";

export function StylistDashboardContent() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { userData } = useUserData(user?.uid);
    const { favoriteClients } = useStylistFavorites();
    const { getAppointmentsByStatus } = useAppointments();

    if (!userData) return null;

    // Get today's appointments for the stylist
    const now = new Date();
    const stylistAppointments = getAppointmentsByStatus("confirmed");

    const todaysAppointments = stylistAppointments.filter((appointment) => {
        return (
            format(appointment.dateTime, "yyyy-MM-dd") ===
                format(now, "yyyy-MM-dd") &&
            appointment.dateTime.getTime() >= now.getTime()
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
                    onClick={() => navigate("/dashboard/stylist/appointments")}
                />
                <DashboardCard
                    title="Total Favorites"
                    description="Clients who favorited you"
                    icon={Users}
                    value={favoriteClients.length.toString()}
                    onClick={() => navigate("/dashboard/stylist/favorites")}
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
