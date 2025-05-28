import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
    LayoutDashboard,
    Calendar,
    // Users,
    Scissors,
    Image,
    Settings,
    Heart,
    Clock,
    LogOut,
    UserCircle,
    MessageSquare,
    CreditCard,
    Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LogoutConfirmation } from "@/components/dashboard/client/LogoutConfirmation";
import { useAuth } from "@/hooks/use-auth";
import { useSubscription } from "@/hooks/use-subscription";

const links = [
    {
        href: "/dashboard/stylist",
        label: "Overview",
        icon: LayoutDashboard,
        requiresSubscription: false,
    },
    {
        href: "/dashboard/stylist/appointments",
        label: "Appointments",
        icon: Calendar,
        requiresSubscription: true,
    },
    {
        href: "/dashboard/stylist/schedule",
        label: "Schedule",
        icon: Clock,
        requiresSubscription: true,
    },
    {
        href: "/dashboard/stylist/messages",
        label: "Messages",
        icon: MessageSquare,
        requiresSubscription: true,
    },
    // { href: '/dashboard/stylist/clients', label: 'Clients', icon: Users, requiresSubscription: true },
    {
        href: "/dashboard/stylist/services",
        label: "My Services",
        icon: Scissors,
        requiresSubscription: true,
    },
    {
        href: "/dashboard/stylist/favorites",
        label: "My Favorites",
        icon: Heart,
        requiresSubscription: true,
    },
    {
        href: "/dashboard/stylist/styleboard",
        label: "Style Board",
        icon: Image,
        requiresSubscription: true,
    },
    {
        href: "/dashboard/stylist/payments",
        label: "Payments",
        icon: CreditCard,
        requiresSubscription: false,
    }, // Always accessible
    {
        href: "/dashboard/stylist/settings",
        label: "Settings",
        icon: Settings,
        requiresSubscription: true,
    },
];

export function StylistSidebar() {
    const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);
    const { user } = useAuth();
    const { hasAccess, isLoading, subscriptionStatus } = useSubscription();

    const renderNavLink = (link: (typeof links)[0]) => {
        const { href, label, icon: Icon, requiresSubscription } = link;
        const isLocked = requiresSubscription && !hasAccess;

        if (isLocked) {
            return (
                <div
                    key={href}
                    className="flex items-center justify-between px-3 py-2 rounded-lg text-sm text-gray-400 cursor-not-allowed"
                    title="Complete your subscription and payout setup to access this feature"
                >
                    <div className="flex items-center space-x-2">
                        <Icon className="h-4 w-4" />
                        <span>{label}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                        <Lock className="h-3 w-3" />
                    </div>
                </div>
            );
        }

        return (
            <NavLink
                key={href}
                to={href}
                end={href === "/dashboard/stylist"}
                className={({ isActive }) =>
                    cn(
                        "flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-colors",
                        isActive
                            ? "bg-[#3F0052] text-white"
                            : "text-gray-700 hover:bg-gray-100"
                    )
                }
            >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
            </NavLink>
        );
    };

    return (
        <nav className="w-64 border-r bg-white pt-24 p-4 space-y-2">
            {/* Subscription Status Indicator */}
            {!isLoading && (
                <div className="mb-4 p-3 rounded-lg bg-gray-50 border">
                    {hasAccess ? (
                        <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm text-green-700 font-medium">
                                Account Active
                            </span>
                        </div>
                    ) : subscriptionStatus?.subscription?.status === "active" &&
                      !subscriptionStatus?.details?.payoutsEnabled ? (
                        <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                                <span className="text-sm text-yellow-700 font-medium">
                                    Payout Setup Required
                                </span>
                            </div>
                            <NavLink
                                to="/dashboard/stylist/payments"
                                className="text-xs text-blue-600 hover:text-blue-800 underline"
                            >
                                Complete Setup →
                            </NavLink>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                <span className="text-sm text-orange-700 font-medium">
                                    Subscription Required
                                </span>
                            </div>
                            <NavLink
                                to="/dashboard/stylist/payments"
                                className="text-xs text-blue-600 hover:text-blue-800 underline"
                            >
                                Finish Subscription →
                            </NavLink>
                        </div>
                    )}
                </div>
            )}

            {/* Navigation Links */}
            {links.map(renderNavLink)}

            {/* My Profile Link */}
            <NavLink
                to={`/stylist/${user?.uid}`}
                className={({ isActive }) =>
                    cn(
                        "flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-colors",
                        isActive
                            ? "bg-[#3F0052] text-white"
                            : "text-gray-700 hover:bg-gray-100"
                    )
                }
            >
                <UserCircle className="h-4 w-4" />
                <span>My Profile</span>
            </NavLink>

            {/* Logout Button */}
            <button
                onClick={() => setShowLogoutConfirmation(true)}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-colors w-full text-red-600 hover:bg-red-50"
            >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
            </button>

            <LogoutConfirmation
                isOpen={showLogoutConfirmation}
                onClose={() => setShowLogoutConfirmation(false)}
            />
        </nav>
    );
}
