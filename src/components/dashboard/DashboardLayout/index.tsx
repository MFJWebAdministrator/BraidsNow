import React from "react";
import { ClientSidebar } from "../client/ClientSidebar";
import { StylistSidebar } from "../stylist/StylistSidebar";
import { useAuth } from "@/hooks/use-auth";
import { useUserData } from "@/hooks/use-user-data";

interface DashboardLayoutProps {
    children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
    const { user } = useAuth();
    const { userData } = useUserData(user?.uid);

    if (!userData) return null;

    const Sidebar =
        userData.userType === "client" ? ClientSidebar : StylistSidebar;

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Desktop Sidebar - hidden on mobile/tablet */}
            <div className="hidden lg:block">
                <Sidebar />
            </div>
            <div className="flex-1 flex flex-col overflow-hidden">
                {children}
            </div>
        </div>
    );
}
