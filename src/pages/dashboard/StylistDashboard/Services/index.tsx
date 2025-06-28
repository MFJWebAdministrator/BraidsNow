import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { StylistDashboardHeader } from '@/components/dashboard/stylist/StylistDashboardHeader';
import { ServicesContent } from './ServicesContent';
import { SEO } from '@/components/SEO';
import { getPageMetadata } from '@/lib/metadata';

export function StylistServicesPage() {
  return (
    <DashboardLayout>
      <SEO metadata={getPageMetadata('stylistServices')} />
      <StylistDashboardHeader />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-light tracking-normal text-[#3F0052]">My Services</h1>
            <p className="text-gray-600 mt-2">Add and manage your hairstyling services</p>
          </div>
          <ServicesContent />
        </div>
      </main>
    </DashboardLayout>
  );
}