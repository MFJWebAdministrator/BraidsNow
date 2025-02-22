import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useUserData } from '@/hooks/use-user-data';
import { ClientSidebar } from '../client/ClientSidebar';
import { StylistSidebar } from '../stylist/StylistSidebar';

export function DashboardSidebar() {
  const { user } = useAuth();
  const { userData } = useUserData(user?.uid);

  if (!userData) return null;

  return userData.userType === 'client' ? <ClientSidebar /> : <StylistSidebar />;
}