import React from 'react';
import { Calendar, MessageSquare, Heart } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useUserData } from '@/hooks/use-user-data';
import { useFavorites } from '@/hooks/use-favorites';
import { DashboardCard } from '@/components/dashboard/shared/DashboardCard';
import { WelcomeBanner } from '@/components/dashboard/shared/WelcomeBanner';

export function ClientDashboardContent() {
  const { user } = useAuth();
  const { userData } = useUserData(user?.uid);
  const { favorites } = useFavorites();

  if (!userData) return null;

  return (
    <div className="space-y-6">
      <WelcomeBanner name={userData.firstName} userType="client" />
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <DashboardCard
          title="Upcoming Appointments"
          description="View and manage your scheduled appointments"
          icon={Calendar}
          value="0"
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