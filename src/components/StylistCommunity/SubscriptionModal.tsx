import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface SubscriptionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onProceed: () => void;
}

export function SubscriptionModal({
    isOpen,
    onClose,
    onProceed,
}: SubscriptionModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-xl text-[#3F0052] font-medium">
                        Subscription Required
                    </DialogTitle>
                    <DialogDescription className="text-base mt-4">
                        BraidsNow.com Stylist accounts require an active
                        $19.99/month subscription to access all premium
                        features.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex justify-end space-x-4 mt-6">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="rounded-full"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={onProceed}
                        className="bg-[#3F0052] hover:bg-[#3F0052]/90 rounded-full"
                    >
                        Proceed
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
