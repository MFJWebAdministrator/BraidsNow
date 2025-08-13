import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormField,
    FormItem,
    FormControl,
    FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useUserData } from "@/hooks/use-user-data";
import { messageSchema } from "@/lib/schemas/message";
import { doc, setDoc, collection } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useToast } from "@/hooks/use-toast";
import type { MessageForm } from "@/lib/schemas/message";

interface MessageDialogProps {
    isOpen: boolean;
    onClose: () => void;
    recipientId: string;
    recipientName: string;
}

export function MessageDialog({
    isOpen,
    onClose,
    recipientId,
    recipientName,
}: MessageDialogProps) {
    const { user } = useAuth();
    const { userData } = useUserData(user?.uid);
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const form = useForm<MessageForm>({
        resolver: zodResolver(messageSchema),
        defaultValues: {
            content: "",
        },
    });

    React.useEffect(() => {
        if (!isOpen) {
            form.reset();
        }
    }, [isOpen, form]);

    const onSubmit = async (data: MessageForm) => {
        if (!user || !userData) return;

        try {
            setIsSubmitting(true);

            // Create thread ID by sorting UIDs to ensure consistency
            const threadId = [user.uid, recipientId].sort().join("_");

            // Create message document
            const messageRef = doc(collection(db, "messages"));
            const message = {
                id: messageRef.id,
                threadId,
                content: data.content,
                senderId: user.uid,
                senderName: `${userData.firstName} ${userData.lastName}`,
                senderImage: userData.profileImage,
                participants: [user.uid, recipientId],
                readBy: [user.uid],
                createdAt: new Date().toISOString(),
            };

            // Create thread document
            const threadRef = doc(db, "messageThreads", threadId);
            const thread = {
                id: threadId,
                participants: [user.uid, recipientId],
                participantDetails: {
                    [user.uid]: {
                        name: `${userData.firstName} ${userData.lastName}`,
                        image: userData.profileImage,
                    },
                    [recipientId]: {
                        name: recipientName,
                    },
                },
                lastMessage: {
                    content: data.content,
                    senderId: user.uid,
                    createdAt: new Date().toISOString(),
                },
                updatedAt: new Date().toISOString(),
            };

            // Execute both writes
            await Promise.all([
                setDoc(messageRef, message),
                setDoc(threadRef, thread, { merge: true }),
            ]);

            toast({
                title: "Message sent",
                description: "Your message has been sent successfully",
                duration: 3000,
            });

            form.reset();
            onClose();
        } catch (error) {
            console.error("Error sending message:", error);
            toast({
                title: "Error",
                description: "Failed to send message. Please try again.",
                variant: "destructive",
                duration: 3000,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog
            open={isOpen}
            onOpenChange={(open) => {
                if (!open) {
                    form.reset();
                    onClose();
                }
            }}
        >
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="text-2xl font-light tracking-normal text-[#3F0052]">
                        Message {recipientName}
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-4"
                    >
                        <FormField
                            control={form.control}
                            name="content"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Enter Your Message..."
                                            className="min-h-[150px]"
                                            disabled={isSubmitting}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    form.reset();
                                    onClose();
                                }}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    "Send Message"
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
