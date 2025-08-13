import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Users } from "lucide-react";
import { useMessages } from "@/hooks/use-messages";
import { useToast } from "@/hooks/use-toast";

interface MassMessageDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

export function MassMessageDialog({ isOpen, onClose }: MassMessageDialogProps) {
    const [message, setMessage] = useState("");
    const [isSending, setIsSending] = useState(false);
    const { sendMassMessage, favoriteClients } = useMessages();
    const { toast } = useToast();

    const handleSend = async () => {
        if (!message.trim()) return;

        try {
            setIsSending(true);
            await sendMassMessage(message.trim());

            toast({
                title: "Success",
                description: `Message sent to ${favoriteClients.length} favorite clients`,
                duration: 3000,
            });

            setMessage("");
            onClose();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to send mass message. Please try again.",
                variant: "destructive",
                duration: 3000,
            });
        } finally {
            setIsSending(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-light tracking-normal text-[#3F0052]">
                        Send Mass Message
                    </DialogTitle>
                    <DialogDescription className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Sending to {favoriteClients.length} favorite clients
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <Textarea
                        placeholder="Write your message..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="min-h-[150px]"
                    />

                    <div className="flex justify-end gap-2">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            disabled={isSending}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSend}
                            disabled={!message.trim() || isSending}
                        >
                            {isSending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                "Send Message"
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
