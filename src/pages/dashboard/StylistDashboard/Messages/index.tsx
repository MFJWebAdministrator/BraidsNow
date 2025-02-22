import React from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { StylistDashboardHeader } from '@/components/dashboard/stylist/StylistDashboardHeader';
import { MessagesContent } from './MessagesContent';

export function StylistMessagesPage() {
  return (
    <DashboardLayout>
      <StylistDashboardHeader />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-light tracking-normal text-[#3F0052]">Messages</h1>
            <p className="text-gray-600 mt-2">Communicate with your clients</p>
          </div>
          <MessagesContent />
        </div>
      </main>
    </DashboardLayout>
  );
}