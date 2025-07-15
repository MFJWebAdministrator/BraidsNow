import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { registerStylist } from "@/lib/firebase/stylist/register";
import type { StylistRegistrationForm } from "@/lib/schemas/stylist-registration";
import type { User } from "firebase/auth";
import { useEmail } from "@/hooks/use-email";
import { useSms } from "@/hooks/use-sms";

export function useRegisterStylist() {
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const { sendWelcomeStylistEmail } = useEmail();
    const { sendWelcomeStylistSms } = useSms();

    const register = async (
        data: StylistRegistrationForm,
        profileImage: File | null
    ): Promise<User> => {
        try {
            setIsLoading(true);
            // get user by email first to check if the email is already in use

            const user = await registerStylist(data, profileImage);

            toast({
                title: "Welcome to BraidsNow.com!",
                // description:
                //     "Your stylist account has been created successfully.",
            });

            // send welcome email
            setTimeout(async () => {
                try {
                    await sendWelcomeStylistEmail({
                        stylistName: `${data.firstName} ${data.lastName}`,
                        stylistEmail: data.email,
                    });

                    // send welcome sms
                    await sendWelcomeStylistSms(
                        `${data.firstName} ${data.lastName}`,
                        data.phone
                    );
                } catch (error) {
                    console.error("Error sending welcome email:", error);
                }
            }, 1000);

            return user;
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
