import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { auth } from "@/lib/firebase/config";
import axios from "axios";

import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

export function BalanceDisplay() {
    const { user } = useAuth();
    const [balance, setBalance] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const API_URL = import.meta.env.VITE_API_URL;
    useEffect(() => {
        const fetchBalance = async () => {
            if (!user || !user.uid) return;

            try {
                setLoading(true);
                setError(null);

                // Get fresh ID token
                const idToken = await auth.currentUser?.getIdToken(true);

                // Call the Express API endpoint
                const response = await axios.get(
                    `${API_URL}/stylist-balance?stylistId=${user.uid}`,
                    {
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${idToken}`,
                        },
                    }
                );

                setBalance(response.data.balance || 0);
            } catch (error) {
                console.error("Error fetching balance:", error);
                setError("Failed to load balance");
            } finally {
                setLoading(false);
            }
        };

        fetchBalance();

        // Set up a refresh interval (every 5 minutes)
        const intervalId = setInterval(fetchBalance, 5 * 60 * 1000);

        return () => clearInterval(intervalId);
    }, [user]);

    // Format the balance as currency
    const formatBalance = (amount: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 2,
        }).format(amount);
    };

    if (!user) return null;

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#F8F0FC] text-[#3F0052] cursor-pointer hover:bg-[#F3D9FA] transition-colors">
                        {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : error ? (
                            <span className="text-sm font-medium">--</span>
                        ) : (
                            <span className="text-sm font-medium">
                                {formatBalance(balance || 0)}
                            </span>
                        )}
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Your available balance</p>
                    {/* <p className="text-xs text-gray-500">Click to view earnings</p> */}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
