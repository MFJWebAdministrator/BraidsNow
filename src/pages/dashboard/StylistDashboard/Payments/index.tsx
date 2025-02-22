import React from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { StylistDashboardHeader } from '@/components/dashboard/stylist/StylistDashboardHeader';
import { PaymentsContent } from './PaymentsContent';

export function StylistPaymentsPage() {
  return (
    <DashboardLayout>
      <StylistDashboardHeader />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-light tracking-normal text-[#3F0052]">Payments & Subscription</h1>
            <p className="text-gray-600 mt-2">Manage your payment settings and subscription</p>
          </div>
          <PaymentsContent />
        </div>
      </main>
    </DashboardLayout>
  );
}