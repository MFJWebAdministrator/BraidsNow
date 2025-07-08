import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import confetti from "canvas-confetti";
import { AlertCircle } from "lucide-react";
import { SEO } from "@/components/SEO";
import { getPageMetadata } from "@/lib/metadata";

// Helper function for confetti animation
function randomInRange(min: number, max: number) {
    return Math.random() * (max - min) + min;
}

export function StylistRegistration() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const isSuccess = searchParams.get("success") === "true";

    useEffect(() => {
        // Only trigger confetti animation if payment was successful
        if (isSuccess) {
            const duration = 3 * 1000;
            const animationEnd = Date.now() + duration;
            const defaults = {
                startVelocity: 30,
                spread: 360,
                ticks: 60,
                zIndex: 0,
            };

            const interval: any = setInterval(function () {
                const timeLeft = animationEnd - Date.now();

                if (timeLeft <= 0) {
                    return clearInterval(interval);
                }

                const particleCount = 50 * (timeLeft / duration);

                // BraidsNow.com brand color confetti
                confetti({
                    ...defaults,
                    particleCount,
                    origin: {
                        x: randomInRange(0.1, 0.3),
                        y: Math.random() - 0.2,
                    },
                    colors: ["#3F0052"],
                });
                confetti({
                    ...defaults,
                    particleCount,
                    origin: {
                        x: randomInRange(0.7, 0.9),
                        y: Math.random() - 0.2,
                    },
                    colors: ["#3F0052"],
                });
            }, 250);

            return () => clearInterval(interval);
        }
    }, [isSuccess]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <SEO metadata={getPageMetadata("stylistRegistration")} />
            <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg text-center">
                <div className="space-y-4">
                    {isSuccess ? (
                        <>
                            <h1 className="text-3xl font-bold text-[#3F0052]">
                                Welcome to BraidsNow.com!
                            </h1>
                            <p className="text-gray-600">
                                Thank you for joining our stylist community!
                                Your account has been created successfully.
                            </p>
                        </>
                    ) : (
                        <>
                            <div className="flex justify-center">
                                <AlertCircle className="h-12 w-12 text-amber-500" />
                            </div>
                            <p className="text-gray-600">
                                Your account has been created, but to access all
                                platform features, you'll need to complete your
                                subscription payment and set up your payout
                                account. You can do this from your dashboard.
                            </p>
                        </>
                    )}
                </div>
                <Button
                    onClick={() =>
                        navigate("/dashboard/stylist", {
                            replace: true,
                        })
                    }
                    className="w-full bg-[#3F0052] hover:bg-[#3F0052]/90 rounded-full"
                >
                    Go to Your Stylist Dashboard
                </Button>
            </div>
        </div>
    );
}
