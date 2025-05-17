import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { ClientDashboardHeader } from '@/components/dashboard/client/ClientDashboardHeader';
import { StyleBoardContent } from './StyleBoardContent';

export function StyleBoardPage() {
  return (
    <DashboardLayout>
      <ClientDashboardHeader />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-light tracking-normal text-[#3F0052]">My Style Board</h1>
            <p className="text-gray-600 mt-2">Keep track of your hairstyle journey</p>
          </div>
          <StyleBoardContent />
        </div>
      </main>
    </DashboardLayout>
  );
}