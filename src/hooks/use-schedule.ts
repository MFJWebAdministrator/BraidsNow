import { useState, useEffect } from 'react';
import { useAuth } from './use-auth';
import { useToast } from './use-toast';
import { updateStylistSchedule, getStylistSchedule } from '@/lib/firebase/stylist/schedule';
import type { Schedule, Break } from '@/lib/schemas/schedule';

const DEFAULT_SCHEDULE: Schedule = {
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  workHours: {
    monday: { isEnabled: true, start: { hour: 9, minute: 0 }, end: { hour: 17, minute: 0 } },
    tuesday: { isEnabled: true, start: { hour: 9, minute: 0 }, end: { hour: 17, minute: 0 } },
    wednesday: { isEnabled: true, start: { hour: 9, minute: 0 }, end: { hour: 17, minute: 0 } },
    thursday: { isEnabled: true, start: { hour: 9, minute: 0 }, end: { hour: 17, minute: 0 } },
    friday: { isEnabled: true, start: { hour: 9, minute: 0 }, end: { hour: 17, minute: 0 } },
    saturday: { isEnabled: false, start: { hour: 9, minute: 0 }, end: { hour: 17, minute: 0 } },
    sunday: { isEnabled: false, start: { hour: 9, minute: 0 }, end: { hour: 17, minute: 0 } }
  },
  breaks: [],
  bufferTime: { before: 15, after: 15 }
};

export function useSchedule() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [schedule, setSchedule] = useState<Schedule>(DEFAULT_SCHEDULE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSchedule = async () => {
      if (!user) return;

      try {
        const existingSchedule = await getStylistSchedule(user.uid);
        if (existingSchedule) {
          setSchedule(existingSchedule);
        }
      } catch (error) {
        console.error('Error fetching schedule:', error);
        toast({
          title: "Error",
          description: "Failed to load schedule",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, [user, toast]);

  const updateSchedule = async (newSchedule: Schedule) => {
    if (!user) return;

    try {
      await updateStylistSchedule(user.uid, newSchedule);
      setSchedule(newSchedule);
      toast({
        title: "Success",
        description: "Schedule updated successfully"
      });
    } catch (error) {
      console.error('Error updating schedule:', error);
      toast({
        title: "Error",
        description: "Failed to update schedule",
        variant: "destructive"
      });
    }
  };

  const addBreak = async (newBreak: Break) => {
    const updatedSchedule = {
      ...schedule,
      breaks: [...schedule.breaks, newBreak]
    };
    await updateSchedule(updatedSchedule);
  };

  const updateBreak = async (breakId: string, updatedBreak: Break) => {
    const updatedSchedule = {
      ...schedule,
      breaks: schedule.breaks.map(b => b.id === breakId ? updatedBreak : b)
    };
    await updateSchedule(updatedSchedule);
  };

  const deleteBreak = async (breakId: string) => {
    const updatedSchedule = {
      ...schedule,
      breaks: schedule.breaks.filter(b => b.id !== breakId)
    };
    await updateSchedule(updatedSchedule);
  };

  const updateWorkHours = async (day: keyof Schedule['workHours'], workHours: Schedule['workHours'][keyof Schedule['workHours']]) => {
    const updatedSchedule = {
      ...schedule,
      workHours: {
        ...schedule.workHours,
        [day]: workHours
      }
    };
    await updateSchedule(updatedSchedule);
  };

  const updateBufferTime = async (bufferTime: Schedule['bufferTime']) => {
    const updatedSchedule = {
      ...schedule,
      bufferTime
    };
    await updateSchedule(updatedSchedule);
  };

  return {
    schedule,
    loading,
    updateSchedule,
    addBreak,
    updateBreak,
    deleteBreak,
    updateWorkHours,
    updateBufferTime
  };
}