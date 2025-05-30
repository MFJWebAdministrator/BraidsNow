import { useState } from "react";
import { Link } from "react-router-dom";
import { LogOut, Home, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogoutConfirmation } from "./LogoutConfirmation";
import { useAuth } from "@/hooks/use-auth";
import { useUserData } from "@/hooks/use-user-data";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { NotificationPopup } from "@/components/Header/NotificationPopup";
import { MobileSidebar } from "../MobileSidebar";

export function ClientDashboardHeader() {
    const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const { user } = useAuth();
    const { userData } = useUserData(user?.uid);

    if (!userData) return null;

    return (
        <div className="border-b bg-white">
            <div className="max-w-7xl mx-auto flex h-16 items-center px-4">
                {/* Mobile Menu Button */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsMobileSidebarOpen(true)}
                    className="lg:hidden mr-2 flex-shrink-0"
                >
                    <Menu className="h-5 w-5 text-[#3F0052]" />
                </Button>

                {/* Logo and Name */}
                <Link
                    to="/"
                    className="flex items-center space-x-2 flex-shrink-0 min-w-0"
                >
                    <img
                        src="/images/Official BN Favicon.png"
                        alt="BraidsNow Logo"
                        className="h-8 w-8 sm:h-12 sm:w-12 object-contain flex-shrink-0"
                    />
                    <span className="hidden sm:block text-lg sm:text-xl font-light tracking-tight text-[#3F0052] whitespace-nowrap">
                        BraidsNow
                    </span>
                </Link>

                {/* Right-aligned buttons and avatar */}
                <div className="ml-auto flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
                    <Link to="/" className="hidden sm:block">
                        <Button variant="ghost" size="icon">
                            <Home className="h-5 w-5 text-[#3F0052]" />
                        </Button>
                    </Link>

                    <NotificationPopup />

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowLogoutConfirmation(true)}
                        className="hidden sm:flex"
                    >
                        <LogOut className="h-5 w-5 text-[#3F0052]" />
                    </Button>

                    <Avatar className="h-8 w-8 sm:h-10 sm:w-10 border-2 border-[#3F0052]">
                        <AvatarImage
                            src={userData.profileImage}
                            alt={userData.firstName}
                        />
                        <AvatarFallback>{userData.firstName[0]}</AvatarFallback>
                    </Avatar>
                </div>
            </div>

            {/* Mobile Sidebar */}
            <MobileSidebar
                isOpen={isMobileSidebarOpen}
                onClose={() => setIsMobileSidebarOpen(false)}
            />

            <LogoutConfirmation
                isOpen={showLogoutConfirmation}
                onClose={() => setShowLogoutConfirmation(false)}
            />
        </div>
    );
}
