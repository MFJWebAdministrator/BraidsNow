import { Button } from "@/components/ui/button";
import { TrustIndicators } from "./TrustIndicators";
import { Link } from "react-router-dom";

export function HeroContent() {
    return (
        <div className="lg:w-1/2 space-y-8">
            <h1 className="text-5xl lg:text-7xl font-light tracking-tight text-white leading-tight">
                Welcome To
                <span className="block mt-2 bg-gradient-to-r from-[#DFA801] to-[#DFA801]/80 bg-clip-text text-transparent">
                    BraidsNow.com
                </span>
            </h1>

            <p className="text-xl text-white tracking-normal max-w-xl font-light">
                Link up with skilled braiders who bring your style dreams to
                life. Get pro-level vibes that highlight your one-of-a-kind
                beauty.
            </p>

            {/* CTA Button */}
            <div className="flex flex-wrap gap-4">
                <Button
                    variant="outline"
                    size="lg"
                    className="border-[#DFA801] text-[#FBCC14] hover:text-[#FBCC14] hover:border-[#FBCC14] hover:bg-[#DFA801]/10 font-light"
                    asChild
                >
                    <Link to="/stylist-community">
                        Join BraidsNow.com Community
                    </Link>
                </Button>
            </div>

            <TrustIndicators />
        </div>
    );
}
