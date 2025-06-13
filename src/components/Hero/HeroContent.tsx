import { Button } from "@/components/ui/button";
import { TrustIndicators } from "./TrustIndicators";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

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

            {/* CTA Buttons */}
            <div className="space-y-4">
                {/* Primary CTA - For Clients */}
                <div>
                    <Button
                        variant="outline"
                        size="lg"
                        className="border-[#DFA801] text-[#FBCC14] hover:text-[#FBCC14] hover:border-[#FBCC14] hover:bg-[#DFA801]/10 font-light"
                        asChild
                    >
                        <Link to="/client-community">
                            Join BraidsNow.com Community
                        </Link>
                    </Button>
                </div>

                {/* <div>
                    <Button
                        variant="outline"
                        size="lg"
                        className="border-[#DFA801] text-[#FBCC14] hover:text-[#FBCC14] hover:border-[#FBCC14] hover:bg-[#DFA801]/10 font-light"
                        asChild
                    >
                        <Link to="/business-tools">
                            Are You a Stylist? Grow Your Business
                        </Link>
                    </Button>
                </div> */}

                {/* Secondary CTA - For Stylists */}
                <div className="flex items-center gap-2 group">
                    <Button
                        variant="ghost"
                        size="lg"
                        className="text-white/80 hover:text-[#DFA801] font-light p-0 h-auto hover:bg-transparent"
                        asChild
                    >
                        <Link
                            to="/business-tools"
                            className="flex items-center gap-2"
                        >
                            Are You a Stylist? Grow Your Business
                            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                        </Link>
                    </Button>
                </div>
            </div>

            <TrustIndicators />
        </div>
    );
}
