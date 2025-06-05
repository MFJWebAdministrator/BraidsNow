import { Fragment } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, Home, X } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useUserData } from "@/hooks/use-user-data";
import { NotificationPopup } from "./NotificationPopup";

interface MobileMenuProps {
    isOpen: boolean;
    onClose: () => void;
    onLogout: () => void;
}

export function MobileMenu({ isOpen, onClose, onLogout }: MobileMenuProps) {
    const { user } = useAuth();
    const { userData } = useUserData(user?.uid);

    if (!isOpen) return null;

    const dashboardPath =
        userData?.userType === "client"
            ? "/dashboard/client"
            : "/dashboard/stylist";

    return (
        <Fragment>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 z-40 md:hidden"
                onClick={onClose}
            />

            {/* Mobile Menu Panel */}
            <div className="fixed top-0 right-0 h-full w-80 bg-white shadow-xl z-50 md:hidden transform transition-transform duration-300 ease-in-out">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b bg-white">
                    <div className="flex items-center space-x-2">
                        {/* <img
                            src="/images/Official BN Favicon.png"
                            alt="BraidsNow.com Logo"
                            className="h-8 w-8 object-contain"
                        />
                        <span className="text-lg font-light tracking-tight text-[#3F0052]">
                            BraidsNow.com
                        </span> */}
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="h-8 w-8 hover:bg-gray-100"
                    >
                        <X className="h-5 w-5 text-gray-600" />
                    </Button>
                </div>

                {user ? (
                    // Authenticated user menu
                    <div className="flex flex-col h-full bg-white">
                        {/* User Profile Section */}
                        <div className="p-4 border-b bg-white">
                            <Link
                                to={dashboardPath}
                                onClick={onClose}
                                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
                            >
                                <Avatar className="h-12 w-12 border-2 border-[#3F0052]">
                                    <AvatarImage
                                        src={userData?.profileImage}
                                        alt={userData?.firstName}
                                    />
                                    <AvatarFallback className="bg-[#3F0052] text-white">
                                        {userData?.firstName?.[0]}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="text-sm font-medium text-[#3F0052]">
                                        Hi, {userData?.firstName}!
                                    </p>
                                    <p className="text-xs text-gray-600 capitalize">
                                        {userData?.userType} Dashboard
                                    </p>
                                </div>
                            </Link>
                        </div>

                        {/* Navigation Links */}
                        <nav className="flex-1 p-4 space-y-2 bg-white">
                            <Link
                                to="/find-stylists"
                                onClick={onClose}
                                className="flex items-center space-x-3 p-3 rounded-lg text-[#3F0052] hover:bg-gray-50 transition-colors border border-gray-100 font-medium"
                            >
                                <span>Find Stylists</span>
                            </Link>
                            <Link
                                to="/style-show"
                                onClick={onClose}
                                className="flex items-center space-x-3 p-3 rounded-lg text-[#3F0052] hover:bg-gray-50 transition-colors border border-gray-100 font-medium"
                            >
                                <span>StyleShow</span>
                            </Link>
                            <Link
                                to="/"
                                onClick={onClose}
                                className="flex items-center space-x-3 p-3 rounded-lg text-[#3F0052] hover:bg-gray-50 transition-colors border border-gray-100 font-medium"
                            >
                                <Home className="h-5 w-5" />
                                <span>Home</span>
                            </Link>
                        </nav>

                        {/* Bottom Actions */}
                        <div className="p-4 border-t space-y-3 bg-white">
                            <div className="flex justify-center">
                                <NotificationPopup />
                            </div>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    onClose();
                                    onLogout();
                                }}
                                className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200 font-medium"
                            >
                                <LogOut className="h-5 w-5 mr-2" />
                                Logout
                            </Button>
                        </div>
                    </div>
                ) : (
                    // Non-authenticated user menu
                    <div className="flex flex-col h-full bg-white">
                        {/* Navigation Links */}
                        <nav className="flex-1 p-4 space-y-2 bg-white">
                            <Link
                                to="/find-stylists"
                                onClick={onClose}
                                className="flex items-center space-x-3 p-3 rounded-lg text-[#3F0052] hover:bg-gray-50 transition-colors border border-gray-100 font-medium"
                            >
                                <span>Find Stylists</span>
                            </Link>
                            <Link
                                to="/style-show"
                                onClick={onClose}
                                className="flex items-center space-x-3 p-3 rounded-lg text-[#3F0052] hover:bg-gray-50 transition-colors border border-gray-100 font-medium"
                            >
                                <span>StyleShow</span>
                            </Link>
                        </nav>

                        {/* Bottom Actions */}
                        <div className="p-4 border-t space-y-3 bg-white">
                            <Button
                                variant="default"
                                className="w-full font-medium rounded-lg tracking-normal bg-[#3F0052] hover:bg-[#3F0052]/90 text-white"
                                asChild
                            >
                                <Link to="/login" onClick={onClose}>
                                    Sign In
                                </Link>
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full font-medium rounded-lg tracking-normal border-[#3F0052] text-[#3F0052] hover:bg-[#3F0052] hover:text-white"
                                asChild
                            >
                                <Link to="/client-community" onClick={onClose}>
                                    Join Community
                                </Link>
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </Fragment>
    );
}
