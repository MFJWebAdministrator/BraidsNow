import React from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { StylistDashboardHeader } from '@/components/dashboard/stylist/StylistDashboardHeader';
import { StylistDashboardContent } from './StylistDashboardContent';

export function StylistDashboardPage() {
  return (
    <DashboardLayout>
      <StylistDashboardHeader />
      <main className="flex-1 overflow-y-auto p-8">
        <StylistDashboardContent />
      </main>
    </DashboardLayout>
  );
}