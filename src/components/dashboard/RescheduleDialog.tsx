import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { DateTimeSelection } from "@/pages/Booking/steps/DateTimeSelection";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { proposeReschedule } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import type { Appointment } from "@/hooks/use-appointments";

interface RescheduleDialogProps {
    isOpen: boolean;
    onClose: () => void;
    appointment: Appointment;
    onRescheduleProposed: () => void;
}

export function RescheduleDialog({
    isOpen,
    onClose,
    appointment,
    onRescheduleProposed,
}: RescheduleDialogProps) {
    const [selectedDateTime, setSelectedDateTime] = useState<Date | null>(null);
    const [reason, setReason] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const handleDateTimeSelect = (dateTime: Date) => {
        setSelectedDateTime(dateTime);
    };

    const handleSubmit = async () => {
        if (!selectedDateTime) return;

        setIsSubmitting(true);
        try {
            console.log(
                "proposed date time",
                selectedDateTime,
                " => ",
                selectedDateTime.toISOString()
            );
            await proposeReschedule(
                appointment.id,
                selectedDateTime.toISOString(),
                reason
            );

            toast({
                title: "Reschedule Proposed",
                description:
                    "Your reschedule proposal has been sent to the other party.",
                duration: 2000,
            });

            onRescheduleProposed();
            onClose();
        } catch (error) {
            console.error("Error proposing reschedule:", error);
            toast({
                title: "Error",
                description: "Failed to propose reschedule. Please try again.",
                variant: "destructive",
                duration: 1000,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Propose New Date & Time</DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-medium text-blue-900 mb-2">
                            Current Appointment
                        </h4>
                        <p className="text-blue-700">
                            {format(
                                appointment.dateTime,
                                "EEEE, MMMM d, yyyy 'at' h:mm a"
                            )}
                        </p>
                    </div>

                    <DateTimeSelection
                        stylistId={appointment.stylistId}
                        selectedService={appointment.service}
                        onSelect={handleDateTimeSelect}
                        buttonText="Continue"
                        isRescheduleMode={true}
                        hideContinueButton={true}
                    />

                    <div className="space-y-4">
                        <div>
                            <Label
                                htmlFor="reason"
                                className="text-sm font-medium"
                            >
                                Reason for Reschedule (Optional)
                            </Label>
                            <Textarea
                                id="reason"
                                placeholder="Please provide a reason for the reschedule request..."
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className="mt-1"
                                rows={3}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting || !selectedDateTime}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            {isSubmitting
                                ? "Proposing..."
                                : "Propose Reschedule"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
