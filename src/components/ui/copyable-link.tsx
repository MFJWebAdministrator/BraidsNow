import { useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface CopyableLinkProps {
    url: string;
    label?: string;
    description?: string;
    className?: string;
}

export function CopyableLink({
    url,
    label = "Your Link",
    description,
    className,
}: CopyableLinkProps) {
    const [copied, setCopied] = useState(false);
    const { toast } = useToast();

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);

            toast({
                title: "Link copied!",
                description: "Your BraidsNow link has been copied to clipboard",
            });

            // Reset the copied state after 2 seconds
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error("Failed to copy:", error);
            toast({
                title: "Copy failed",
                description: "Unable to copy link to clipboard",
                variant: "destructive",
            });
        }
    };

    const handleVisit = () => {
        window.open(url, "_blank", "noopener,noreferrer");
    };

    return (
        <div className={cn("space-y-2", className)}>
            {label && (
                <label className="text-md text-[#3F0052] font-light tracking-normal">
                    {label}
                </label>
            )}

            <div className="relative flex items-center gap-2">
                <Input
                    value={url}
                    readOnly
                    className={cn(
                        "pr-20 bg-gray-50 cursor-pointer transition-all duration-200",
                        copied && "bg-green-50 border-green-200"
                    )}
                    onClick={handleCopy}
                />

                <div className="absolute right-1 flex items-center gap-1">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className={cn(
                            "h-8 w-8 p-0 hover:bg-white/80 transition-all duration-200",
                            copied && "text-green-600"
                        )}
                        onClick={handleCopy}
                    >
                        {copied ? (
                            <Check className="h-4 w-4" />
                        ) : (
                            <Copy className="h-4 w-4" />
                        )}
                    </Button>

                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-white/80"
                        onClick={handleVisit}
                        title="Open link in new tab"
                    >
                        <ExternalLink className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {description && (
                <p className="text-sm text-black mt-1 text-md tracking-normal">
                    {description}
                </p>
            )}
        </div>
    );
}
