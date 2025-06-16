import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import confetti from "canvas-confetti";

export function StylistRegistrationSuccess() {
    const navigate = useNavigate();

    useEffect(() => {
        // Trigger confetti animation
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = {
            startVelocity: 30,
            spread: 360,
            ticks: 60,
            zIndex: 0,
        };

        function randomInRange(min: number, max: number) {
            return Math.random() * (max - min) + min;
        }

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
                origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
                colors: ["#3F0052"],
            });
            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
                colors: ["#3F0052"],
            });
        }, 250);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg text-center">
                <div className="space-y-4">
                    <h1 className="text-3xl font-bold text-[#3F0052]">
                        Welcome to BraidsNow.com!
                    </h1>
                    <p className="text-gray-600">
                        Thank you for joining our community! Your account has
                        been created successfully. You can now promote your
                        business and access all stylist features!
                    </p>
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
