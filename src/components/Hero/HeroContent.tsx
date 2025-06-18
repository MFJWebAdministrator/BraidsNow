import { Button } from "@/components/ui/button";
import { TrustIndicators } from "./TrustIndicators";
import { Link } from "react-router-dom";
import { ArrowRight, Users, UserPlus } from "lucide-react";

export function HeroContent() {
    return (
        <div className="lg:w-1/2 space-y-8">
            <h1 className="text-5xl lg:text-7xl font-light tracking-tight text-white leading-tight">
                Welcome To
                <span className="block mt-2 bg-gradient-to-r from-[#DFA801] to-[#DFA801]/80 bg-clip-text text-transparent">
                    BraidsNow.com
                </span>
            </h1>

            <p className="text-xl text-white tracking-normal max-w-xl font-light leading-relaxed">
                Link up with skilled braiders who bring your style dreams to
                life. Get pro-level vibes that highlight your one-of-a-kind
                beauty.
            </p>

            {/* CTA Buttons */}
            <div className="space-y-6">
                {/* Primary CTAs */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <Button
                        variant="ghost"
                        size="lg"
                        className="text-[#FBCC14] hover:text-[#DFA801] hover:bg-[#FBCC14]/10 font-medium px-6 py-3 rounded-full border-2 border-[#FBCC14]/30 hover:border-[#FBCC14] transition-all duration-200 group shadow-md hover:shadow-lg"
                        asChild
                    >
                        <Link
                            to="/stylist-community"
                            className="flex items-center gap-2"
                        >
                            <UserPlus className="w-5 h-5" />
                            Register My Business
                            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                        </Link>
                    </Button>

                    <Button
                        variant="ghost"
                        size="lg"
                        className="text-[#FBCC14] hover:text-[#DFA801] hover:bg-[#FBCC14]/10 font-medium px-6 py-3 rounded-full border-2 border-[#FBCC14]/30 hover:border-[#FBCC14] transition-all duration-200 group shadow-md hover:shadow-lg"
                        asChild
                    >
                        <Link
                            to="/find-stylists"
                            className="flex items-center gap-2"
                        >
                            <Users className="w-5 h-5" />
                            Find a Stylist
                            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                        </Link>
                    </Button>
                </div>

                {/* Divider */}
                {/* <div className="flex items-center gap-4">
                    <div className="flex-1 h-px bg-white/20"></div>
                    <span className="text-white/60 text-sm font-light">or</span>
                    <div className="flex-1 h-px bg-white/20"></div>
                </div> */}

                {/* Stylist CTA */}
                {/* <div className="text-center space-y-3">
                    <p className="text-white/80 font-light">
                        Are you a professional stylist?
                    </p>
                    <Button
                        variant="ghost"
                        size="lg"
                        className="text-[#FBCC14] hover:text-[#DFA801] hover:bg-[#FBCC14]/10 font-medium px-6 py-3 rounded-full border-2 border-[#FBCC14]/30 hover:border-[#FBCC14] transition-all duration-200 group shadow-md hover:shadow-lg"
                        asChild
                    >
                        <Link
                            to="/stylist-community"
                            className="flex items-center gap-2"
                        >
                            <Briefcase className="w-5 h-5" />
                            Register My Business
                            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                        </Link>
                    </Button>
                </div> */}
            </div>

            <TrustIndicators />
        </div>
    );
}
