import { Calendar, Users, DollarSign } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useUserData } from '@/hooks/use-user-data';
import { useStylistFavorites } from '@/hooks/use-stylist-favorites';
import { DashboardCard } from '@/components/dashboard/shared/DashboardCard';
import { WelcomeBanner } from '@/components/dashboard/shared/WelcomeBanner';

export function StylistDashboardContent() {
  const { user } = useAuth();
  const { userData } = useUserData(user?.uid);
  const { favoriteClients } = useStylistFavorites();

  if (!userData) return null;

  return (
    <div className="space-y-6">
      <WelcomeBanner name={userData.firstName} userType="stylist" />
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <DashboardCard
          title="Today's Appointments"
          description="View your schedule for today"
          icon={Calendar}
          value="0"
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
          value="$0"
        />
      </div>
    </div>
  );
}