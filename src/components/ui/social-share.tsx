import React from "react";
import { Share2, Copy, MessageCircle, Send, Mail } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface SocialShareProps {
    url: string;
    title?: string;
    description?: string;
    image?: string;
    trigger?: React.ReactNode;
    className?: string;
}

export function SocialShare({
    url,
    title = "Check out this amazing stylist on BraidsNow!",
    description = "Find your perfect braiding stylist on BraidsNow",
    trigger,
    className,
}: SocialShareProps) {
    const { toast } = useToast();

    // Encode URL and text for sharing
    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);

    const shareOptions = [
        {
            name: "Copy Link",
            icon: Copy,
            action: async () => {
                try {
                    await navigator.clipboard.writeText(url);
                    toast({
                        title: "Link copied!",
                        description:
                            "Profile link has been copied to clipboard",
                    });
                } catch (error) {
                    toast({
                        title: "Copy failed",
                        description: "Unable to copy link to clipboard",
                        variant: "destructive",
                    });
                }
            },
        },
        {
            name: "Email",
            icon: Mail,
            color: "text-gray-600",
            action: () => {
                const subject = encodeURIComponent(title);
                const body = encodeURIComponent(
                    `${description}\n\nCheck out this profile: ${url}`
                );
                const emailUrl = `mailto:?subject=${subject}&body=${body}`;
                window.location.href = emailUrl;
            },
        },
        {
            name: "WhatsApp",
            icon: MessageCircle,
            color: "text-green-600",
            action: () => {
                const whatsappUrl = `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`;
                window.open(whatsappUrl, "_blank");
            },
        },
        {
            name: "Telegram",
            icon: Send,
            color: "text-blue-500",
            action: () => {
                const telegramUrl = `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`;
                window.open(telegramUrl, "_blank");
            },
        },
    ];

    // Native Web Share API fallback
    const handleNativeShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title,
                    text: description,
                    url,
                });
            } catch (error) {
                console.log("Native sharing cancelled or failed");
            }
        }
    };

    // Check if native sharing is supported
    const isNativeShareSupported =
        typeof navigator !== "undefined" && navigator.share;

    const defaultTrigger = (
        <Button
            variant="outline"
            size="lg"
            className={`rounded-full ${className}`}
        >
            <Share2 className="w-4 h-4 mr-2" />
            Share Profile
        </Button>
    );

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                {trigger || defaultTrigger}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Share Profile</DropdownMenuLabel>
                <DropdownMenuSeparator />

                {isNativeShareSupported && (
                    <>
                        <DropdownMenuItem onClick={handleNativeShare}>
                            <Share2 className="w-4 h-4 mr-2" />
                            More Options
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                    </>
                )}

                {shareOptions.map((option) => {
                    const IconComponent = option.icon;
                    return (
                        <DropdownMenuItem
                            key={option.name}
                            onClick={option.action}
                            className="cursor-pointer"
                        >
                            <IconComponent
                                className={`w-4 h-4 mr-2 ${option.color || ""}`}
                            />
                            {option.name}
                        </DropdownMenuItem>
                    );
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
