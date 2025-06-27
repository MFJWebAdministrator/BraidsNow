import { getBookingsForDate } from '@/lib/firebase/booking/getBookings';
import { getStylistSchedule } from '@/lib/firebase/stylist/schedule';

export interface TimeSlot {
  startTime: string;
  endTime: string;
  date: string;
}

export interface ServiceDuration {
  hours: number;
  minutes: number;
}

/**
 * Calculate end time based on start time and service duration
 */
export const calculateEndTime = (startTime: string, duration: ServiceDuration): string => {
  const [hours, minutes] = startTime.split(':').map(Number);
  const startDate = new Date(2000, 0, 1, hours, minutes);
  
  const totalMinutes = duration.hours * 60 + duration.minutes;
  const endDate = new Date(startDate.getTime() + totalMinutes * 60000);
  
  return endDate.toTimeString().slice(0, 5);
};

/**
 * Check if a time slot would extend past stylist's closing time
 */
export const isOvertimeBooking = (
  startTime: string, 
  duration: ServiceDuration, 
  closingTime: string
): boolean => {
  const endTime = calculateEndTime(startTime, duration);
  return endTime > closingTime;
};

/**
 * Enhanced conflict checking that includes buffer time, breaks, and work hours
 */
export const checkEnhancedScheduleConflicts = async (
  stylistId: string,
  newStartTime: string,
  newEndTime: string,
  date: string,
  excludeBookingId?: string
): Promise<{ hasConflict: boolean; conflicts: string[] }> => {
  try {
    const conflicts: string[] = [];
    
    // Get existing bookings
    const existingBookings = await getBookingsForDate(stylistId, date);
    
    // Get stylist schedule
    const stylistSchedule = await getStylistSchedule(stylistId);
    
    // Check for booking conflicts
    // const bookingConflicts = existingBookings.filter(booking => {
    //   if (excludeBookingId && booking.id === excludeBookingId) return false;
    //   if (booking.status === 'cancelled') return false;
    //   if (!booking.time) return false;
      
    //   let bookingDate: string;
    //   if (booking.date instanceof Date) {
    //     bookingDate = booking.date.toISOString().split('T')[0];
    //   } else if (typeof booking.date === 'string') {
    //     bookingDate = booking.date;
    //   } else if (booking.dateTime?.date instanceof Date) {
    //     bookingDate = booking.dateTime.date.toISOString().split('T')[0];
    //   } else {
    //     return false;
    //   }
      
    //   if (bookingDate !== date) return false;
      
    //   const bookingEndTime = calculateEndTime(
    //     booking.time, 
    //     (booking as any).service?.duration || { hours: 0, minutes: 0 }
    //   );
      
    //   const hasOverlap = (
    //     (newStartTime < bookingEndTime && newEndTime > booking.time) ||
    //     (booking.time < newEndTime && bookingEndTime > newStartTime)
    //   );
      
    //   if (hasOverlap) {
    //     conflicts.push(`Conflicts with existing appointment: ${booking.clientName} - ${booking.serviceName}`);
    //   }
      
    //   return hasOverlap;
    // });
    
    // Check for buffer time conflicts
    if (stylistSchedule?.bufferTime) {
      const bufferBefore = stylistSchedule.bufferTime.before || 0;
      const bufferAfter = stylistSchedule.bufferTime.after || 0;
      
      existingBookings.forEach(booking => {
        if (excludeBookingId && booking.id === excludeBookingId) return;
        if (booking.status === 'cancelled') return;
        if (!booking.time) return;
        
        let bookingDate: string;
        if (booking.date instanceof Date) {
          bookingDate = booking.date.toISOString().split('T')[0];
        } else if (typeof booking.date === 'string') {
          bookingDate = booking.date;
        } else if (booking.dateTime?.date instanceof Date) {
          bookingDate = booking.dateTime.date.toISOString().split('T')[0];
        } else {
          return;
        }
        
        if (bookingDate !== date) return;
        
        const bookingEndTime = calculateEndTime(
          booking.time, 
          (booking as any).service?.duration || { hours: 0, minutes: 0 }
        );
        
        // Check buffer before appointment
        if (bufferBefore > 0) {
          const bufferStartTime = new Date(`2000-01-01T${booking.time}:00`);
          bufferStartTime.setMinutes(bufferStartTime.getMinutes() - bufferBefore);
          const bufferStart = bufferStartTime.toTimeString().slice(0, 5);
          
          const hasBufferConflict = (
            (newStartTime < booking.time && newEndTime > bufferStart) ||
            (bufferStart < newEndTime && booking.time > newStartTime)
          );
          
          if (hasBufferConflict) {
            conflicts.push(`Conflicts with buffer time before appointment: ${booking.clientName}`);
          }
        }
        
        // Check buffer after appointment
        if (bufferAfter > 0) {
          const bufferEndTime = new Date(`2000-01-01T${bookingEndTime}:00`);
          bufferEndTime.setMinutes(bufferEndTime.getMinutes() + bufferAfter);
          const bufferEnd = bufferEndTime.toTimeString().slice(0, 5);
          
          const hasBufferConflict = (
            (newStartTime < bufferEnd && newEndTime > bookingEndTime) ||
            (bookingEndTime < newEndTime && bufferEnd > newStartTime)
          );
          
          if (hasBufferConflict) {
            conflicts.push(`Conflicts with buffer time after appointment: ${booking.clientName}`);
          }
        }
      });
    }
    
    // Check for break conflicts
    if (stylistSchedule?.breaks) {
      const selectedDate = new Date(date);
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayOfWeek = dayNames[selectedDate.getDay()];
      
      stylistSchedule.breaks.forEach(breakItem => {
        if (breakItem.days.includes(dayOfWeek as any)) {
          const breakStart = `${breakItem.start.hour.toString().padStart(2, '0')}:${breakItem.start.minute.toString().padStart(2, '0')}`;
          const breakEnd = `${breakItem.end.hour.toString().padStart(2, '0')}:${breakItem.end.minute.toString().padStart(2, '0')}`;
          
          const hasBreakConflict = (
            (newStartTime < breakEnd && newEndTime > breakStart) ||
            (breakStart < newEndTime && breakEnd > newStartTime)
          );
          
          if (hasBreakConflict) {
            conflicts.push(`Conflicts with scheduled break: ${breakItem.name}`);
          }
        }
      });
    }
    
    // Check for work hours conflicts
    if (stylistSchedule?.workHours) {
      const selectedDate = new Date(date);
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayOfWeek = dayNames[selectedDate.getDay()] as keyof typeof stylistSchedule.workHours;
      const workHours = stylistSchedule.workHours[dayOfWeek];
      
      if (!workHours.isEnabled) {
        conflicts.push('Stylist is not available on this day');
      } else {
        const workStart = `${workHours.start.hour.toString().padStart(2, '0')}:${workHours.start.minute.toString().padStart(2, '0')}`;
        const workEnd = `${workHours.end.hour.toString().padStart(2, '0')}:${workHours.end.minute.toString().padStart(2, '0')}`;
        console.log
        if (newStartTime < workStart) {
          conflicts.push('Time is before stylist\'s work hours');
        }
        
        if (newEndTime > workEnd) {
          conflicts.push('Time extends past stylist\'s work hours');
        }
      }
    }
    
    return {
      hasConflict: conflicts.length > 0,
      conflicts
    };
  } catch (error) {
    console.error('Error checking enhanced schedule conflicts:', error);
    return {
      hasConflict: false,
      conflicts: []
    };
  }
};

/**
 * Check for schedule conflicts with existing bookings
 */
export const checkScheduleConflicts = async (
  stylistId: string,
  newStartTime: string,
  newEndTime: string,
  date: string,
  excludeBookingId?: string
): Promise<boolean> => {
  try {
    const existingBookings = await getBookingsForDate(stylistId, date);
    
    const conflicts = existingBookings.filter(booking => {
      // Skip the booking we're updating (if any)
      if (excludeBookingId && booking.id === excludeBookingId) return false;
      
      // Skip cancelled bookings
      if (booking.status === 'cancelled') return false;
      
      // Skip bookings without required time data
      if (!booking.time) return false;
      
      // Check if booking is on the same date
      // Handle both date formats: Date object or string
      let bookingDate: string;
      if (booking.date instanceof Date) {
        bookingDate = booking.date.toISOString().split('T')[0];
      } else if (typeof booking.date === 'string') {
        bookingDate = booking.date;
      } else if (booking.dateTime?.date instanceof Date) {
        bookingDate = booking.dateTime.date.toISOString().split('T')[0];
      } else {
        return false; // Skip if we can't determine the date
      }
      
      if (bookingDate !== date) return false;
      
      // Calculate existing booking end time
      const bookingEndTime = calculateEndTime(
        booking.time, 
        (booking as any).service?.duration || { hours: 0, minutes: 0 }
      );
      
      // Check for overlap
      const hasOverlap = (
        (newStartTime < bookingEndTime && newEndTime > booking.time) ||
        (booking.time < newEndTime && bookingEndTime > newStartTime)
      );
      
      return hasOverlap;
    });
    
    return conflicts.length > 0;
  } catch (error) {
    console.error('Error checking schedule conflicts:', error);
    return false;
  }
};

/**
 * Get available time slots for a given date
 */
export const getAvailableTimeSlots = (
  stylistStartTime: string,
  stylistEndTime: string,
  duration: ServiceDuration,
  bufferMinutes: number = 15
): string[] => {
  const slots: string[] = [];
  const [startHour, startMinute] = stylistStartTime.split(':').map(Number);
  const [endHour, endMinute] = stylistEndTime.split(':').map(Number);
  
  let currentTime = new Date(2000, 0, 1, startHour, startMinute);
  const endTime = new Date(2000, 0, 1, endHour, endMinute);
  
  while (currentTime < endTime) {
    const slotStart = currentTime.toTimeString().slice(0, 5);
    const slotEnd = calculateEndTime(slotStart, duration);
    
    // Check if this slot would end before closing time
    if (slotEnd <= stylistEndTime) {
      slots.push(slotStart);
    }
    
    // Move to next slot (add buffer time)
    currentTime = new Date(currentTime.getTime() + (duration.hours * 60 + duration.minutes + bufferMinutes) * 60000);
  }
  
  return slots;
}; 