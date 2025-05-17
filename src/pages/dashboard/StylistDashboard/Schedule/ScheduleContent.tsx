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
    <Card className="p-6">
      <Tabs defaultValue="work-hours">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="work-hours">Work Hours</TabsTrigger>
          <TabsTrigger value="breaks">Breaks</TabsTrigger>
          <TabsTrigger value="buffer-time">Buffer Time</TabsTrigger>
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

        <TabsContent value="buffer-time">
          <BufferTimeSection 
            bufferTime={schedule.bufferTime}
            onUpdate={updateBufferTime}
          />
        </TabsContent>
      </Tabs>
    </Card>
  );
}