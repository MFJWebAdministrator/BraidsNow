import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { BufferTime } from '@/lib/schemas/schedule';

interface BufferTimeSectionProps {
  bufferTime: BufferTime;
  onUpdate: (bufferTime: BufferTime) => void;
}

const BUFFER_OPTIONS = [0, 5, 10, 15, 20, 30, 45, 60];

export function BufferTimeSection({ bufferTime, onUpdate }: BufferTimeSectionProps) {
  return (
    <div className="space-y-8">
      <div className="max-w-md">
        <p className="text-gray-600 mb-6">
          Buffer time adds extra time before and after each appointment to help you prepare and wrap up.
        </p>

        <div className="space-y-6">
          <div>
            <Label>Buffer Time Before Appointment</Label>
            <Select
              value={bufferTime.before.toString()}
              onValueChange={(value) => 
                onUpdate({ ...bufferTime, before: parseInt(value) })
              }
            >
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" className="w-[140px] z-50 bg-white shadow-lg border border-gray-200">
                {BUFFER_OPTIONS.map((minutes) => (
                  <SelectItem key={minutes} value={minutes.toString()}>
                    {minutes} minutes
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Buffer Time After Appointment</Label>
            <Select
              value={bufferTime.after.toString()}
              onValueChange={(value) => 
                onUpdate({ ...bufferTime, after: parseInt(value) })
              }
            >
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" className="w-[140px] z-50 bg-white shadow-lg border border-gray-200">
                {BUFFER_OPTIONS.map((minutes) => (
                  <SelectItem key={minutes} value={minutes.toString()}>
                    {minutes} minutes
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}