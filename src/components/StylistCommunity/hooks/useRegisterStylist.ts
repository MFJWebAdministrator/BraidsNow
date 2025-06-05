import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { registerStylist } from "@/lib/firebase/stylist/register";
import type { StylistRegistrationForm } from "@/lib/schemas/stylist-registration";

export function useRegisterStylist() {
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const navigate = useNavigate();

    const register = async (
        data: StylistRegistrationForm,
        profileImage: File | null
    ) => {
        try {
            setIsLoading(true);
            await registerStylist(data, profileImage);

            toast({
                title: "Welcome to BraidsNow.com!",
                description:
                    "Your stylist account has been created successfully.",
            });

            navigate("/registration-success");
        } catch (error: any) {
            console.error("Registration error:", error);

            let errorMessage =
                "An error occurred during registration. Please try again.";

            if (error.code === "auth/email-already-in-use") {
                errorMessage =
                    "This email is already registered. Please use a different email or sign in.";
            }

            toast({
                title: "Registration failed",
                description: errorMessage,
                variant: "destructive",
            });

            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        register,
        isLoading,
    };
}
