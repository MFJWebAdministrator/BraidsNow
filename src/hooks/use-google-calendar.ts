import { useState, useEffect, useCallback } from "react";
import { useToast } from "./use-toast";
import { useAuth } from "./use-auth";
import googleCalendarService from "@/lib/google-calendar";
import {
    disconnectGoogleCalendar as disconnectFromDB,
    hasValidGoogleCalendarTokens,
    getValidAccessToken,
} from "@/lib/firebase/google-calendar";
import { Appointment } from "./use-appointments";

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
    const { user } = useAuth();
    const { toast } = useToast();
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);

    // Check connection status on mount
    useEffect(() => {
        const checkConnectionStatus = async () => {
            if (!user?.uid) return;

            try {
                const hasValidTokens = await hasValidGoogleCalendarTokens(
                    user.uid
                );
                setIsConnected(hasValidTokens);
            } catch (error) {
                console.error(
                    "Error checking Google Calendar connection:",
                    error
                );
                setIsConnected(false);
            }
        };

        checkConnectionStatus();
    }, [user?.uid]);

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
        if (!user?.uid) return;

        try {
            await disconnectFromDB(user.uid);
            setIsConnected(false);
            toast({
                title: "Disconnected",
                description:
                    "Google Calendar has been disconnected successfully.",
            });
        } catch (error) {
            console.error("Error disconnecting Google Calendar:", error);
            toast({
                title: "Error",
                description:
                    "Failed to disconnect Google Calendar. Please try again.",
                variant: "destructive",
            });
        }
    }, [user?.uid, toast]);

    const syncAppointmentToGoogle = useCallback(
        async (appointment: Appointment) => {
            if (!user?.uid) return;

            try {
                const accessToken = await getValidAccessToken(user.uid);
                if (!accessToken) {
                    toast({
                        title: "Not Connected",
                        description:
                            "Please connect your Google Calendar first.",
                        variant: "destructive",
                        duration: 3000,
                    });
                    return;
                }

                const googleEvent =
                    googleCalendarService.convertAppointmentToGoogleEvent(
                        appointment
                    );
                await googleCalendarService.createEvent(
                    googleEvent,
                    accessToken
                );

                toast({
                    title: "Synced to Google Calendar",
                    description:
                        "Appointment has been added to your Google Calendar.",
                    duration: 3000,
                });
            } catch (error) {
                console.error(
                    "Error syncing appointment to Google Calendar:",
                    error
                );
                toast({
                    title: "Sync Failed",
                    description:
                        "Failed to sync appointment to Google Calendar. Please try again.",
                    variant: "destructive",
                    duration: 3000,
                });
            }
        },
        [user?.uid, toast]
    );

    const updateGoogleEvent = useCallback(
        async (eventId: string, appointment: any) => {
            if (!user?.uid) return;

            try {
                const accessToken = await getValidAccessToken(user.uid);
                if (!accessToken) {
                    toast({
                        title: "Not Connected",
                        description:
                            "Please connect your Google Calendar first.",
                        variant: "destructive",
                        duration: 3000,
                    });
                    return;
                }

                const googleEvent =
                    googleCalendarService.convertAppointmentToGoogleEvent(
                        appointment
                    );
                await googleCalendarService.updateEvent(
                    eventId,
                    googleEvent,
                    accessToken
                );
                toast({
                    title: "Google Calendar Updated",
                    description:
                        "Appointment has been updated in your Google Calendar.",
                    duration: 3000,
                });
            } catch (error) {
                console.error("Error updating Google Calendar event:", error);
                toast({
                    title: "Update Failed",
                    description:
                        "Failed to update Google Calendar event. Please try again.",
                    variant: "destructive",
                });
            }
        },
        [user?.uid, toast]
    );

    const deleteGoogleEvent = useCallback(
        async (eventId: string) => {
            if (!user?.uid) return;

            try {
                const accessToken = await getValidAccessToken(user.uid);
                if (!accessToken) {
                    toast({
                        title: "Not Connected",
                        description:
                            "Please connect your Google Calendar first.",
                        variant: "destructive",
                        duration: 3000,
                    });
                    return;
                }

                await googleCalendarService.deleteEvent(eventId, accessToken);
                toast({
                    title: "Google Calendar Updated",
                    description:
                        "Appointment has been removed from your Google Calendar.",
                    duration: 3000,
                });
            } catch (error) {
                console.error("Error deleting Google Calendar event:", error);
                toast({
                    title: "Delete Failed",
                    description:
                        "Failed to delete Google Calendar event. Please try again.",
                    variant: "destructive",
                    duration: 3000,
                });
            }
        },
        [user?.uid, toast]
    );

    const syncAllAppointments = useCallback(
        async (appointments: any[]) => {
            if (!user?.uid) return;

            try {
                const accessToken = await getValidAccessToken(user.uid);
                if (!accessToken) {
                    toast({
                        title: "Not Connected",
                        description:
                            "Please connect your Google Calendar first.",
                        variant: "destructive",
                        duration: 3000,
                    });
                    return;
                }

                let syncedCount = 0;
                for (const appointment of appointments) {
                    if (
                        appointment.status !== "cancelled" &&
                        !appointment.googleCalendarEventId
                    ) {
                        const googleEvent =
                            googleCalendarService.convertAppointmentToGoogleEvent(
                                appointment
                            );

                        await googleCalendarService.createEvent(
                            googleEvent,
                            accessToken
                        );

                        syncedCount++;
                    }
                }
                if (syncedCount > 0) {
                    toast({
                        title: "Sync Complete",
                        description: `${syncedCount} appointments have been synced to your Google Calendar.`,
                        duration: 3000,
                    });
                } else {
                    toast({
                        title: "No New Appointments",
                        description:
                            "All appointments are already synced to your Google Calendar.",
                        duration: 3000,
                    });
                }
            } catch (error) {
                console.error(
                    "Error syncing appointments to Google Calendar",
                    error
                );
                toast({
                    title: "Sync Failed",
                    description:
                        "Failed to sync appointments to Google Calendar. Please try again.",
                    variant: "destructive",
                    duration: 3000,
                });
            }
        },
        [user?.uid, toast]
    );

    return {
        isConnected,
        isConnecting,
        connectGoogleCalendar,
        disconnectGoogleCalendar,
        syncAppointmentToGoogle,
        updateGoogleEvent,
        deleteGoogleEvent,
        syncAllAppointments,
    };
}
