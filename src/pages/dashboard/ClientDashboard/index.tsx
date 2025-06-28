import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { ClientDashboardHeader } from '@/components/dashboard/client/ClientDashboardHeader';
import { ClientDashboardContent } from './ClientDashboardContent';
import { SEO } from '@/components/SEO';
import { getPageMetadata } from '@/lib/metadata';

export function ClientDashboardPage() {
  return (
    <DashboardLayout>
      <SEO metadata={getPageMetadata('clientDashboard')} />
      <ClientDashboardHeader />
      <main className="flex-1 overflow-y-auto p-8">
        <ClientDashboardContent />
      </main>
    </DashboardLayout>
  );
}