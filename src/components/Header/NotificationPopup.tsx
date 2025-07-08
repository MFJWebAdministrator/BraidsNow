import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications, type Notification } from "@/hooks/use-notifications";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";

export function NotificationPopup() {
    const { user } = useAuth();
    const {
        notifications,
        loading,
        markAllAsRead,
        markAsRead,
        markAsSeen,
        unreadCount,
    } = useNotifications();
    const navigate = useNavigate();
    const location = useLocation();

    // Mark notifications as seen when popover opens
    const handlePopoverOpen = (open: boolean) => {
        if (open && notifications.length > 0) {
            notifications
                .filter((n) => !n.seen)
                .forEach((n) => markAsSeen(n.id));
        }
    };

    useEffect(() => {
        if (!user) return;

        const currentPath = location.pathname;
        if (currentPath.includes("/dashboard/messages")) {
            const relatedNotifications = notifications.filter(
                (n) => !n.read && n.recipientId === user.uid
            );

            if (relatedNotifications.length > 0) {
                relatedNotifications.forEach((n) => markAsRead(n.id));
            }
        }
    }, [location.pathname, notifications, markAsRead, user]);

    const handleNotificationClick = async (notification: Notification) => {
        try {
            if (!user) return;

            await markAsRead(notification.id);

            if (notification.type === "message") {
                // Determine the correct dashboard path based on user role
                const dashboardPath = location.pathname.includes("stylist")
                    ? "/dashboard/stylist/messages"
                    : "/dashboard/client/messages";

                // Navigate to the messages with the thread
                navigate(`${dashboardPath}?thread=${notification.threadId}`);
            }
        } catch (error) {
            console.error("Error handling notification click:", error);
        }
    };

    if (!user) return null;

    return (
        <Popover onOpenChange={handlePopoverOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5 text-[#3F0052]" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-red-500 flex items-center justify-center">
                            <span className="text-[8px] font-medium text-white">
                                {unreadCount > 9 ? "9+" : unreadCount}
                            </span>
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-80 p-0 bg-white"
                align="end"
                sideOffset={5}
            >
                <div className="border-b border-gray-200 bg-[#3F0052] rounded-t-lg flex items-center justify-between">
                    <h3 className="p-3 text-sm font-medium text-white">
                        Notifications
                    </h3>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="mr-2 text-xs text-white hover:text-white/80"
                            onClick={markAllAsRead}
                        >
                            Mark all as read
                        </Button>
                    )}
                </div>
                <ScrollArea className="h-[300px]">
                    {loading ? (
                        <div className="p-4 text-center">Loading...</div>
                    ) : notifications && notifications.length > 0 ? (
                        <div className="divide-y divide-gray-100">
                            {notifications
                                .filter((n) => n.recipientId === user.uid)
                                .map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                                            !notification.read
                                                ? "bg-purple-50"
                                                : ""
                                        }`}
                                        onClick={() =>
                                            handleNotificationClick(
                                                notification
                                            )
                                        }
                                    >
                                        <div className="flex items-start gap-3">
                                            <Avatar className="h-8 w-8 border border-gray-200">
                                                <AvatarImage
                                                    src={
                                                        notification.senderImage
                                                    }
                                                />
                                                <AvatarFallback>
                                                    {notification
                                                        .senderName?.[0] || "?"}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-sm font-medium text-[#3F0052]">
                                                        {
                                                            notification.senderName
                                                        }
                                                    </p>
                                                    {!notification.read && (
                                                        <span className="h-2 w-2 rounded-full bg-[#3F0052]" />
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-500">
                                                    {notification.message}
                                                </p>
                                                <p className="text-xs text-gray-400">
                                                    {format(
                                                        new Date(
                                                            notification.createdAt
                                                        ),
                                                        "MMM d, h:mm a"
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    ) : (
                        <div className="p-8 text-center text-sm text-gray-500">
                            No notifications
                        </div>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}
