import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Confetti } from "@/components/ui/confetti";
import { SEO } from '@/components/SEO';
import { getPageMetadata } from '@/lib/metadata';

export function ClientRegistrationSuccessPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-white flex flex-col">
            <SEO metadata={getPageMetadata('registrationSuccess')} />
            <Confetti />

            <div className="flex-1 flex items-center justify-center">
                <div className="max-w-2xl mx-auto px-4 text-center space-y-8">
                    <h1 className="text-4xl font-light tracking-normal">
                        Welcome to the
                        <span className="block mt-2 bg-gradient-to-r from-[#3F0052] to-[#DFA801] bg-clip-text text-transparent">
                            BraidsNow.com Style Community!
                        </span>
                    </h1>

                    <p className="text-lg text-black font-light tracking-normal">
                        Thank you for joining our community! Your account has
                        been created successfully. You can now book appointments
                        and access other great features!
                    </p>

                    <div className="space-y-4">
                        <Button
                            onClick={() =>
                                navigate("/dashboard/client", { replace: true })
                            }
                            className="rounded-full font-light px-8"
                            size="lg"
                        >
                            Go To Your Client Dashboard
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
