import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { StylistDashboardHeader } from '@/components/dashboard/stylist/StylistDashboardHeader';
import { StylistDashboardContent } from './StylistDashboardContent';
import { SEO } from '@/components/SEO';
import { getPageMetadata } from '@/lib/metadata';

export function StylistDashboardPage() {
  return (
    <DashboardLayout>
      <SEO metadata={getPageMetadata('stylistDashboard')} />
      <StylistDashboardHeader />
      <main className="flex-1 overflow-y-auto p-8">
        <StylistDashboardContent />
      </main>
    </DashboardLayout>
  );
}