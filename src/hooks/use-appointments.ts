import { useState, useEffect } from "react";
import {
    collection,
    query,
    where,
    orderBy,
    onSnapshot,
    Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "./use-auth";
import { toZonedTime } from "date-fns-tz";

export interface Appointment {
    id: string;
    bookingSource: string;
    businessName: string;
    clientEmail: string;
    clientId: string;
    clientInfo: {
        email: string;
        firstName: string;
        lastName: string;
        paymentAmount: number;
        paymentType: string;
        phone: string;
        specialRequests: string;
    };
    clientName: string;
    clientPhone: string;
    createdAt: Timestamp;
    dateTime: Date;
    // date: string;
    depositAmount: number;
    notes: string;
    paymentAmount: number;
    paymentFailedAt?: Timestamp;
    paymentFailureReason?: string;
    paymentId?: string | null;
    paymentStatus:
        | "pending"
        | "authorized"
        | "captured"
        | "paid"
        | "failed"
        | "cancelled"
        | "refunded"
        | "expired";
    paymentType: string;
    serviceName: string;
    service: {
        depositAmount: number;
        duration: {
            hours: number;
            minutes: number;
        };
        price: number;
        serviceId: string;
        stylistId: string;
    };
    status:
        | "pending"
        | "confirmed"
        | "rejected"
        | "cancelled"
        | "failed"
        | "to-be-paid"
        | "completed";
    stripeSessionId: string;
    stylistId: string;
    stylistName: string;
    // time: string;
    totalAmount: number;
    updatedAt: Timestamp;
    paymentRequested?: boolean;
    paymentRequestedAt?: Timestamp;

    // Reschedule fields
    rescheduleProposal?: {
        proposedDateTime: Date;
        proposedBy: "client" | "stylist";
        proposedAt: Timestamp;
        reason?: string;
    };
}

export function useAppointments() {
    const { user } = useAuth();
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        const appointmentsRef = collection(db, "bookings");

        const unsubscribers: (() => void)[] = [];
        let stylistAppointments: Appointment[] = [];
        let clientAppointments: Appointment[] = [];

        const stylistQuery = query(
            appointmentsRef,
            where("stylistId", "==", user.uid),
            orderBy("dateTime", "desc"),
            orderBy("createdAt", "desc")
        );

        const unsubscribeStylist = onSnapshot(
            stylistQuery,
            (snapshot) => {
                stylistAppointments = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                })) as Appointment[];

                // Merge and update state
                mergeAndSetAppointments();
            },
            (error) => {
                console.error("Error loading stylist appointments:", error);
                setError("Failed to load stylist appointments");
                setLoading(false);
            }
        );

        unsubscribers.push(unsubscribeStylist);

        // Query for appointments where user is the client
        const clientQuery = query(
            appointmentsRef,
            where("clientId", "==", user.uid),
            orderBy("dateTime", "desc"),
            orderBy("createdAt", "desc")
        );

        const unsubscribeClient = onSnapshot(
            clientQuery,
            (snapshot) => {
                clientAppointments = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                })) as Appointment[];

                // Merge and update state
                mergeAndSetAppointments();
            },
            (error) => {
                console.error("Error loading client appointments:", error);
                setError("Failed to load client appointments");
                setLoading(false);
            }
        );

        unsubscribers.push(unsubscribeClient);

        function mergeAndSetAppointments() {
            // Combine and deduplicate appointments
            const allAppointments = [
                ...stylistAppointments,
                ...clientAppointments,
            ];
            const uniqueAppointments = allAppointments.filter(
                (appointment, index, self) =>
                    index === self.findIndex((a) => a.id === appointment.id)
            );

            // Sort by updatedAt date (newest first)
            uniqueAppointments.sort((a, b) => {
                const aTime = a.updatedAt?.toMillis() || 0;
                const bTime = b.updatedAt?.toMillis() || 0;
                return bTime - aTime;
            });

            const mappedAppointments = uniqueAppointments.map((appointment) => {
                const dateTime = toZonedTime(appointment.dateTime, browserTz);
                if (appointment.rescheduleProposal) {
                    const proposedDateTime = toZonedTime(
                        appointment.rescheduleProposal?.proposedDateTime,
                        browserTz
                    );
                    appointment.rescheduleProposal.proposedDateTime =
                        proposedDateTime;
                }
                return { ...appointment, dateTime };
            });

            setAppointments(mappedAppointments);
            setLoading(false);
        }

        // Cleanup function
        return () => {
            unsubscribers.forEach((unsubscribe) => unsubscribe());
        };
    }, [user]);

    // Filter appointments by user role
    const getStylistAppointments = () => {
        return appointments.filter(
            (appointment) => appointment.stylistId === user?.uid
        );
    };

    const getClientAppointments = () => {
        return appointments.filter(
            (appointment) => appointment.clientId === user?.uid
        );
    };

    // Get appointments by status
    const getAppointmentsByStatus = (status: string) => {
        return appointments.filter(
            (appointment) => appointment.status === status
        );
    };

    // Get upcoming appointments (today and future)
    const getUpcomingAppointments = () => {
        const today = new Date().toString().split("T")[0];
        return appointments.filter(
            (appointment) =>
                appointment.dateTime.toString().split("T")[0] >= today
        );
    };

    // Get past appointments
    const getPastAppointments = () => {
        const today = new Date().toString().split("T")[0];
        return appointments.filter(
            (appointment) =>
                appointment.dateTime.toString().split("T")[0] < today
        );
    };

    // Get today's appointments
    const getTodaysAppointments = () => {
        const today = new Date().toString().split("T")[0];
        return appointments.filter(
            (appointment) =>
                appointment.dateTime.toString().split("T")[0] === today
        );
    };

    return {
        appointments,
        loading,
        error,
        getStylistAppointments,
        getClientAppointments,
        getAppointmentsByStatus,
        getUpcomingAppointments,
        getPastAppointments,
        getTodaysAppointments,
    };
}
