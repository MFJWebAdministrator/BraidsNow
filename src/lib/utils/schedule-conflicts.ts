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
    
    // Check for booking conflicts with buffer time
    if (stylistSchedule?.bufferTime) {
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
        
        // Add buffer time to the end of the existing booking
        const bookingBufferEndTime = calculateEndTime(bookingEndTime, { hours: 0, minutes: bufferAfter });
        
        // Add buffer time to the end of the new booking
        const newBookingBufferEndTime = calculateEndTime(newEndTime, { hours: 0, minutes: bufferAfter });
        
        // Check for overlap considering buffer times
        const hasBufferConflict = (
          (newStartTime < bookingBufferEndTime && newBookingBufferEndTime > booking.time) ||
          (booking.time < newBookingBufferEndTime && bookingBufferEndTime > newStartTime)
        );
        
        if (hasBufferConflict) {
          conflicts.push(`Conflicts with appointment (including buffer time): ${booking.clientName}`);
        }
      });
    } else {
      // Fallback to simple overlap checking if no buffer time is configured
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
        
        const hasOverlap = (
          (newStartTime < bookingEndTime && newEndTime > booking.time) ||
          (booking.time < newEndTime && bookingEndTime > newStartTime)
        );
        
        if (hasOverlap) {
          conflicts.push(`Conflicts with existing appointment: ${booking.clientName}`);
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
    const timeString = currentTime.toTimeString().slice(0, 5);
    const endTimeString = calculateEndTime(timeString, duration);
    
    // Check if this slot would extend past the stylist's end time
    if (endTimeString <= stylistEndTime) {
      slots.push(timeString);
    }
    
    // Move to next slot (30-minute intervals)
    currentTime.setMinutes(currentTime.getMinutes() + 30);
  }
  
  return slots;
}; 