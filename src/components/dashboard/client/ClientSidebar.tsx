import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
    Calendar,
    Heart,
    Settings,
    LogOut,
    MessageSquare,
    LayoutDashboardIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LogoutConfirmation } from "./LogoutConfirmation";

const links = [
    {
        id: "overview",
        href: "/dashboard/client",
        label: "Overview",
        icon: LayoutDashboardIcon,
    },
    {
        id: "appointments",
        href: "/dashboard/client/appointments",
        label: "Appointments",
        icon: Calendar,
    },
    {
        id: "messages",
        href: "/dashboard/client/messages",
        label: "Messages",
        icon: MessageSquare,
    },
    {
        id: "favorites",
        href: "/dashboard/client/favorites",
        label: "Favorites",
        icon: Heart,
    },
    {
        id: "settings",
        href: "/dashboard/client/settings",
        label: "Settings",
        icon: Settings,
    },
] as const;

export function ClientSidebar() {
    const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);

    return (
        <nav className="w-64 h-full border-r bg-white pt-4 lg:pt-24 p-4 font-light tracking-normal space-y-2 flex flex-col">
            <div className="flex-1 space-y-2">
                {links.map(({ id, href, label, icon: Icon }) => (
                    <NavLink
                        key={id}
                        to={href}
                        end={href === "/dashboard/client"}
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
                ))}
            </div>

            {/* Logout Button */}
            <button
                onClick={() => setShowLogoutConfirmation(true)}
                className="logout-button flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-colors w-full text-red-600 hover:bg-red-50"
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
