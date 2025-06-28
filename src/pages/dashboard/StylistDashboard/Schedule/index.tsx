import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { StylistDashboardHeader } from '@/components/dashboard/stylist/StylistDashboardHeader';
import { ScheduleContent } from './ScheduleContent';
import { SEO } from '@/components/SEO';
import { getPageMetadata } from '@/lib/metadata';

export function StylistSchedulePage() {
  return (
    <DashboardLayout>
      <SEO metadata={getPageMetadata('stylistSchedule')} />
      <StylistDashboardHeader />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-light tracking-normal text-[#3F0052]">My Schedule</h1>
            <p className="text-gray-600 mt-2">Manage your availability and working hours</p>
          </div>
          <ScheduleContent />
        </div>
      </main>
    </DashboardLayout>
  );
}