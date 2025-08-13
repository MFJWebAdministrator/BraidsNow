import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useAppointments, type Appointment } from "@/hooks/use-appointments";
import { useSchedule } from "@/hooks/use-schedule";
import { useToast } from "@/hooks/use-toast";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { StylistDashboardHeader } from "@/components/dashboard/stylist/StylistDashboardHeader";
import { GoogleCalendarConnect } from "@/components/GoogleCalendarConnect";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { CalendarModal } from "@/components/calendar/CalendarModal";
import { SEO } from "@/components/SEO";
import { getPageMetadata } from "@/lib/metadata";

// Custom hook for responsive calendar behavior
const useResponsiveCalendar = () => {
    const [isMobile, setIsMobile] = useState(false);
    const [currentView, setCurrentView] = useState("timeGridWeek");

    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            if (mobile && currentView === "timeGridWeek") {
                setCurrentView("dayGridMonth");
            } else if (!mobile && currentView === "dayGridMonth") {
                setCurrentView("timeGridWeek");
            }
        };

        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, [currentView]);

    return { isMobile, currentView, setCurrentView };
};

export function CalendarPage() {
    const { user } = useAuth();
    const { loading, getStylistAppointments } = useAppointments();
    const { schedule } = useSchedule();
    const { toast } = useToast();
    const { isMobile, currentView } = useResponsiveCalendar();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedEnd, setSelectedEnd] = useState<Date | null>(null);
    const [selectedEvent, setSelectedEvent] = useState<any>(null);

    // Get only stylist appointments for the calendar
    const stylistAppointments = getStylistAppointments();

    // Generate break events for the current month view
    const generateBreakEvents = () => {
        const breakEvents: any[] = [];
        const today = new Date();
        const startOfMonth = new Date(
            today.getFullYear(),
            today.getMonth() - 1,
            1
        );
        const endOfMonth = new Date(
            today.getFullYear(),
            today.getMonth() + 2,
            0
        );

        console.log(
            ">>>>>>>>>>>>>>>>> schedule Break >>>>>>>>>>>>>>>>>>>",
            schedule.breaks
        );

        schedule.breaks.forEach((breakItem) => {
            const dayNames = [
                "sunday",
                "monday",
                "tuesday",
                "wednesday",
                "thursday",
                "friday",
                "saturday",
            ];

            breakItem.days.forEach((day) => {
                const dayIndex = dayNames.indexOf(day);
                if (dayIndex === -1) return;

                const currentDate = new Date(startOfMonth);
                while (currentDate <= endOfMonth) {
                    if (currentDate.getDay() === dayIndex) {
                        const startDate = new Date(currentDate);
                        startDate.setHours(
                            breakItem.start.hour,
                            breakItem.start.minute,
                            0,
                            0
                        );

                        const endDate = new Date(currentDate);
                        endDate.setHours(
                            breakItem.end.hour,
                            breakItem.end.minute,
                            0,
                            0
                        );

                        breakEvents.push({
                            id: `break-${breakItem.id}-${currentDate.toISOString().split("T")[0]}`,
                            title: breakItem.name,
                            start: startDate,
                            end: endDate,
                            backgroundColor: "#10B981", // Green color for breaks
                            borderColor: "#10B981",
                            textColor: "white",
                            extendedProps: {
                                isBreak: true,
                                break: breakItem,
                            },
                        });
                    }
                    currentDate.setDate(currentDate.getDate() + 1);
                }
            });
        });

        return breakEvents;
    };

    // Generate buffer zone events for appointments
    const generateBufferZoneEvents = () => {
        const bufferEvents: any[] = [];

        if (!stylistAppointments) return bufferEvents;

        stylistAppointments
            .filter(
                (appointment: Appointment) => appointment.status !== "cancelled"
            )
            .forEach((appointment: Appointment) => {
                const startDate = appointment.dateTime;

                // Calculate service duration (default 1 hour if not specified)
                const serviceDuration = (appointment as any).service
                    ?.duration || { hours: 1, minutes: 0 };
                const serviceEndDate = new Date(
                    startDate.getTime() +
                        (serviceDuration.hours * 60 + serviceDuration.minutes) *
                            60000
                );

                // Generate buffer before appointment
                if (schedule.bufferTime.before > 0) {
                    const bufferStartDate = new Date(
                        startDate.getTime() - schedule.bufferTime.before * 60000
                    );
                    bufferEvents.push({
                        id: `buffer-before-${appointment.id}`,
                        title: "Buffer Time",
                        start: bufferStartDate,
                        end: startDate,
                        backgroundColor: "rgba(63, 0, 82, 0.3)", // Semi-transparent purple
                        borderColor: "rgba(63, 0, 82, 0.5)",
                        textColor: "#3F0052",
                        display: "background",
                        extendedProps: {
                            isBuffer: true,
                            appointmentId: appointment.id,
                            bufferType: "before",
                        },
                    });
                }

                // Generate buffer after appointment
                if (schedule.bufferTime.after > 0) {
                    const bufferEndDate = new Date(
                        serviceEndDate.getTime() +
                            schedule.bufferTime.after * 60000
                    );
                    bufferEvents.push({
                        id: `buffer-after-${appointment.id}`,
                        title: "Buffer Time",
                        start: serviceEndDate,
                        end: bufferEndDate,
                        backgroundColor: "rgba(63, 0, 82, 0.3)", // Semi-transparent purple
                        borderColor: "rgba(63, 0, 82, 0.5)",
                        textColor: "#3F0052",
                        display: "background",
                        extendedProps: {
                            isBuffer: true,
                            appointmentId: appointment.id,
                            bufferType: "after",
                        },
                    });
                }
            });

        return bufferEvents;
    };

    // Generate unavailable time slots based on work hours
    const generateUnavailableTimeSlots = () => {
        const unavailableEvents: any[] = [];
        const today = new Date();
        const startOfMonth = new Date(
            today.getFullYear(),
            today.getMonth() - 1,
            1
        );
        const endOfMonth = new Date(
            today.getFullYear(),
            today.getMonth() + 2,
            0
        );

        const dayNames = [
            "sunday",
            "monday",
            "tuesday",
            "wednesday",
            "thursday",
            "friday",
            "saturday",
        ];

        dayNames.forEach((day, dayIndex) => {
            const workHours =
                schedule.workHours[day as keyof typeof schedule.workHours];

            if (!workHours.isEnabled) {
                // Mark entire day as unavailable
                const currentDate = new Date(startOfMonth);
                while (currentDate <= endOfMonth) {
                    if (currentDate.getDay() === dayIndex) {
                        const startDate = new Date(currentDate);
                        startDate.setHours(0, 0, 0, 0);

                        const endDate = new Date(currentDate);
                        endDate.setHours(23, 59, 59, 999);

                        unavailableEvents.push({
                            id: `unavailable-${day}-${currentDate.toISOString().split("T")[0]}`,
                            title: "Unavailable",
                            start: startDate,
                            end: endDate,
                            backgroundColor: "rgba(156, 163, 175, 0.3)", // Semi-transparent gray
                            borderColor: "rgba(156, 163, 175, 0.5)",
                            textColor: "#6B7280",
                            display: "background",
                            extendedProps: {
                                isUnavailable: true,
                                reason: "Day off",
                            },
                        });
                    }
                    currentDate.setDate(currentDate.getDate() + 1);
                }
            } else {
                // Mark time outside work hours as unavailable
                const currentDate = new Date(startOfMonth);
                while (currentDate <= endOfMonth) {
                    if (currentDate.getDay() === dayIndex) {
                        // Before work hours
                        const beforeWorkStart = new Date(currentDate);
                        beforeWorkStart.setHours(0, 0, 0, 0);

                        const workStart = new Date(currentDate);
                        workStart.setHours(
                            workHours.start.hour,
                            workHours.start.minute,
                            0,
                            0
                        );

                        unavailableEvents.push({
                            id: `unavailable-before-${day}-${currentDate.toISOString().split("T")[0]}`,
                            title: "Unavailable",
                            start: beforeWorkStart,
                            end: workStart,
                            backgroundColor: "rgba(156, 163, 175, 0.3)",
                            borderColor: "rgba(156, 163, 175, 0.5)",
                            textColor: "#6B7280",
                            display: "background",
                            extendedProps: {
                                isUnavailable: true,
                                reason: "Before work hours",
                            },
                        });

                        // After work hours
                        const workEnd = new Date(currentDate);
                        workEnd.setHours(
                            workHours.end.hour,
                            workHours.end.minute,
                            0,
                            0
                        );

                        const afterWorkEnd = new Date(currentDate);
                        afterWorkEnd.setHours(23, 59, 59, 999);

                        unavailableEvents.push({
                            id: `unavailable-after-${day}-${currentDate.toISOString().split("T")[0]}`,
                            title: "Unavailable",
                            start: workEnd,
                            end: afterWorkEnd,
                            backgroundColor: "rgba(156, 163, 175, 0.3)",
                            borderColor: "rgba(156, 163, 175, 0.5)",
                            textColor: "#6B7280",
                            display: "background",
                            extendedProps: {
                                isUnavailable: true,
                                reason: "After work hours",
                            },
                        });
                    }
                    currentDate.setDate(currentDate.getDate() + 1);
                }
            }
        });

        return unavailableEvents;
    };

    // Transform appointments to calendar events
    const calendarEvents = useMemo(() => {
        const appointmentEvents = stylistAppointments
            ? stylistAppointments
                  .filter(
                      (appointment: Appointment) =>
                          appointment.status !== "cancelled"
                  )
                  .map((appointment: Appointment) => {
                      const startDate = appointment.dateTime;

                      // Calculate end time based on service duration (default 1 hour if not specified)
                      const duration = (appointment as any).service
                          ?.duration || { hours: 1, minutes: 0 };
                      const endDate = new Date(
                          startDate.getTime() +
                              (duration.hours * 60 + duration.minutes) * 60000
                      );

                      // Check if this is a custom event based on paymentType
                      const isCustomEvent =
                          appointment.paymentType === "custom";

                      return {
                          id: appointment.id,
                          title: isCustomEvent
                              ? appointment.serviceName
                              : `${appointment.clientName} - ${appointment.serviceName}`,
                          start: startDate,
                          end: endDate,
                          backgroundColor: isCustomEvent
                              ? "#DFA801"
                              : "#3F0052",
                          borderColor: isCustomEvent ? "#DFA801" : "#3F0052",
                          textColor: "white",
                          extendedProps: {
                              appointment,
                              isCustomEvent: isCustomEvent,
                              status: appointment.status,
                          },
                      };
                  })
            : [];

        // Add break events
        const breakEvents: any[] = generateBreakEvents();

        // Add buffer zone events
        const bufferEvents: any[] = generateBufferZoneEvents();

        // Add unavailable time slots
        const unavailableEvents: any[] = generateUnavailableTimeSlots();

        return [
            ...unavailableEvents,
            ...bufferEvents,
            ...breakEvents,
            ...appointmentEvents,
        ];
    }, [
        stylistAppointments,
        schedule.breaks,
        schedule.bufferTime,
        schedule.workHours,
    ]);

    const handleDateSelect = (selectInfo: any) => {
        // Check if the selected time is available
        const selectedDate = selectInfo.start;
        const selectedEnd = selectInfo.end;

        // Check if the selected time conflicts with unavailable slots
        const isUnavailable = calendarEvents.some((event) => {
            if (event.extendedProps?.isUnavailable) {
                const eventStart = new Date(event.start);
                const eventEnd = new Date(event.end);

                // Only check events on the same day
                const selectedDay = selectedDate.toDateString();
                const eventDay = eventStart.toDateString();

                if (selectedDay !== eventDay) {
                    return false;
                }

                // Check for overlap using Date objects
                return (
                    (selectedDate < eventEnd && selectedEnd > eventStart) ||
                    (eventStart < selectedEnd && eventEnd > selectedDate)
                );
            }
            return false;
        });

        if (isUnavailable) {
            // Show error message and don't open modal
            toast({
                title: "Unavailable Time",
                description:
                    "This time slot is not available. Please select a different time.",
                variant: "destructive",
                duration: 3000,
            });
            return;
        }

        setSelectedDate(selectedDate);
        setSelectedEnd(selectedEnd);
        setSelectedEvent(null);
        setIsModalOpen(true);
    };

    const handleEventClick = (clickInfo: any) => {
        setSelectedEvent(clickInfo.event);
        setSelectedDate(null);
        setSelectedEnd(null);
        setIsModalOpen(true);
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setSelectedDate(null);
        setSelectedEnd(null);
        setSelectedEvent(null);
    };

    const handleEventSaved = () => {
        // The useAppointments hook automatically updates via real-time listeners
        // The useSchedule hook will also trigger updates for breaks
        handleModalClose();
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3F0052]" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <SEO metadata={getPageMetadata("stylistCalendar")} />
            <div className="flex-1 flex flex-col overflow-hidden">
                <StylistDashboardHeader />

                <div className="flex-1 overflow-auto p-3 sm:p-4 md:p-6">
                    <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-light text-[#3F0052]">
                                    Calendar
                                </h1>
                                <p className="text-gray-600 mt-1 text-sm sm:text-base">
                                    Manage your appointments and schedule
                                </p>
                            </div>
                            <Button
                                onClick={() => setIsModalOpen(true)}
                                className="bg-[#3F0052] hover:bg-[#3F0052]/90 w-full sm:w-auto"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Add Event
                            </Button>
                        </div>

                        {/* Calendar Legend */}
                        <Card className="p-3 sm:p-4">
                            <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs sm:text-sm">
                                <div className="flex items-center space-x-2">
                                    <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-[#3F0052]"></div>
                                    <span>Client Appointments</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-[#DFA801]"></div>
                                    <span>Custom Events</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-[#10B981]"></div>
                                    <span>Recurring Breaks</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <div
                                        className="w-3 h-3 sm:w-4 sm:h-4 rounded"
                                        style={{
                                            backgroundColor:
                                                "rgba(63, 0, 82, 0.3)",
                                        }}
                                    ></div>
                                    <span>Buffer Zones</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <div
                                        className="w-3 h-3 sm:w-4 sm:h-4 rounded"
                                        style={{
                                            backgroundColor:
                                                "rgba(156, 163, 175, 0.3)",
                                        }}
                                    ></div>
                                    <span>Unavailable Time</span>
                                </div>
                            </div>
                        </Card>

                        {/* Google Calendar Integration */}
                        <GoogleCalendarConnect />

                        {/* Calendar Container */}
                        <div className="w-full">
                            <Card className="p-2 sm:p-6 overflow-hidden">
                                <div className="w-full overflow-x-auto min-w-0">
                                    <div className="min-w-[600px] sm:min-w-0">
                                        <FullCalendar
                                            plugins={[
                                                dayGridPlugin,
                                                timeGridPlugin,
                                                interactionPlugin,
                                            ]}
                                            headerToolbar={{
                                                left: isMobile
                                                    ? "prev,next"
                                                    : "prev,next today",
                                                center: "title",
                                                right: isMobile
                                                    ? "dayGridMonth,timeGridDay"
                                                    : "dayGridMonth,timeGridWeek,timeGridDay",
                                            }}
                                            initialView={currentView}
                                            editable={true}
                                            selectable={true}
                                            selectMirror={true}
                                            dayMaxEvents={isMobile ? 2 : true}
                                            weekends={true}
                                            events={calendarEvents}
                                            select={handleDateSelect}
                                            eventClick={handleEventClick}
                                            height="auto"
                                            slotMinTime="06:00:00"
                                            slotMaxTime="22:00:00"
                                            allDaySlot={false}
                                            slotDuration="00:30:00"
                                            slotLabelInterval="01:00"
                                            eventTimeFormat={{
                                                hour: "2-digit",
                                                minute: "2-digit",
                                                meridiem: "short",
                                            }}
                                            eventDisplay="block"
                                            eventColor="#3F0052"
                                            eventTextColor="white"
                                            selectConstraint={{
                                                startTime: "06:00",
                                                endTime: "22:00",
                                                dows: [0, 1, 2, 3, 4, 5, 6],
                                            }}
                                            businessHours={{
                                                daysOfWeek: [
                                                    1, 2, 3, 4, 5, 6, 0,
                                                ],
                                                startTime: "06:00",
                                                endTime: "22:00",
                                            }}
                                            dayHeaderFormat={{
                                                weekday: isMobile
                                                    ? "short"
                                                    : "short",
                                                month: "short",
                                                day: "numeric",
                                            }}
                                            titleFormat={{
                                                month: "long",
                                                week: "short",
                                                day: "numeric",
                                            }}
                                            // Mobile responsive settings
                                            views={{
                                                dayGridMonth: {
                                                    dayMaxEvents: isMobile
                                                        ? 2
                                                        : 3,
                                                    moreLinkClick: "popover",
                                                    dayHeaderFormat: {
                                                        weekday: isMobile
                                                            ? "short"
                                                            : "short",
                                                    },
                                                },
                                                timeGridWeek: {
                                                    dayHeaderFormat: {
                                                        weekday: "short",
                                                        day: "numeric",
                                                    },
                                                    slotLabelFormat: {
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                        meridiem: "short",
                                                    },
                                                },
                                                timeGridDay: {
                                                    dayHeaderFormat: {
                                                        weekday: "long",
                                                        month: "long",
                                                        day: "numeric",
                                                    },
                                                    slotLabelFormat: {
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                        meridiem: "short",
                                                    },
                                                },
                                            }}
                                            // Responsive breakpoints
                                            windowResizeDelay={100}
                                            // Mobile-specific configurations
                                            aspectRatio={isMobile ? 1.0 : 1.8}
                                            expandRows={isMobile}
                                            // Handle view changes for mobile
                                            datesSet={(dateInfo) => {
                                                // Auto-switch to month view on mobile if in week view
                                                if (
                                                    isMobile &&
                                                    dateInfo.view.type ===
                                                        "timeGridWeek"
                                                ) {
                                                    dateInfo.view.calendar.changeView(
                                                        "dayGridMonth"
                                                    );
                                                }
                                            }}
                                            // Custom event rendering for mobile
                                            eventDidMount={(info) => {
                                                if (isMobile) {
                                                    // Add mobile-specific styling
                                                    info.el.style.fontSize =
                                                        "0.75rem";
                                                    info.el.style.padding =
                                                        "2px 4px";
                                                }

                                                // Custom styling for different event types
                                                const event = info.event;
                                                const extendedProps =
                                                    event.extendedProps;

                                                if (extendedProps?.isBuffer) {
                                                    // Buffer zones - make them more subtle
                                                    info.el.style.opacity =
                                                        "0.6";
                                                    info.el.style.borderStyle =
                                                        "dashed";
                                                    info.el.style.fontSize =
                                                        "0.7rem";
                                                    info.el.style.fontWeight =
                                                        "normal";
                                                } else if (
                                                    extendedProps?.isUnavailable
                                                ) {
                                                    // Unavailable time - make them more prominent
                                                    info.el.style.opacity =
                                                        "0.8";
                                                    info.el.style.borderStyle =
                                                        "solid";
                                                    info.el.style.fontSize =
                                                        "0.7rem";
                                                    info.el.style.fontWeight =
                                                        "normal";
                                                    info.el.style.cursor =
                                                        "not-allowed";
                                                } else if (
                                                    extendedProps?.isBreak
                                                ) {
                                                    // Breaks - make them stand out
                                                    info.el.style.borderWidth =
                                                        "2px";
                                                    info.el.style.fontWeight =
                                                        "bold";
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>

                {/* Calendar Modal */}
                <CalendarModal
                    isOpen={isModalOpen}
                    onClose={handleModalClose}
                    selectedDate={selectedDate}
                    selectedEnd={selectedEnd}
                    selectedEvent={selectedEvent}
                    onEventSaved={handleEventSaved}
                    stylistId={user?.uid || ""}
                />
            </div>
        </DashboardLayout>
    );
}
