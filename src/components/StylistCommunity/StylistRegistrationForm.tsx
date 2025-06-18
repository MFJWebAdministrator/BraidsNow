import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ImageUpload } from "@/components/ClientCommunity/ImageUpload";
import { stylistRegistrationSchema } from "@/lib/schemas/stylist-registration";
import { useRegisterStylist } from "./hooks/useRegisterStylist";
import { AccountSection } from "./FormSections/AccountSection";
import { PersonalSection } from "./FormSections/PersonalSection";
import { BusinessSection } from "./FormSections/BusinessSection";
import { ServicesSection } from "./FormSections/ServicesSection";
import { LocationSection } from "./FormSections/LocationSection";
import { TermsAgreement } from "@/components/ClientCommunity/Steps/TermsAgreement";
// import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import type { StylistRegistrationForm as FormType } from "@/lib/schemas/stylist-registration";
import { SubscriptionModal } from "./SubscriptionModal";
import { loadStripe } from "@stripe/stripe-js";
import axios from "axios";
import { auth } from "@/lib/firebase/config";

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
const API_BASE_URL = import.meta.env.VITE_API_URL;

// Helper function to ensure origin URL is properly formatted for Stripe
const getFormattedOriginUrl = () => {
    const origin = window.location.origin;
    if (origin.includes("localhost")) {
        if (!origin.startsWith("http://") && !origin.startsWith("https://")) {
            return `http://${origin}`;
        }
    }
    return origin;
};

export function StylistRegistrationForm() {
    const [profileImage, setProfileImage] = useState<File | null>(null);
    const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] =
        useState(false);
    const [formData, setFormData] = useState<FormType | null>(null);
    const { register, isLoading } = useRegisterStylist();
    const { toast } = useToast();
    // const navigate = useNavigate();

    const form = useForm<FormType>({
        resolver: zodResolver(stylistRegistrationSchema),
        defaultValues: {
            username: "abcd",
            password: "12345678",
            firstName: "abcd",
            lastName: "efg",
            email: "abcd@gmail.com",
            phone: "0949960922",
            businessName: "noname",
            introduction:
                "nonamenonamenonamenonamenonamenonamenonamenonamenonamenonamenonamenonamenonamenonamenonamenonamenonamenonamenonamenonamenonamenonamenonamenonamenonamenonamenonamenonamenonamenonamenonamenoname",
            specialInstructions:
                "nonamenonamenonamenonamenonamenonamenonamenonamenonamenonamenonamenonamenonamenonamenonamenonamenonamenonamenonamenonamenonamenonamenonamenonamenonamenonamenonamenonamenonamenonamenonamenoname",
            policyAndProcedures:
                "nonamenonamenonamenonamenonamenonamenonamenonamenonamenonamenonamenonamenonamenonamenonamenonamenonamenonamenonamenonamenonamenonamenonamenonamenonamenonamenonamenonamenonamenonamenonamenoname",
            servicePreference: ["shop"],
            washesHair: false,
            providesHair: false,
            stylesMensHair: false,
            stylesChildrensHair: false,
            isLicensedBraider: false,
            depositAmount: 15,
            businessAddress: "AA",
            city: "AA",
            state: "AA",
            zipCode: "10001",
            agreeToTerms: false,
        },
    });

    const handleProceedToSubscription = async () => {
        try {
            // First register the user
            if (!formData) return;
            const registeredUser = await register(formData, profileImage);

            if (!registeredUser?.uid) {
                throw new Error("Failed to register user");
            }

            // Get fresh ID token
            const idToken = await auth.currentUser?.getIdToken(true);
            if (!idToken) {
                throw new Error("Failed to get authentication token");
            }

            // Get properly formatted origin URL
            const originUrl = getFormattedOriginUrl();
            const successUrl = `${originUrl}/stylist-registration?success=true`;
            const cancelUrl = `${originUrl}/stylist-registration?success=false`;

            // Create Stripe checkout session
            const response = await axios.post(
                `${API_BASE_URL}/create-checkout-session`,
                {
                    userId: registeredUser.uid,
                    email: formData.email,
                    successUrl,
                    cancelUrl,
                    mode: "subscription",
                    priceId: import.meta.env.VITE_STRIPE_PRICE_ID,
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${idToken}`,
                    },
                }
            );

            // Redirect to Stripe Checkout
            const stripe = await stripePromise;
            if (!stripe) {
                throw new Error("Failed to load Stripe");
            }

            const { error } = await stripe.redirectToCheckout({
                sessionId: response.data.sessionId,
            });

            if (error) {
                throw error;
            }
        } catch (error) {
            console.error("Error:", error);
            toast({
                title: "Error",
                description:
                    "Failed to process subscription. Please try again.",
                variant: "destructive",
            });
        }
    };

    const onSubmit = async (data: FormType) => {
        setFormData(data);
        setIsSubscriptionModalOpen(true);
    };

    return (
        <>
            <Form {...form}>
                <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="max-w-4xl mx-auto px-4"
                >
                    <div className="space-y-8 bg-white rounded-lg">
                        <div className="flex justify-center">
                            <div className="w-full max-w-sm">
                                <ImageUpload onImageSelect={setProfileImage} />
                            </div>
                        </div>

                        <AccountSection form={form} />
                        <PersonalSection form={form} />
                        <BusinessSection form={form} />
                        <ServicesSection form={form} />
                        <LocationSection form={form} />
                        <TermsAgreement form={form as any} />

                        <div className="space-y-4">
                            <div className="flex justify-center">
                                <Button
                                    type="submit"
                                    size="lg"
                                    className="rounded-full font-light px-8 py-6"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Creating Account...
                                        </>
                                    ) : (
                                        "Register My Business Now!"
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </form>
            </Form>

            <SubscriptionModal
                isOpen={isSubscriptionModalOpen}
                onClose={() => setIsSubscriptionModalOpen(false)}
                onProceed={handleProceedToSubscription}
            />
        </>
    );
}
