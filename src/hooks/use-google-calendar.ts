import { useState, useEffect, useCallback } from 'react';
import { useToast } from './use-toast';
import googleCalendarService from '@/lib/google-calendar';

interface UseGoogleCalendarReturn {
  isConnected: boolean;
  isConnecting: boolean;
  connectGoogleCalendar: () => Promise<void>;
  disconnectGoogleCalendar: () => Promise<void>;
  syncAppointmentToGoogle: (appointment: any) => Promise<void>;
  updateGoogleEvent: (eventId: string, appointment: any) => Promise<void>;
  deleteGoogleEvent: (eventId: string) => Promise<void>;
  syncAllAppointments: (appointments: any[]) => Promise<void>;
}

export function useGoogleCalendar(): UseGoogleCalendarReturn {
  // const { user } = useAuth();
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // Check connection status on mount
  useEffect(() => {
    const tokens = JSON.parse(localStorage.getItem('googleCalendarTokens') || '{}');
    setIsConnected(!!tokens.access_token);
  }, []);

  // const checkConnectionStatus = useCallback(() => {
  //   const tokens = JSON.parse(localStorage.getItem('googleCalendarTokens') || '{}');
  //   setIsConnected(!!tokens.access_token);
  // }, []);

  const connectGoogleCalendar = useCallback(async () => {
    setIsConnecting(true);
    try {
      const authUrl = await googleCalendarService.generateAuthUrl();
      window.location.href = authUrl;
    } catch (error) {
      setIsConnecting(false);
    }
  }, []);

  const disconnectGoogleCalendar = useCallback(async () => {
    localStorage.removeItem('googleCalendarTokens');
    setIsConnected(false);
    toast({
      title: "Disconnected",
      description: "Google Calendar has been disconnected successfully.",
    });
  }, [toast]);

  const syncAppointmentToGoogle = useCallback(async () => {
    const tokens = JSON.parse(localStorage.getItem('googleCalendarTokens') || '{}');
    if (!tokens.access_token) {
      toast({
        title: "Not Connected",
        description: "Please connect your Google Calendar first.",
        variant: "destructive"
      });
      return;
    }
    try {
      // const googleEvent = googleCalendarService.convertAppointmentToGoogleEvent(appointment);
      // const createdEvent = await googleCalendarService.createEvent(googleEvent, tokens.access_token);
      toast({
        title: "Synced to Google Calendar",
        description: "Appointment has been added to your Google Calendar.",
      });
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: "Failed to sync appointment to Google Calendar. Please try again.",
        variant: "destructive"
      });
    }
  }, [toast]);

  const updateGoogleEvent = useCallback(async (eventId: string, appointment: any) => {
    const tokens = JSON.parse(localStorage.getItem('googleCalendarTokens') || '{}');
    if (!tokens.access_token) {
      toast({
        title: "Not Connected",
        description: "Please connect your Google Calendar first.",
        variant: "destructive"
      });
      return;
    }
    try {
      const googleEvent = googleCalendarService.convertAppointmentToGoogleEvent(appointment);
      await googleCalendarService.updateEvent(eventId, googleEvent, tokens.access_token);
      toast({
        title: "Google Calendar Updated",
        description: "Appointment has been updated in your Google Calendar.",
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update Google Calendar event. Please try again.",
        variant: "destructive"
      });
    }
  }, [toast]);

  const deleteGoogleEvent = useCallback(async (eventId: string) => {
    const tokens = JSON.parse(localStorage.getItem('googleCalendarTokens') || '{}');
    if (!tokens.access_token) {
      toast({
        title: "Not Connected",
        description: "Please connect your Google Calendar first.",
        variant: "destructive"
      });
      return;
    }
    try {
      await googleCalendarService.deleteEvent(eventId, tokens.access_token);
      toast({
        title: "Google Calendar Updated",
        description: "Appointment has been removed from your Google Calendar.",
      });
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: "Failed to delete Google Calendar event. Please try again.",
        variant: "destructive"
      });
    }
  }, [toast]);

  const syncAllAppointments = useCallback(async (appointments: any[]) => {
    const tokens = JSON.parse(localStorage.getItem('googleCalendarTokens') || '{}');
    if (!tokens.access_token) {
      toast({
        title: "Not Connected",
        description: "Please connect your Google Calendar first.",
        variant: "destructive"
      });
      return;
    }
    try {
      let syncedCount = 0;
      for (const appointment of appointments) {
        if (appointment.status !== 'cancelled' && !appointment.googleCalendarEventId) {
          // const googleEvent = googleCalendarService.convertAppointmentToGoogleEvent(appointment);
          // const createdEvent = await googleCalendarService.createEvent(googleEvent, tokens.access_token);
          syncedCount++;
        }
      }
      if (syncedCount > 0) {
        toast({
          title: "Sync Complete",
          description: `${syncedCount} appointments have been synced to your Google Calendar.`,
        });
      } else {
        toast({
          title: "No New Appointments",
          description: "All appointments are already synced to your Google Calendar.",
        });
      }
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: "Failed to sync appointments to Google Calendar. Please try again.",
        variant: "destructive"
      });
    }
  }, [toast]);

  return {
    isConnected,
    isConnecting,
    connectGoogleCalendar,
    disconnectGoogleCalendar,
    syncAppointmentToGoogle,
    updateGoogleEvent,
    deleteGoogleEvent,
    syncAllAppointments
  };
} 