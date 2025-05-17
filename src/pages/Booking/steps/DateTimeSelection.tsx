import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { format, isAfter, isBefore, setHours, setMinutes, parse, addMinutes } from 'date-fns';
import { getBookingsForDate } from '@/lib/firebase/booking/getBookings';
import type { ServiceSelection, DateTimeSelection as DateTimeSelectionType } from '@/lib/schemas/booking';
import type { Schedule } from '@/lib/schemas/schedule';
import { Matcher } from 'react-day-picker';

interface DateTimeSelectionProps {
  stylistId: string;
  selectedService: ServiceSelection;
  onSelect: (dateTime: DateTimeSelectionType) => void;
}

export function DateTimeSelection({ stylistId, selectedService, onSelect }: DateTimeSelectionProps) {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>();

  // Fetch stylist's schedule
  const { data: schedule, isLoading: isLoadingSchedule } = useQuery({
    queryKey: ['stylist-schedule', stylistId],
    queryFn: async () => {
      const docRef = doc(db, 'stylists', stylistId, 'settings', 'schedule');
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) return null;
      return docSnap.data() as Schedule;
    }
  });

  // Fetch bookings for selected date
  const { data: bookings, isLoading: isLoadingBookings } = useQuery({
    queryKey: ['bookings', stylistId, selectedDate],
    queryFn: async () => {
      if (!selectedDate) return [];
      return getBookingsForDate(stylistId, format(selectedDate, 'yyyy-MM-dd'));
    },
    enabled: !!selectedDate
  });

  const isTimeSlotAvailable = (timeSlot: Date, serviceDuration: number) => {
    if (!bookings) return true;

    // Calculate end time of this slot
    const slotEnd = addMinutes(timeSlot, serviceDuration);

    // Check if slot overlaps with any existing booking
    return !bookings.some(booking => {
      const bookingTime = parse(booking.dateTime.time, 'HH:mm', new Date());
      const bookingStart = setMinutes(setHours(timeSlot, bookingTime.getHours()), bookingTime.getMinutes());
      const bookingEnd = addMinutes(bookingStart, serviceDuration);

      return (
        (timeSlot >= bookingStart && timeSlot < bookingEnd) ||
        (slotEnd > bookingStart && slotEnd <= bookingEnd) ||
        (timeSlot <= bookingStart && slotEnd >= bookingEnd)
      );
    });
  };

  const getAvailableTimesForDate = (date: Date) => {
    if (!schedule) return [];

    const dayOfWeek = format(date, 'EEEE').toLowerCase() as keyof Schedule['workHours'];
    const workHours = schedule.workHours[dayOfWeek];
    
    if (!workHours.isEnabled) return [];

    const times: string[] = [];
    let currentTime = setMinutes(setHours(date, workHours.start.hour), workHours.start.minute);
    const endTime = setMinutes(setHours(date, workHours.end.hour), workHours.end.minute);

    // Calculate total service duration including buffer times
    const totalDuration = 
      (selectedService.duration?.hours || 0) * 60 + 
      (selectedService.duration?.minutes || 0) +
      (schedule.bufferTime.before || 0) + 
      (schedule.bufferTime.after || 0);

    // Account for breaks
    const breaks = schedule.breaks.filter(b => b.days.includes(dayOfWeek));

    while (isBefore(currentTime, endTime)) {
      // Format time in 12-hour format
      const timeString = format(currentTime, 'h:mm a');
      
      // Check if time slot overlaps with any break
      const isBreakTime = breaks.some(b => {
        const breakStart = setMinutes(setHours(date, b.start.hour), b.start.minute);
        const breakEnd = setMinutes(setHours(date, b.end.hour), b.end.minute);
        return !isAfter(currentTime, breakEnd) && !isBefore(addMinutes(currentTime, totalDuration), breakStart);
      });

      // Check if time slot is available (not booked)
      const isAvailable = isTimeSlotAvailable(currentTime, totalDuration);

      if (!isBreakTime && isAvailable) {
        times.push(timeString);
      }

      currentTime = addMinutes(currentTime, 30);
    }

    return times;
  };

  const handleSubmit = () => {
    if (!selectedDate || !selectedTime) return;
    const time24 = format(parse(selectedTime, 'h:mm a', new Date()), 'HH:mm');
    onSelect({ date: selectedDate, time: time24 });
  };

  if (isLoadingSchedule || isLoadingBookings) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3F0052]" />
      </div>
    );
  }

  if (!schedule) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <p className="text-gray-500">Schedule not available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-light text-[#3F0052] mb-2">Choose Date & Time</h2>
        <p className="text-gray-600">Select when you'd like to book your appointment</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Calendar */}
        <Card className="p-4">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="rounded-md border shadow-sm"
            modifiers={{
              selected: selectedDate as Matcher | Matcher[],
            }}
            modifiersStyles={{
              selected: {
                backgroundColor: '#3F0052',
                color: 'white',
                borderRadius: '0.5rem',
              }
            }}
            disabled={(date) => {
              const dayOfWeek = format(date, 'EEEE').toLowerCase() as keyof Schedule['workHours'];
              return (
                isBefore(date, new Date()) || 
                !schedule.workHours[dayOfWeek].isEnabled
              );
            }}
          />
        </Card>

        {/* Time Slots */}
        <Card className="p-6">
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-[#3F0052]">Available Times</h3>
            {selectedDate ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {getAvailableTimesForDate(selectedDate).map((time) => (
                  <Button
                    key={time}
                    variant={selectedTime === time ? 'default' : 'outline'}
                    onClick={() => setSelectedTime(time)}
                    className={`w-full transition-all ${
                      selectedTime === time 
                        ? 'bg-[#3F0052] text-white shadow-lg scale-105' 
                        : 'hover:bg-[#3F0052]/5'
                    }`}
                  >
                    {time}
                  </Button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-500">Please select a date first</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={!selectedDate || !selectedTime}
          className="rounded-full px-8"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}