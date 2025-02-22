import React from 'react';
import { Card } from '@/components/ui/card';
import { Clock } from 'lucide-react';
import type { Schedule } from '@/lib/schemas/schedule';
import { formatTime } from '@/lib/utils/time';

interface ScheduleSectionProps {
  schedule: Schedule;
}

const DAYS = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' }
] as const;

export function ScheduleSection({ schedule }: ScheduleSectionProps) {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Clock className="w-5 h-5 text-[#3F0052]" />
        <h2 className="text-xl font-light text-[#3F0052] tracking-normal">
          Hours of Operation
        </h2>
      </div>

      <div className="space-y-3">
        {DAYS.map(({ key, label }) => {
          const hours = schedule.workHours[key];
          return (
            <div 
              key={key}
              className="flex justify-between items-center py-2 border-b last:border-0"
            >
              <span className="text-gray-600 tracking-normal">{label}</span>
              <span className="text-[#3F0052] tracking-normal">
                {hours.isEnabled ? (
                  `${formatTime(hours.start.hour, hours.start.minute)} - ${formatTime(hours.end.hour, hours.end.minute)}`
                ) : (
                  'Closed'
                )}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}