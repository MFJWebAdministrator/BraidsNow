import React from "react";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { auth } from "@/lib/firebase/config";

interface LogoutConfirmationProps {
    isOpen: boolean;
    onClose: () => void;
}

export function LogoutConfirmation({
    isOpen,
    onClose,
}: LogoutConfirmationProps) {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = React.useState(false);

    const handleLogout = async () => {
        try {
            setIsLoading(true);
            await auth.signOut();
            navigate("/");
        } catch (error) {
            console.error("Error signing out:", error);
        } finally {
            setIsLoading(false);
            onClose();
        }
    };

    return (
        <AlertDialog open={isOpen} onOpenChange={onClose}>
            <AlertDialogContent className="max-w-md">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-4xl font-light tracking-normal block mt-2 bg-gradient-to-r from-[#3F0052] to-[#DFA801] bg-clip-text text-transparent">
                        Confirm Logout
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-black font-light text-md tracking-normal">
                        Are you sure you want to log out? You will need to sign
                        in again to access your account.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 sm:gap-4">
                    <AlertDialogCancel className="rounded-full tracking-normal text-lg font-light">
                        Cancel
                    </AlertDialogCancel>
                    <Button
                        onClick={handleLogout}
                        disabled={isLoading}
                        className="rounded-full tracking-normal text-lg font-light"
                    >
                        {isLoading ? "Logging out..." : "Logout"}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
