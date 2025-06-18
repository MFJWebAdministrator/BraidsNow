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
    const { getClientAppointments } = useAppointments();

    if (!userData) return null;

    // Get today's appointments for the client
    const clientAppointments = getClientAppointments();
    const today = new Date().toISOString().split("T")[0];
    const todaysAppointments = clientAppointments.filter(
        (appointment) => appointment.date === today
    );

    return (
        <div className="space-y-6">
            <WelcomeBanner name={userData.firstName} userType="client" />

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <DashboardCard
                    title="Today's Appointments"
                    description="View your appointments for today"
                    icon={Calendar}
                    value={todaysAppointments.length.toString()}
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
