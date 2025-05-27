import React, { useState } from "react";
import { Copy, Check } from "lucide-react";
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

export function SocialShare({ url, trigger, className }: SocialShareProps) {
    const { toast } = useToast();
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);

            toast({
                title: "Link copied!",
                description: "Profile link has been copied to clipboard",
            });

            // Reset the copied state after 2 seconds
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            toast({
                title: "Copy failed",
                description: "Unable to copy link to clipboard",
                variant: "destructive",
            });
        }
    };

    const defaultTrigger = (
        <Button
            variant="outline"
            size="lg"
            className={`rounded-full bg-white hover:bg-gray-50 border-gray-200 transition-all duration-200 ${
                copied ? "bg-green-50 border-green-200 text-green-700" : ""
            } ${className}`}
            onClick={handleCopy}
        >
            {copied ? (
                <Check className="w-4 h-4 mr-2 text-green-600" />
            ) : (
                <Copy className="w-4 h-4 mr-2" />
            )}
            {copied ? "Copied!" : "Share Profile"}
        </Button>
    );

    return trigger ? (
        <div onClick={handleCopy} className="cursor-pointer">
            {trigger}
        </div>
    ) : (
        defaultTrigger
    );
}
