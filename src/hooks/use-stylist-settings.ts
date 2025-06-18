import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "./use-auth";
import { useToast } from "./use-toast";
import { updateStylistProfile } from "@/lib/firebase/stylist/updateProfile";
import { updateProfileImage } from "@/lib/firebase/storage/updateProfileImage";
import { stylistSettingsSchema } from "@/lib/schemas/stylist-settings";
import { useUserData } from "./use-user-data";
import type { StylistSettingsForm } from "@/lib/schemas/stylist-settings";

export function useStylistSettings() {
    const { user } = useAuth();
    const { userData, loading: userLoading } = useUserData(user?.uid);
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    const form = useForm<StylistSettingsForm>({
        resolver: zodResolver(stylistSettingsSchema),
        defaultValues: {
            firstName: "",
            lastName: "",
            email: "",
            phone: "",
            businessName: "",
            introduction: "",
            specialInstructions: "",
            policyAndProcedures: "",
            servicePreference: "shop",
            washesHair: false,
            providesHair: false,
            stylesMensHair: false,
            stylesChildrensHair: false,
            depositAmount: "",
            couponCode: "",
            businessAddress: "",
            city: "",
            state: "",
            zipCode: "",
        },
    });

    // Initialize form with user data
    useEffect(() => {
        if (userData) {
            form.reset({
                ...userData,
                depositAmount: userData.depositAmount?.toString() || "",
            });
        }
    }, [userData, form]);

    // Track form changes
    useEffect(() => {
        const subscription = form.watch(() => {
            if (!userData) return;

            const currentValues = form.getValues();
            const hasChanged = Object.keys(currentValues).some((key) => {
                if (key === "depositAmount") {
                    return (
                        currentValues[key]?.toString() !==
                        userData[key]?.toString()
                    );
                }
                return (
                    currentValues[key as keyof StylistSettingsForm] !==
                    userData[key]
                );
            });
            setHasChanges(hasChanged);
        });

        return () => subscription.unsubscribe();
    }, [form, userData]);

    const handleSubmit = async (data: StylistSettingsForm) => {
        if (!user) return;

        try {
            setIsLoading(true);
            await updateStylistProfile(user.uid, {
                ...data,
                depositAmount: data.depositAmount ?? "0", // data.depositAmount ? parseFloat(data.depositAmount) : 0
            });

            toast({
                title: "Changes Successful!",
                description: "Your profile has been updated.",
            });

            setHasChanges(false);
        } catch (error) {
            console.error("Error updating profile:", error);
            toast({
                title: "Error",
                description: "Failed to update profile. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleImageChange = async (file: File) => {
        if (!user) return;

        try {
            setIsLoading(true);
            await updateProfileImage(user.uid, file, "stylist");

            toast({
                title: "Success",
                description: "Profile image updated successfully.",
            });
        } catch (error) {
            console.error("Error updating profile image:", error);
            toast({
                title: "Error",
                description:
                    "Failed to update profile image. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return {
        form,
        isLoading: isLoading || userLoading,
        hasChanges,
        handleSubmit: form.handleSubmit(handleSubmit),
        handleImageChange,
        userData: { ...userData, uid: user?.uid },
    };
}
