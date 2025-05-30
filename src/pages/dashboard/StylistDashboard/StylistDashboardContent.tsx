import { Calendar, Users, DollarSign } from "lucide-react";
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
    const { getStylistAppointments } = useAppointments();

    if (!userData) return null;

    // Get today's appointments for the stylist
    const stylistAppointments = getStylistAppointments();
    const today = new Date().toISOString().split("T")[0];
    const todaysAppointments = stylistAppointments.filter(
        (appointment) => appointment.date === today
    );

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
                <DashboardCard
                    title="Monthly Earnings"
                    description="Your earnings this month"
                    icon={DollarSign}
                    value={`$${userData.balance.toFixed(2)}`}
                />
            </div>
        </div>
    );
}
