import { Fragment } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useUserData } from "@/hooks/use-user-data";
import { ClientSidebar } from "./client/ClientSidebar";
import { StylistSidebar } from "./stylist/StylistSidebar";

interface MobileSidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export function MobileSidebar({ isOpen, onClose }: MobileSidebarProps) {
    const { user } = useAuth();
    const { userData } = useUserData(user?.uid);

    if (!isOpen || !userData) return null;

    const SidebarComponent =
        userData.userType === "client" ? ClientSidebar : StylistSidebar;

    const handleContentClick = (e: React.MouseEvent) => {
        // Don't close if clicking on buttons or interactive elements
        const target = e.target as HTMLElement;
        const isInteractive =
            target.closest("button") ||
            target.closest("a") ||
            target.closest('[role="button"]') ||
            target.closest(".logout-button");

        if (!isInteractive) {
            onClose();
        }
    };

    return (
        <Fragment>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                onClick={onClose}
            />

            {/* Mobile Sidebar Panel */}
            <div className="fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-white shadow-xl z-50 lg:hidden transform transition-transform duration-300 ease-in-out overflow-y-auto">
                {/* Close Button */}
                <div className="absolute top-4 right-4 z-10">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="h-8 w-8"
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                {/* Sidebar Content */}
                <div onClick={handleContentClick} className="pt-0">
                    <SidebarComponent />
                </div>
            </div>
        </Fragment>
    );
}

// // Custom mobile sidebar components to avoid import issues
// function ClientMobileSidebar({ onClose }: { onClose: () => void }) {
//     const { user } = useAuth();

//     return (
//         <div className="flex flex-col h-full">
//             <ClientSidebar />
//         </div>
//     );
// }

// function StylistMobileSidebar({ onClose }: { onClose: () => void }) {
//     const { user } = useAuth();

//     return (
//         <div className="flex flex-col h-full">
//             <StylistSidebar />
//         </div>
//     );
// }
