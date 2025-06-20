import { useSchedule } from '@/hooks/use-schedule';
import { WorkHoursSection } from './sections/WorkHoursSection';
import { BreaksSection } from './sections/BreaksSection';
import { BufferTimeSection } from './sections/BufferTimeSection';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export function ScheduleContent() {
  const { 
    schedule,
    loading,
    updateWorkHours,
    addBreak,
    updateBreak,
    deleteBreak,
    updateBufferTime
  } = useSchedule();

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#3F0052]" />
      </div>
    );
  }

  return (
    <Card className="p-4 sm:p-6 w-full ">
      <Tabs defaultValue="work-hours" className='w-full'>
        <TabsList
          className="
            flex w-full mb-6 gap-2
            border-b border-gray-200
            px-4
            overflow-x-auto
            whitespace-nowrap
            pl-2 pr-2
            sm:grid sm:grid-cols-3 sm:gap-0 sm:overflow-x-visible sm:whitespace-normal
          "
        >
          <TabsTrigger className="w-full" value="work-hours">Work Hours</TabsTrigger>
          <TabsTrigger className="w-full" value="breaks">Breaks</TabsTrigger>
          <TabsTrigger className="w-full" value="buffer-time">Buffer Time</TabsTrigger>
        </TabsList>

        <TabsContent value="work-hours">
          <WorkHoursSection 
            workHours={schedule.workHours}
            onUpdate={updateWorkHours}
          />
        </TabsContent>

        <TabsContent value="breaks">
          <BreaksSection 
            breaks={schedule.breaks}
            onAdd={addBreak}
            onUpdate={updateBreak}
            onDelete={deleteBreak}
          />
        </TabsContent>

        <TabsContent value="buffer-time" className=''>
          <BufferTimeSection 
            bufferTime={schedule.bufferTime}
            onUpdate={updateBufferTime}
          />
        </TabsContent>
      </Tabs>
    </Card>
  );
}