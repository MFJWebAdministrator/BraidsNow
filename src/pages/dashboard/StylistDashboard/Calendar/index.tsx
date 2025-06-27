import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useAppointments, type Appointment } from '@/hooks/use-appointments';
import { useSchedule } from '@/hooks/use-schedule';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { StylistDashboardHeader } from '@/components/dashboard/stylist/StylistDashboardHeader';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { CalendarModal } from '@/components/calendar/CalendarModal';

export function CalendarPage() {
  const { user } = useAuth();
  const { loading, getStylistAppointments } = useAppointments();
  const { schedule } = useSchedule();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  // Get only stylist appointments for the calendar
  const stylistAppointments = getStylistAppointments();

  // Generate break events for the current month view
  const generateBreakEvents = () => {
    const breakEvents: any[] = [];
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 2, 0);

    schedule.breaks.forEach((breakItem) => {
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      
      breakItem.days.forEach((dayName) => {
        const dayIndex = dayNames.indexOf(dayName);
        if (dayIndex === -1) return;

        // Generate events for each occurrence of this break in the date range
        let currentDate = new Date(startOfMonth);
        
        // Find the first occurrence of this day of the week
        while (currentDate.getDay() !== dayIndex) {
          currentDate.setDate(currentDate.getDate() + 1);
        }

        // Generate events for all occurrences in the range
        while (currentDate <= endOfMonth) {
          const startDate = new Date(currentDate);
          startDate.setHours(breakItem.start.hour, breakItem.start.minute, 0, 0);

          const endDate = new Date(currentDate);
          endDate.setHours(breakItem.end.hour, breakItem.end.minute, 0, 0);

          breakEvents.push({
            id: `break-${breakItem.id}-${currentDate.toISOString().split('T')[0]}`,
            title: breakItem.name,
            start: startDate,
            end: endDate,
            backgroundColor: '#10B981', // Green color for breaks
            borderColor: '#10B981',
            textColor: 'white',
            extendedProps: {
              isBreak: true,
              break: breakItem,
              status: 'confirmed'
            }
          });

          // Move to next week
          currentDate.setDate(currentDate.getDate() + 7);
        }
      });
    });

    return breakEvents;
  };

  // Transform appointments to calendar events
  const calendarEvents = useMemo(() => {
    const appointmentEvents = stylistAppointments
      ? stylistAppointments
          .filter((appointment: Appointment) => appointment.status !== 'cancelled')
          .map((appointment: Appointment) => {
            const startDate = new Date(appointment.date);
            const [hours, minutes] = appointment.time.split(':').map(Number);
            startDate.setHours(hours, minutes, 0, 0);

            // Calculate end time based on service duration (default 1 hour if not specified)
            const duration = { hours: 1, minutes: 0 };
            const endDate = new Date(startDate.getTime() + (duration.hours * 60 + duration.minutes) * 60000);

            // Check if this is a custom event based on paymentType
            const isCustomEvent = appointment.paymentType === 'custom';

            return {
              id: appointment.id,
              title: isCustomEvent 
                ? appointment.serviceName 
                : `${appointment.clientName} - ${appointment.serviceName}`,
              start: startDate,
              end: endDate,
              backgroundColor: isCustomEvent ? '#DFA801' : '#3F0052',
              borderColor: isCustomEvent ? '#DFA801' : '#3F0052',
              textColor: 'white',
              extendedProps: {
                appointment,
                isCustomEvent: isCustomEvent,
                status: appointment.status
              }
            };
          })
      : [];

    // Add break events
    const breakEvents: any[] = generateBreakEvents();

    return [...appointmentEvents, ...breakEvents];
  }, [stylistAppointments, schedule.breaks]);

  const handleDateSelect = (selectInfo: any) => {
    setSelectedDate(selectInfo.start);
    setSelectedEvent(null);
    setIsModalOpen(true);
  };

  const handleEventClick = (clickInfo: any) => {
    setSelectedEvent(clickInfo.event);
    setSelectedDate(null);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedDate(null);
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
      <div className="flex-1 flex flex-col overflow-hidden">
        <StylistDashboardHeader />
        
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-light text-[#3F0052]">Calendar</h1>
                <p className="text-gray-600 mt-1">
                  Manage your appointments and schedule
                </p>
              </div>
              <Button
                onClick={() => setIsModalOpen(true)}
                className="bg-[#3F0052] hover:bg-[#3F0052]/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Event
              </Button>
            </div>

            {/* Calendar Legend */}
            <Card className="p-4">
              <div className="flex items-center space-x-6 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded bg-[#3F0052]"></div>
                  <span>Client Appointments</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded bg-[#DFA801]"></div>
                  <span>Custom Events</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded bg-[#10B981]"></div>
                  <span>Recurring Breaks</span>
                </div>
              </div>
            </Card>

            {/* Calendar */}
            <Card className="p-6">
              <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                headerToolbar={{
                  left: 'prev,next today',
                  center: 'title',
                  right: 'dayGridMonth,timeGridWeek,timeGridDay'
                }}
                initialView="timeGridWeek"
                editable={true}
                selectable={true}
                selectMirror={true}
                dayMaxEvents={true}
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
                  hour: '2-digit',
                  minute: '2-digit',
                  meridiem: 'short'
                }}
                eventDisplay="block"
                eventColor="#3F0052"
                eventTextColor="white"
                selectConstraint={{
                  startTime: '06:00',
                  endTime: '22:00',
                  dows: [0, 1, 2, 3, 4, 5, 6]
                }}
                businessHours={{
                  daysOfWeek: [1, 2, 3, 4, 5, 6, 0],
                  startTime: '06:00',
                  endTime: '22:00',
                }}
                dayHeaderFormat={{
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric'
                }}
                titleFormat={{
                  month: 'long',
                  week: 'short',
                  day: 'numeric'
                }}
              />
            </Card>
          </div>
        </div>

        {/* Calendar Modal */}
        <CalendarModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          selectedDate={selectedDate}
          selectedEvent={selectedEvent}
          onEventSaved={handleEventSaved}
          stylistId={user?.uid || ''}
        />
      </div>
    </DashboardLayout>
  );
} 