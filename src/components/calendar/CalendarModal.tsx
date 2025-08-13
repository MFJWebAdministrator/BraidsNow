import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { checkEnhancedScheduleConflicts } from "@/lib/utils/schedule-conflicts";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useSchedule } from "@/hooks/use-schedule";
import { Save, X } from "lucide-react";
import { formatTime, parseTime, generateTimeOptions } from "@/lib/utils/time";
import type { Break } from "@/lib/schemas/schedule";
import { Appointment } from "@/hooks/use-appointments";

const customEventSchema = z
    .object({
        title: z.string().min(1, "Title is required"),
        startTime: z.string().min(1, "Start time is required"),
        endTime: z.string().min(1, "End time is required"),
        date: z.string().min(1, "Date is required"),
        eventType: z.enum(["lunch", "break", "personal", "admin", "other"]),
        description: z.string().optional(),
        days: z.array(
            z.enum([
                "monday",
                "tuesday",
                "wednesday",
                "thursday",
                "friday",
                "saturday",
                "sunday",
            ])
        ),
        isRecurring: z.boolean().default(false),
    })
    .refine(
        (data) => {
            // If recurring, days must have at least one day
            if (data.isRecurring) {
                return data.days.length > 0;
            }
            // If not recurring, days can be empty
            return true;
        },
        {
            message: "Select at least one day for recurring events",
            path: ["days"],
        }
    );

type CustomEventForm = z.infer<typeof customEventSchema>;

interface CalendarModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedDate: Date | null;
    selectedEnd: Date | null;
    selectedEvent: any;
    onEventSaved: () => void;
    stylistId: string;
}

const DAYS = [
    { value: "monday", label: "Monday" },
    { value: "tuesday", label: "Tuesday" },
    { value: "wednesday", label: "Wednesday" },
    { value: "thursday", label: "Thursday" },
    { value: "friday", label: "Friday" },
    { value: "saturday", label: "Saturday" },
    { value: "sunday", label: "Sunday" },
] as const;

const TIME_OPTIONS = generateTimeOptions();

export function CalendarModal({
    isOpen,
    onClose,
    selectedDate,
    selectedEnd,
    selectedEvent,
    onEventSaved,
    stylistId,
}: CalendarModalProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const { addBreak } = useSchedule();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors },
    } = useForm<CustomEventForm>({
        resolver: zodResolver(customEventSchema),
        defaultValues: {
            title: "",
            startTime: "12:00 PM",
            endTime: "1:00 PM",
            date: "",
            eventType: "break",
            description: "",
            days: [],
            isRecurring: false,
        },
    });

    const watchedStartTime = watch("startTime");
    const watchedEndTime = watch("endTime");
    const watchedDays = watch("days");
    const watchedIsRecurring = watch("isRecurring");

    // Check if the selected event is a recurring break
    const isRecurringBreak = selectedEvent?.extendedProps?.isBreak === true;

    // Check if this is an existing appointment (read-only view)
    const isExistingAppointment =
        selectedEvent &&
        !isRecurringBreak &&
        !selectedEvent.extendedProps?.isCustomEvent;

    // Reset form when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            if (selectedDate && !selectedEvent) {
                // Creating new event
                setValue("date", format(selectedDate, "yyyy-MM-dd"));

                // Always use AM/PM format for consistency
                const startTimeFormatted = formatTime(
                    selectedDate.getHours(),
                    selectedDate.getMinutes()
                );
                setValue("startTime", startTimeFormatted);

                if (selectedEnd) {
                    const endTimeFormatted = formatTime(
                        selectedEnd.getHours(),
                        selectedEnd.getMinutes()
                    );
                    setValue("endTime", endTimeFormatted);
                } else {
                    const endTime = new Date(
                        selectedDate.getTime() + 60 * 60000
                    ); // 1 hour later
                    const endTimeFormatted = formatTime(
                        endTime.getHours(),
                        endTime.getMinutes()
                    );
                    setValue("endTime", endTimeFormatted);
                }
            }
        } else {
            reset();
        }
    }, [isOpen, selectedDate, selectedEnd, setValue, reset, selectedEvent]);

    const calculateEndTime = (
        startTime: string,
        duration: { hours: number; minutes: number }
    ): string => {
        const [hours, minutes] = startTime.split(":").map(Number);
        const startDate = new Date(2000, 0, 1, hours, minutes);
        const totalMinutes = duration.hours * 60 + duration.minutes;
        const endDate = new Date(startDate.getTime() + totalMinutes * 60000);
        return endDate.toTimeString().slice(0, 5);
    };

    // Helper function to convert AM/PM format to HH:MM format for conflict checking
    const convertTo24HourFormat = (timeString: string): string => {
        const { hour, minute } = parseTime(timeString);
        return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
    };

    const onSubmit = async (data: CustomEventForm) => {
        if (!user) return;

        setIsSubmitting(true);
        try {
            if (data.isRecurring) {
                // Handle recurring break creation using useSchedule hook
                // Times are already in AM/PM format for recurring events
                const start = parseTime(data.startTime);
                const end = parseTime(data.endTime);

                const breakData: Break = {
                    id: crypto.randomUUID(),
                    name: data.title,
                    days: data.days,
                    start,
                    end,
                };

                // Use the addBreak function from useSchedule hook
                await addBreak(breakData);

                toast({
                    title: "Recurring Break Created",
                    description:
                        "Your recurring break has been added to your schedule successfully.",
                    duration: 3000,
                });
            } else {
                // Handle single event creation
                // Times are now in AM/PM format for both recurring and non-recurring events

                // Convert to HH:MM format for conflict checking
                const startTime24Hour = convertTo24HourFormat(data.startTime);
                const endTime24Hour = convertTo24HourFormat(data.endTime);

                // Use enhanced conflict checking
                const conflictResult = await checkEnhancedScheduleConflicts(
                    stylistId,
                    startTime24Hour,
                    endTime24Hour,
                    data.date
                );

                if (conflictResult.hasConflict) {
                    toast({
                        title: "Schedule Conflict",
                        description: conflictResult.conflicts.join(", "),
                        variant: "destructive",
                        duration: 3000,
                    });
                    return;
                }

                // Calculate duration
                const start = parseTime(data.startTime);
                const end = parseTime(data.endTime);

                // If this is a break event, also create it as a break in the schedule
                if (data.eventType === "break" || data.eventType === "lunch") {
                    // Get the day of the week from the selected date
                    const selectedDate = new Date(data.date);
                    const dayNames = [
                        "sunday",
                        "monday",
                        "tuesday",
                        "wednesday",
                        "thursday",
                        "friday",
                        "saturday",
                    ];
                    const dayOfWeek = dayNames[
                        selectedDate.getDay()
                    ] as Break["days"][0];

                    const breakData: Break = {
                        id: crypto.randomUUID(),
                        name: data.title,
                        days: [dayOfWeek],
                        start,
                        end,
                    };

                    // Add the break to the schedule
                    await addBreak(breakData);
                }

                const eventTypeText =
                    data.eventType === "break" || data.eventType === "lunch"
                        ? "Break"
                        : "Event";
                toast({
                    title: `${eventTypeText} Created`,
                    description: `Your ${eventTypeText.toLowerCase()} has been created successfully.`,
                    duration: 3000,
                });
            }

            onEventSaved();
            onClose();
        } catch (error) {
            console.error("Error saving event:", error);
            toast({
                title: "Error",
                description: "Failed to save event. Please try again.",
                variant: "destructive",
                duration: 3000,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // If this is a recurring break, show a read-only view
    if (isRecurringBreak) {
        const breakData = selectedEvent.extendedProps.break;
        const breakStartTime = `${breakData.start.hour.toString().padStart(2, "0")}:${breakData.start.minute.toString().padStart(2, "0")}`;
        const breakEndTime = `${breakData.end.hour.toString().padStart(2, "0")}:${breakData.end.minute.toString().padStart(2, "0")}`;

        return (
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-[#3F0052]">
                            Recurring Break
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-600 mb-2">
                                This is a recurring break from your schedule
                                settings. To modify this break, please go to
                                your Schedule settings.
                            </p>
                        </div>

                        <div>
                            <Label>Break Name</Label>
                            <div className="mt-1 p-3 bg-gray-100 rounded border">
                                {breakData.name}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Start Time</Label>
                                <div className="mt-1 p-3 bg-gray-100 rounded border">
                                    {breakStartTime}
                                </div>
                            </div>
                            <div>
                                <Label>End Time</Label>
                                <div className="mt-1 p-3 bg-gray-100 rounded border">
                                    {breakEndTime}
                                </div>
                            </div>
                        </div>

                        <div>
                            <Label>Days</Label>
                            <div className="mt-1 p-3 bg-gray-100 rounded border">
                                {breakData.days
                                    .map(
                                        (day: string) =>
                                            day.charAt(0).toUpperCase() +
                                            day.slice(1)
                                    )
                                    .join(", ")}
                            </div>
                        </div>

                        <div className="flex justify-end space-x-2 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onClose}
                            >
                                <X className="w-4 h-4 mr-2" />
                                Close
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    // If this is an existing appointment, show read-only view
    if (isExistingAppointment) {
        const appointment: Appointment =
            selectedEvent.extendedProps.appointment;
        const appointmentDate = format(
            appointment.dateTime,
            "EEEE, MMMM d, yyyy"
        );
        const startTime = format(appointment.dateTime, "h:mm");
        const endTime = calculateEndTime(
            startTime,
            appointment.service?.duration || { hours: 1, minutes: 0 }
        );

        return (
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-[#3F0052]">
                            Appointment Details
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div>
                            <Label>Service</Label>
                            <div className="mt-1 p-3 bg-gray-100 rounded border">
                                {appointment.serviceName}
                            </div>
                        </div>

                        <div>
                            <Label>Client</Label>
                            <div className="mt-1 p-3 bg-gray-100 rounded border">
                                {appointment.clientName}
                            </div>
                        </div>

                        <div>
                            <Label>Date</Label>
                            <div className="mt-1 p-3 bg-gray-100 rounded border">
                                {format(appointmentDate, "EEEE, MMMM d, yyyy")}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Start Time</Label>
                                <div className="mt-1 p-3 bg-gray-100 rounded border">
                                    {startTime}
                                </div>
                            </div>
                            <div>
                                <Label>End Time</Label>
                                <div className="mt-1 p-3 bg-gray-100 rounded border">
                                    {endTime}
                                </div>
                            </div>
                        </div>

                        <div>
                            <Label>Status</Label>
                            <div className="mt-1 p-3 bg-gray-100 rounded border">
                                <span
                                    className={`capitalize px-2 py-1 rounded text-sm ${
                                        appointment.status === "confirmed"
                                            ? "bg-green-100 text-green-800"
                                            : appointment.status === "pending"
                                              ? "bg-yellow-100 text-yellow-800"
                                              : "bg-red-100 text-red-800"
                                    }`}
                                >
                                    {appointment.status}
                                </span>
                            </div>
                        </div>

                        {appointment.notes && (
                            <div>
                                <Label>Notes</Label>
                                <div className="mt-1 p-3 bg-gray-100 rounded border">
                                    {appointment.notes}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end space-x-2 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onClose}
                            >
                                <X className="w-4 h-4 mr-2" />
                                Close
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    // Create new event form with BreaksSection integration
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-[#3F0052]">
                        Add Event
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <Label htmlFor="title">Event Name</Label>
                        <Input
                            id="title"
                            placeholder="e.g., Lunch Break"
                            {...register("title")}
                            className="mt-1"
                        />
                        {errors.title && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.title.message}
                            </p>
                        )}
                    </div>

                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="isRecurring"
                            checked={watchedIsRecurring}
                            onCheckedChange={(checked) =>
                                setValue("isRecurring", checked as boolean)
                            }
                        />
                        <Label htmlFor="isRecurring">
                            Make this a recurring event
                        </Label>
                    </div>

                    {watchedIsRecurring ? (
                        // Recurring event form (like BreaksSection)
                        <>
                            <div>
                                <Label>Days</Label>
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                    {DAYS.map((day) => (
                                        <div
                                            key={day.value}
                                            className="flex items-center space-x-2"
                                        >
                                            <Checkbox
                                                checked={watchedDays.includes(
                                                    day.value
                                                )}
                                                onCheckedChange={(checked) => {
                                                    if (checked) {
                                                        setValue("days", [
                                                            ...watchedDays,
                                                            day.value,
                                                        ]);
                                                    } else {
                                                        setValue(
                                                            "days",
                                                            watchedDays.filter(
                                                                (d) =>
                                                                    d !==
                                                                    day.value
                                                            )
                                                        );
                                                    }
                                                }}
                                            />
                                            <Label>{day.label}</Label>
                                        </div>
                                    ))}
                                </div>
                                {errors.days && (
                                    <p className="text-red-500 text-sm mt-1">
                                        {errors.days.message}
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Start Time</Label>
                                    <Select
                                        value={watchedStartTime}
                                        onValueChange={(value) =>
                                            setValue("startTime", value)
                                        }
                                    >
                                        <SelectTrigger className="mt-1">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent
                                            position="popper"
                                            className="w-[140px] z-50 bg-white shadow-lg border border-gray-200"
                                        >
                                            <div className="max-h-[300px] overflow-y-auto">
                                                {TIME_OPTIONS.map((time) => (
                                                    <SelectItem
                                                        key={time}
                                                        value={time}
                                                    >
                                                        {time}
                                                    </SelectItem>
                                                ))}
                                            </div>
                                        </SelectContent>
                                    </Select>
                                    {errors.startTime && (
                                        <p className="text-red-500 text-sm mt-1">
                                            {errors.startTime.message}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <Label>End Time</Label>
                                    <Select
                                        value={watchedEndTime}
                                        onValueChange={(value) =>
                                            setValue("endTime", value)
                                        }
                                    >
                                        <SelectTrigger className="mt-1">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent
                                            position="popper"
                                            className="w-[140px] z-50 bg-white shadow-lg border border-gray-200"
                                        >
                                            <div className="max-h-[300px] overflow-y-auto">
                                                {TIME_OPTIONS.map((time) => (
                                                    <SelectItem
                                                        key={time}
                                                        value={time}
                                                    >
                                                        {time}
                                                    </SelectItem>
                                                ))}
                                            </div>
                                        </SelectContent>
                                    </Select>
                                    {errors.endTime && (
                                        <p className="text-red-500 text-sm mt-1">
                                            {errors.endTime.message}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        // Single event form
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="date">Date</Label>
                                    <Input
                                        id="date"
                                        type="date"
                                        {...register("date")}
                                        className="mt-1"
                                    />
                                    {errors.date && (
                                        <p className="text-red-500 text-sm mt-1">
                                            {errors.date.message}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="eventType">
                                        Event Type
                                    </Label>
                                    <Select
                                        onValueChange={(value) =>
                                            setValue("eventType", value as any)
                                        }
                                        defaultValue={watch("eventType")}
                                    >
                                        <SelectTrigger className="mt-1">
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="lunch">
                                                Lunch Break
                                            </SelectItem>
                                            <SelectItem value="break">
                                                Break
                                            </SelectItem>
                                            <SelectItem value="personal">
                                                Personal Time
                                            </SelectItem>
                                            <SelectItem value="admin">
                                                Admin Time
                                            </SelectItem>
                                            <SelectItem value="other">
                                                Other
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="startTime">
                                        Start Time
                                    </Label>
                                    <Select
                                        value={watchedStartTime}
                                        onValueChange={(value) =>
                                            setValue("startTime", value)
                                        }
                                    >
                                        <SelectTrigger className="mt-1">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent
                                            position="popper"
                                            className="w-[140px] z-50 bg-white shadow-lg border border-gray-200"
                                        >
                                            <div className="max-h-[300px] overflow-y-auto">
                                                {TIME_OPTIONS.map((time) => (
                                                    <SelectItem
                                                        key={time}
                                                        value={time}
                                                    >
                                                        {time}
                                                    </SelectItem>
                                                ))}
                                            </div>
                                        </SelectContent>
                                    </Select>
                                    {errors.startTime && (
                                        <p className="text-red-500 text-sm mt-1">
                                            {errors.startTime.message}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="endTime">End Time</Label>
                                    <Select
                                        value={watchedEndTime}
                                        onValueChange={(value) =>
                                            setValue("endTime", value)
                                        }
                                    >
                                        <SelectTrigger className="mt-1">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent
                                            position="popper"
                                            className="w-[140px] z-50 bg-white shadow-lg border border-gray-200"
                                        >
                                            <div className="max-h-[300px] overflow-y-auto">
                                                {TIME_OPTIONS.map((time) => (
                                                    <SelectItem
                                                        key={time}
                                                        value={time}
                                                    >
                                                        {time}
                                                    </SelectItem>
                                                ))}
                                            </div>
                                        </SelectContent>
                                    </Select>
                                    {errors.endTime && (
                                        <p className="text-red-500 text-sm mt-1">
                                            {errors.endTime.message}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </>
                    )}

                    {watchedStartTime &&
                        watchedEndTime &&
                        (() => {
                            const startMinutes =
                                parseTime(watchedStartTime).hour * 60 +
                                parseTime(watchedStartTime).minute;
                            const endMinutes =
                                parseTime(watchedEndTime).hour * 60 +
                                parseTime(watchedEndTime).minute;
                            return startMinutes >= endMinutes;
                        })() && (
                            <p className="text-red-500 text-sm">
                                End time must be after start time
                            </p>
                        )}

                    <div>
                        <Label htmlFor="description">
                            Description (Optional)
                        </Label>
                        <Textarea
                            id="description"
                            placeholder="Add any additional notes..."
                            {...register("description")}
                            className="mt-1"
                            rows={3}
                        />
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={isSubmitting}
                        >
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                        </Button>

                        <Button
                            type="submit"
                            disabled={
                                isSubmitting ||
                                Boolean(
                                    watchedStartTime &&
                                        watchedEndTime &&
                                        (() => {
                                            const startMinutes =
                                                parseTime(watchedStartTime)
                                                    .hour *
                                                    60 +
                                                parseTime(watchedStartTime)
                                                    .minute;
                                            const endMinutes =
                                                parseTime(watchedEndTime).hour *
                                                    60 +
                                                parseTime(watchedEndTime)
                                                    .minute;
                                            return startMinutes >= endMinutes;
                                        })()
                                )
                            }
                            className="bg-[#3F0052] hover:bg-[#3F0052]/90"
                        >
                            <Save className="w-4 h-4 mr-2" />
                            {isSubmitting
                                ? "Saving..."
                                : watchedIsRecurring
                                  ? "Create Recurring Event"
                                  : "Create Event"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
