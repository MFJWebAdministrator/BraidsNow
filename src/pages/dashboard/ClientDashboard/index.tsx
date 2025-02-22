import React from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { ClientDashboardHeader } from '@/components/dashboard/client/ClientDashboardHeader';
import { ClientDashboardContent } from './ClientDashboardContent';

export function ClientDashboardPage() {
  return (
    <DashboardLayout>
      <ClientDashboardHeader />
      <main className="flex-1 overflow-y-auto p-8">
        <ClientDashboardContent />
      </main>
    </DashboardLayout>
  );
}