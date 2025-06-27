import { getBookingsForDate } from '@/lib/firebase/booking/getBookings';

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
        booking.service?.duration || { hours: 0, minutes: 0 }
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