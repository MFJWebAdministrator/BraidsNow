import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from './use-auth';
import { useToast } from './use-toast';
import { updateClientProfile } from '@/lib/firebase/client/updateProfile';
import { updateProfileImage } from '@/lib/firebase/storage/updateProfileImage';
import { clientSettingsSchema } from '@/lib/schemas/client-settings';
import { useUserData } from './use-user-data';
import type { ClientSettingsForm } from '@/lib/schemas/client-settings';

export function useClientSettings() {
  const { user } = useAuth();
  const { userData, loading: userLoading } = useUserData(user?.uid);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const form = useForm<ClientSettingsForm>({
    resolver: zodResolver(clientSettingsSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      streetAddress: '',
      city: '',
      state: '',
      zipCode: '',
    }
  });

  // Initialize form with user data
  useEffect(() => {
    if (userData) {
      form.reset({
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        email: userData.email || '',
        phone: userData.phone || '',
        streetAddress: userData.streetAddress || '',
        city: userData.city || '',
        state: userData.state || '',
        zipCode: userData.zipCode || '',
      });
    }
  }, [userData, form]);

  // Track form changes
  useEffect(() => {
    const subscription = form.watch(() => {
      if (!userData) return;
      
      const currentValues = form.getValues();
      const hasChanged = Object.keys(currentValues).some(
        key => currentValues[key as keyof ClientSettingsForm] !== userData[key]
      );
      setHasChanges(hasChanged);
    });

    return () => subscription.unsubscribe();
  }, [form, userData]);

  const handleSubmit = async (data: ClientSettingsForm) => {
    if (!user) return;

    try {
      setIsLoading(true);
      await updateClientProfile(user.uid, data);
      
      toast({
        title: "Success",
        description: "Your profile has been updated.",
      });
      
      setHasChanges(false);
    } catch (error) {
      console.error('Error updating profile:', error);
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
            await updateProfileImage(user.uid, file);

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
    userData
  };
}