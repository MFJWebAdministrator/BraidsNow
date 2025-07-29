import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    format,
    isBefore,
    setHours,
    setMinutes,
    parse,
    addMinutes,
} from "date-fns";
import { getBookingsForDate } from "@/lib/firebase/booking/getBookings";
import type { ServiceSelection } from "@/lib/schemas/booking";
import type { Schedule } from "@/lib/schemas/schedule";
import { Matcher } from "react-day-picker";
import { isOvertimeBooking } from "@/lib/utils/schedule-conflicts";
import {
    checkTimeSlotOverlap,
    isLastAppointmentOfDay,
    getDayName,
    checkBreakOverlap,
    calculateTotalBookingTime,
} from "@/lib/utils/booking-time-utils";
import { toZonedTime } from "date-fns-tz";
interface DateTimeSelectionProps {
    stylistId: string;
    selectedService: ServiceSelection;
    onSelect: (dateTime: Date) => void;
}

interface TimeSlotInfo {
    time: string;
    isAvailable: boolean;
    isBooked: boolean;
    isOvertime: boolean;
    isBreakTime: boolean;
}

export function DateTimeSelection({
    stylistId,
    selectedService,
    onSelect,
}: DateTimeSelectionProps) {
    const [selectedDate, setSelectedDate] = useState<Date>();
    const [selectedTime, setSelectedTime] = useState<string>();

    // Fetch stylist's schedule
    const { data: schedule, isLoading: isLoadingSchedule } = useQuery({
        queryKey: ["stylist-schedule", stylistId],
        queryFn: async () => {
            const docRef = doc(
                db,
                "stylists",
                stylistId,
                "settings",
                "schedule"
            );
            const docSnap = await getDoc(docRef);
            if (!docSnap.exists()) return null;
            return docSnap.data() as Schedule;
        },
    });

    // Convert schedule and breaks to browser's local timezone
    const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    let localSchedule = schedule;
    if (schedule) {
        // Convert workHours
        localSchedule = {
            ...schedule,
            workHours: Object.fromEntries(
                Object.entries(schedule.workHours).map(([day, wh]) => {
                    // Create a date for conversion (arbitrary date, just for time)
                    const baseDate = new Date();
                    const startUtc = Date.UTC(
                        baseDate.getFullYear(),
                        baseDate.getMonth(),
                        baseDate.getDate(),
                        wh.start.hour,
                        wh.start.minute
                    );

                    const endUtc = Date.UTC(
                        baseDate.getFullYear(),
                        baseDate.getMonth(),
                        baseDate.getDate(),
                        wh.end.hour,
                        wh.end.minute
                    );

                    const startLocal = toZonedTime(startUtc, browserTz);
                    const endLocal = toZonedTime(endUtc, browserTz);

                    return [
                        day,
                        {
                            ...wh,
                            start: {
                                hour: startLocal.getHours(),
                                minute: startLocal.getMinutes(),
                            },
                            end: {
                                hour: endLocal.getHours(),
                                minute: endLocal.getMinutes(),
                            },
                        },
                    ];
                })
            ) as Schedule["workHours"],
            breaks: schedule.breaks.map((br) => {
                const baseDate = new Date();
                const startUtc = Date.UTC(
                    baseDate.getFullYear(),
                    baseDate.getMonth(),
                    baseDate.getDate(),
                    br.start.hour,
                    br.start.minute
                );

                const endUtc = Date.UTC(
                    baseDate.getFullYear(),
                    baseDate.getMonth(),
                    baseDate.getDate(),
                    br.end.hour,
                    br.end.minute
                );
                const startLocal = toZonedTime(startUtc, browserTz);
                const endLocal = toZonedTime(endUtc, browserTz);

                return {
                    ...br,
                    start: {
                        hour: startLocal.getHours(),
                        minute: startLocal.getMinutes(),
                    },
                    end: {
                        hour: endLocal.getHours(),
                        minute: endLocal.getMinutes(),
                    },
                };
            }),
        };
    }

    // Fetch bookings for selected date
    const { data: bookings, isLoading: isLoadingBookings } = useQuery({
        queryKey: ["bookings", stylistId, selectedDate],
        queryFn: async () => {
            if (!selectedDate) return [];
            const dateString = format(selectedDate, "yyyy-MM-dd");
            const results = await getBookingsForDate(stylistId, dateString);
            return results;
        },
        enabled: !!selectedDate,
        refetchOnWindowFocus: false,
        staleTime: 0, // Always fetch fresh data when date changes
    });

    // Reset selected time when date changes
    const handleDateSelect = (date: Date | undefined) => {
        setSelectedDate(date);
        setSelectedTime(undefined); // Reset time when date changes
    };

    const checkTimeSlotStatus = (timeSlot: Date): TimeSlotInfo => {
        const timeString = format(timeSlot, "h:mm a");
        const time24 = format(timeSlot, "HH:mm");
        const dayOfWeek = format(
            timeSlot,
            "EEEE"
        ).toLowerCase() as keyof Schedule["workHours"];
        const dayName = getDayName(timeSlot);

        // Calculate service duration
        const serviceDuration = {
            hours: selectedService.duration?.hours || 0,
            minutes: selectedService.duration?.minutes || 0,
        };

        // Check if service period overlaps with any break periods
        const isBreakTimeSlot =
            localSchedule && localSchedule.breaks
                ? checkBreakOverlap(
                      time24,
                      serviceDuration,
                      localSchedule.breaks,
                      dayName
                  )
                : false;

        // Check if time slot conflicts with existing bookings
        let isBooked = false;
        if (bookings && bookings.length > 0) {
            const slotStartTime = format(timeSlot, "HH:mm");

            // Get buffer time from schedule
            const bufferTime = localSchedule?.bufferTime?.after || 0;

            isBooked = bookings.some((booking) => {
                if (booking.status === "cancelled") {
                    return false;
                }

                // Handle different possible time field names
                // Parse the time from the dateTime field (assume ISO string or Date object)
                let bookingTime: string | undefined;
                if (!booking.dateTime) {
                    return false;
                }

                // booking.dateTime may be a string or Date
                const dateObj =
                    typeof booking.dateTime === "string"
                        ? new Date(booking.dateTime)
                        : booking.dateTime;

                if (!isNaN(dateObj.getTime())) {
                    bookingTime = format(dateObj, "HH:mm");
                }

                if (!bookingTime) {
                    return false;
                }

                // Get the actual service duration for the existing booking
                const bookingServiceDuration = booking.service?.duration || {
                    hours: 1,
                    minutes: 0,
                };

                // Check for overlap using the utility function
                return checkTimeSlotOverlap(
                    slotStartTime,
                    serviceDuration,
                    bookingTime,
                    bookingServiceDuration,
                    bufferTime
                );
            });
        }

        // Check for overtime booking
        let isOvertime = false;
        if (localSchedule) {
            const workHours = localSchedule.workHours[dayOfWeek];

            // For overtime checking, we need to consider if this is the last appointment of the day
            // If it is, we add buffer time to ensure the stylist can finish on time
            const isLastAppointment = isLastAppointmentOfDay(
                time24,
                bookings || []
            );

            let overtimeDuration = serviceDuration;
            if (isLastAppointment) {
                // Add buffer time only for the last appointment of the day
                const bufferTime = localSchedule.bufferTime?.after || 0;
                overtimeDuration = calculateTotalBookingTime(
                    serviceDuration,
                    bufferTime
                );
            }

            const closingTime = `${workHours.end.hour.toString().padStart(2, "0")}:${workHours.end.minute.toString().padStart(2, "0")}`;
            isOvertime = isOvertimeBooking(
                time24,
                overtimeDuration,
                closingTime
            );
        }

        const isAvailable = !isBooked && !isOvertime && !isBreakTimeSlot;

        return {
            time: timeString,
            isAvailable,
            isBooked,
            isOvertime,
            isBreakTime: isBreakTimeSlot,
        };
    };

    const getTimeSlotsForDate = (date: Date): TimeSlotInfo[] => {
        if (!localSchedule) return [];

        const dayOfWeek = format(
            date,
            "EEEE"
        ).toLowerCase() as keyof Schedule["workHours"];
        const workHours = localSchedule.workHours[dayOfWeek];

        if (!workHours.isEnabled) return [];

        const timeSlots: TimeSlotInfo[] = [];
        let currentTime = setMinutes(
            setHours(date, workHours.start.hour),
            workHours.start.minute
        );
        const endTime = setMinutes(
            setHours(date, workHours.end.hour),
            workHours.end.minute
        );

        // Only allow slots at least 30 minutes in the future
        const now = new Date();
        const minAllowedTime = addMinutes(now, 30);

        while (isBefore(currentTime, endTime)) {
            // Only add slots at least 30 minutes from now
            if (currentTime >= minAllowedTime) {
                const timeSlotInfo = checkTimeSlotStatus(currentTime);
                timeSlots.push(timeSlotInfo);
            }
            currentTime = addMinutes(currentTime, 30);
        }

        return timeSlots;
    };

    const handleSubmit = () => {
        if (!selectedDate || !selectedTime) return;
        const time24 = format(
            parse(selectedTime, "h:mm a", new Date()),
            "HH:mm"
        );
        // Combine selectedDate and time24 into a single Date object
        const [hours, minutes] = time24.split(":").map(Number);
        const dateTime = new Date(selectedDate);
        dateTime.setHours(hours, minutes, 0, 0);
        onSelect(dateTime);
    };

    if (isLoadingSchedule || isLoadingBookings) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3F0052]" />
            </div>
        );
    }

    if (!localSchedule) {
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
                    <h2 className="text-2xl font-light text-[#3F0052] mb-2">
                        Choose Date & Time
                    </h2>
                    <p className="text-gray-600">
                        Select when you'd like to book your appointment
                    </p>
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
                                    backgroundColor: "#3F0052",
                                    color: "white",
                                    borderRadius: "0.5rem",
                                },
                            }}
                            classNames={{
                                day_disabled:
                                    "text-muted-foreground opacity-30 cursor-not-allowed pointer-events-none",
                                day: "h-8 w-8 p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                            }}
                            disabled={(date) => {
                                const dayOfWeek = format(
                                    date,
                                    "EEEE"
                                ).toLowerCase() as keyof Schedule["workHours"];
                                const today = new Date();
                                today.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison

                                return (
                                    isBefore(date, today) ||
                                    !localSchedule.workHours[dayOfWeek]
                                        ?.isEnabled
                                );
                            }}
                        />
                    </Card>

                    {/* Time Slots */}
                    <Card className="p-6">
                        <div className="space-y-6">
                            <h3 className="text-lg font-medium text-[#3F0052]">
                                Time Slots
                            </h3>

                            {selectedDate ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {getTimeSlotsForDate(selectedDate).map(
                                        (timeSlot) => {
                                            const tooltipMessage =
                                                timeSlot.isBooked
                                                    ? "This time slot is already booked"
                                                    : timeSlot.isOvertime
                                                      ? "This appointment would extend past stylist's closing time"
                                                      : timeSlot.isBreakTime
                                                        ? "This appointment would overlap with stylist's break period"
                                                        : "Available for booking";

                                            return (
                                                <Tooltip
                                                    key={timeSlot.time}
                                                    delayDuration={300}
                                                >
                                                    <TooltipTrigger asChild>
                                                        <div className="w-full">
                                                            <Button
                                                                variant={
                                                                    selectedTime ===
                                                                    timeSlot.time
                                                                        ? "default"
                                                                        : "outline"
                                                                }
                                                                onClick={() =>
                                                                    timeSlot.isAvailable &&
                                                                    setSelectedTime(
                                                                        timeSlot.time
                                                                    )
                                                                }
                                                                disabled={
                                                                    !timeSlot.isAvailable
                                                                }
                                                                className={`w-full transition-all ${
                                                                    timeSlot.isAvailable
                                                                        ? selectedTime ===
                                                                          timeSlot.time
                                                                            ? "bg-[#3F0052] text-white shadow-lg scale-105"
                                                                            : "hover:bg-[#3F0052]/5"
                                                                        : "opacity-50 cursor-not-allowed bg-gray-100 text-gray-500 hover:opacity-60"
                                                                }`}
                                                            >
                                                                {timeSlot.time}
                                                            </Button>
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent
                                                        side="top"
                                                        className="max-w-xs bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg text-white rounded-2xl"
                                                    >
                                                        {tooltipMessage}
                                                    </TooltipContent>
                                                </Tooltip>
                                            );
                                        }
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-8 bg-gray-50 rounded-lg">
                                    <p className="text-gray-500">
                                        Please select a date first
                                    </p>
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
