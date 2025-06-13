import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut, Menu } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { UserProfile } from "./Header/UserProfile";
import { LogoutConfirmation } from "./Header/LogoutConfirmation";
import { NotificationPopup } from "./Header/NotificationPopup";
import { MobileMenu } from "./Header/MobileMenu";

export function Header() {
    const { user } = useAuth();
    const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleMobileMenuToggle = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const handleMobileMenuClose = () => {
        setIsMobileMenuOpen(false);
    };

    const handleMobileLogout = () => {
        setShowLogoutConfirmation(true);
    };

    return (
        <header className="fixed w-full top-0 z-50 bg-white/80 backdrop-blur-md border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center space-x-2">
                        <img
                            src="/images/Official BN Favicon.png"
                            alt="BraidsNow.com Logo"
                            className="h-12 w-12 object-contain"
                        />
                        <span className="text-xl font-light tracking-tight text-[#3F0052]">
                            BraidsNow.com
                        </span>
                    </Link>

                    {user ? (
                        // Authenticated user header
                        <div className="flex items-center space-x-6">
                            <nav className="hidden md:flex items-center space-x-6">
                                <Link
                                    to="/find-stylists"
                                    className="text-[#3F0052] hover:text-[#B98EC1] font-light transition-colors tracking-normal"
                                >
                                    Find Stylists
                                </Link>
                                <Link
                                    to="/style-show"
                                    className="text-[#3F0052] hover:text-[#B98EC1] font-light transition-colors tracking-normal"
                                >
                                    StyleShow
                                </Link>
                            </nav>

                            <div className="flex items-center space-x-4">
                                {/* Balance display - clickable to navigate to earnings page */}

                                <NotificationPopup />
                                <div className="flex items-center space-x-4">
                                    {/* <div onClick={() => navigate('/dashboard/stylist/paymentss')} className="cursor-pointer">
                    <BalanceDisplay />
                  </div> */}
                                    <div className="relative">
                                        <UserProfile />
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                        setShowLogoutConfirmation(true)
                                    }
                                    className="hidden md:flex"
                                >
                                    <LogOut className="h-5 w-5 text-[#3F0052]" />
                                </Button>
                            </div>
                        </div>
                    ) : (
                        // Non-authenticated header content
                        <div className="hidden md:flex items-center space-x-4">
                            <nav className="flex items-center space-x-6">
                                <Link
                                    to="/find-stylists"
                                    className="text-[#3F0052] hover:text-[#B98EC1] font-light transition-colors tracking-normal"
                                >
                                    Find Stylists
                                </Link>
                                <Link
                                    to="/style-show"
                                    className="text-[#3F0052] hover:text-[#B98EC1] font-light transition-colors tracking-normal"
                                >
                                    StyleShow
                                </Link>
                            </nav>
                            <div className="flex items-center space-x-4">
                                <Button
                                    variant="default"
                                    className="font-light rounded-full tracking-normal"
                                    asChild
                                >
                                    <Link to="/login">Sign In</Link>
                                </Button>
                                <Button
                                    variant="default"
                                    className="font-light rounded-full tracking-normal"
                                    asChild
                                >
                                    <Link to="/stylist-community">
                                        Join BraidsNow.com Community
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Mobile Menu Button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleMobileMenuToggle}
                        className="md:hidden p-2 text-[#3F0052]"
                    >
                        <Menu className="h-6 w-6" />
                    </Button>
                </div>
            </div>

            <LogoutConfirmation
                isOpen={showLogoutConfirmation}
                onClose={() => setShowLogoutConfirmation(false)}
            />

            {/* Mobile Menu */}
            <MobileMenu
                isOpen={isMobileMenuOpen}
                onClose={handleMobileMenuClose}
                onLogout={handleMobileLogout}
            />
        </header>
    );
}
