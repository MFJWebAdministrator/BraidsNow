import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { format, isBefore, setHours, setMinutes, parse, addMinutes, areIntervalsOverlapping } from 'date-fns';
import { getBookingsForDate } from '@/lib/firebase/booking/getBookings';
import type { ServiceSelection, DateTimeSelection as DateTimeSelectionType } from '@/lib/schemas/booking';
import type { Schedule } from '@/lib/schemas/schedule';
import { Matcher } from 'react-day-picker';
import { isOvertimeBooking, calculateEndTime } from '@/lib/utils/schedule-conflicts';

interface DateTimeSelectionProps {
  stylistId: string;
  selectedService: ServiceSelection;
  onSelect: (dateTime: DateTimeSelectionType) => void;
}

interface TimeSlotInfo {
  time: string;
  isAvailable: boolean;
  isBooked: boolean;
  isOvertime: boolean;
  isBreakTime: boolean;
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
      const dateString = format(selectedDate, 'yyyy-MM-dd');
      const results = await getBookingsForDate(stylistId, dateString);
      return results;
    },
    enabled: !!selectedDate,
    refetchOnWindowFocus: false,
    staleTime: 0 // Always fetch fresh data when date changes
  });

  // Reset selected time when date changes
  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedTime(undefined); // Reset time when date changes
  };

  const checkTimeSlotStatus = (timeSlot: Date, totalDurationMinutes: number): TimeSlotInfo => {
    const timeString = format(timeSlot, 'h:mm a');
    const time24 = format(timeSlot, 'HH:mm');
    // console.log(">>>>>>>>>> time24:", time24, "totalDurationMinutes:", totalDurationMinutes)
    
    
    // Check if time slot overlaps with any break
    const dayOfWeek = format(timeSlot, 'EEEE').toLowerCase() as keyof Schedule['workHours'];
    const breaks = schedule?.breaks.filter(b => b.days.includes(dayOfWeek)) || [];
    const slotStart = timeSlot;
    const slotEnd = addMinutes(timeSlot, totalDurationMinutes);
    const isBreakTime = breaks.some(b => {
      const breakStart = setMinutes(setHours(timeSlot, b.start.hour), b.start.minute);
      const breakEnd = setMinutes(setHours(timeSlot, b.end.hour), b.end.minute);
      
      // Define the two intervals
      const slotInterval = { start: slotStart, end: slotEnd };
      const breakInterval = { start: breakStart, end: breakEnd };
      // Use the dedicated function for a clear and robust check
      const overlap = areIntervalsOverlapping(slotInterval, breakInterval);
      
      // For debugging, you can still log this
      // if (overlap) {
      //     console.log("Slot overlaps with break:", { 
      //         slot: slotInterval, 
      //         break: breakInterval 
      //     });
      // }
    
      return overlap;
    });

    // Check if time slot is booked
    let isBooked = false;
    if (bookings && bookings.length > 0) {
      const slotStartTime = format(timeSlot, 'HH:mm');
      // For conflict detection, use only the service duration (not buffer times)
      const serviceDurationOnly = {
        hours: selectedService.duration?.hours || 0,
        minutes: selectedService.duration?.minutes || 0
      };
      const slotEndTime = calculateEndTime(slotStartTime, serviceDurationOnly);

      
      isBooked = bookings.some(booking => {
        if (booking.status === 'cancelled') {
          return false;
        }
        
        // Handle different possible time field names
        const bookingTime = booking.time || booking.dateTime?.time;
        if (!bookingTime) {
          return false;
        }

        
        const bookingEndTime = calculateEndTime(
          bookingTime,
          booking.service?.duration || { hours: 1, minutes: 0 }
        );

        const hasOverlap = (
          (slotStartTime < bookingEndTime && slotEndTime > bookingTime) ||
          (bookingTime < slotEndTime && bookingEndTime > slotStartTime)
        );

        if (hasOverlap) {
          console.log('Found overlap with booking:', booking.id, bookingTime, '-', bookingEndTime);
        }

        return hasOverlap;
      });
    }

    console.log(">>>>>>>>>> isBooked:", isBooked, "isBreakTime:", isBreakTime)

    // Check for overtime booking
    let isOvertime = false;
    if (schedule) {
      const workHours = schedule.workHours[dayOfWeek];
      // For overtime prevention, use total duration (including buffer times)
      // because the stylist needs the full time including preparation/cleanup
      const serviceDuration = {
        hours: Math.floor(totalDurationMinutes / 60),
        minutes: totalDurationMinutes % 60
      };
      const closingTime = `${workHours.end.hour.toString().padStart(2, '0')}:${workHours.end.minute.toString().padStart(2, '0')}`;
      isOvertime = isOvertimeBooking(time24, serviceDuration, closingTime);
      
    }

    const isAvailable = !isBooked && !isOvertime && !isBreakTime;

    return {
      time: timeString,
      isAvailable,
      isBooked,
      isOvertime,
      isBreakTime
    };
  };

  const getTimeSlotsForDate = (date: Date): TimeSlotInfo[] => {
    if (!schedule) return [];

    const dayOfWeek = format(date, 'EEEE').toLowerCase() as keyof Schedule['workHours'];
    const workHours = schedule.workHours[dayOfWeek];
    
    if (!workHours.isEnabled) return [];

    const timeSlots: TimeSlotInfo[] = [];
    let currentTime = setMinutes(setHours(date, workHours.start.hour), workHours.start.minute);
    const endTime = setMinutes(setHours(date, workHours.end.hour), workHours.end.minute);
    
    // Calculate total service duration including buffer times
    const totalDurationMinutes = 
      (selectedService.duration?.hours || 0) * 60 + 
      (selectedService.duration?.minutes || 0) +
      (schedule.bufferTime.before || 0) + 
      (schedule.bufferTime.after || 0);

    while (isBefore(currentTime, endTime)) {
      const timeSlotInfo = checkTimeSlotStatus(currentTime, totalDurationMinutes);
      timeSlots.push(timeSlotInfo);
      currentTime = addMinutes(currentTime, 30);
    }

    return timeSlots;
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
    <TooltipProvider>
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
              onSelect={handleDateSelect}
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
              classNames={{
                day_disabled: 'text-muted-foreground opacity-30 cursor-not-allowed pointer-events-none',
                day: 'h-8 w-8 p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
              }}
              disabled={(date) => {
                const dayOfWeek = format(date, 'EEEE').toLowerCase() as keyof Schedule['workHours'];
                const today = new Date();
                today.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison
                
                return (
                  isBefore(date, today) || 
                  !schedule.workHours[dayOfWeek]?.isEnabled
                );
              }}
            />
          </Card>

          {/* Time Slots */}
          <Card className="p-6">
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-[#3F0052]">Time Slots</h3>
              
              {/* Debug Panel - Remove this in production */}
              {/* {process.env.NODE_ENV === 'development' && selectedDate && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-yellow-800">Debug Info</h4>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => refetch()}
                      className="text-xs"
                    >
                      Refresh Data
                    </Button>
                  </div>
                  <div className="text-sm text-yellow-700 space-y-1">
                    <div>Selected Date: {format(selectedDate, 'yyyy-MM-dd')}</div>
                    <div>Bookings Found: {bookings?.length || 0}</div>
                    <div>Service Duration: {selectedService.duration?.hours || 0}h {selectedService.duration?.minutes || 0}m</div>
                    <div>Buffer Time: {schedule?.bufferTime.before || 0}m before + {schedule?.bufferTime.after || 0}m after</div>
                    <div>Total Duration: {Math.floor(((selectedService.duration?.hours || 0) * 60 + (selectedService.duration?.minutes || 0) + (schedule?.bufferTime.before || 0) + (schedule?.bufferTime.after || 0)) / 60)}h {((selectedService.duration?.hours || 0) * 60 + (selectedService.duration?.minutes || 0) + (schedule?.bufferTime.before || 0) + (schedule?.bufferTime.after || 0)) % 60}m</div>
                    {bookings && bookings.length > 0 && (
                      <div>
                        <div className="font-medium">Existing Bookings:</div>
                        {bookings.map((booking, index) => (
                          <div key={index} className="ml-2">
                            - {booking.time || booking.dateTime?.time} (Status: {booking.status})
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )} */}
              
              {selectedDate ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {getTimeSlotsForDate(selectedDate).map((timeSlot) => {
                    const tooltipMessage = timeSlot.isBooked 
                      ? "This time slot is already booked"
                      : timeSlot.isOvertime 
                      ? "This appointment would extend past stylist's closing time"
                      : timeSlot.isBreakTime 
                      ? "This time falls during stylist's break period"
                      : "Available for booking";
                    
                    
                    return (
                      <Tooltip key={timeSlot.time} delayDuration={300}>
                        <TooltipTrigger asChild>
                          <div className="w-full">
                            <Button
                              variant={selectedTime === timeSlot.time ? 'default' : 'outline'}
                              onClick={() => timeSlot.isAvailable && setSelectedTime(timeSlot.time)}
                              disabled={!timeSlot.isAvailable}
                              className={`w-full transition-all ${
                                timeSlot.isAvailable
                                  ? selectedTime === timeSlot.time 
                                    ? 'bg-[#3F0052] text-white shadow-lg scale-105' 
                                    : 'hover:bg-[#3F0052]/5'
                                  : 'opacity-50 cursor-not-allowed bg-gray-100 text-gray-500 hover:opacity-60'
                              }`}
                            >
                              {timeSlot.time}
                            </Button>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                          {tooltipMessage}
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
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
    </TooltipProvider>
  );
}