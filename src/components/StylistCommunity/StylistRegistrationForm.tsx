import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ImageUpload } from '@/components/ClientCommunity/ImageUpload';
import { stylistRegistrationSchema } from '@/lib/schemas/stylist-registration';
import { useRegisterStylist } from './hooks/useRegisterStylist';
import { AccountSection } from './FormSections/AccountSection';
import { PersonalSection } from './FormSections/PersonalSection';
import { BusinessSection } from './FormSections/BusinessSection';
import { ServicesSection } from './FormSections/ServicesSection';
import { LocationSection } from './FormSections/LocationSection';
import { TermsAgreement } from '@/components/ClientCommunity/Steps/TermsAgreement';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import type { StylistRegistrationForm as FormType } from '@/lib/schemas/stylist-registration';

export function StylistRegistrationForm() {
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const { register, isLoading } = useRegisterStylist();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const form = useForm<FormType>({
    resolver: zodResolver(stylistRegistrationSchema),
    defaultValues: {
      username: '',
      password: '',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      businessName: '',
      introduction: '',
      specialInstructions: '',
      policyAndProcedures: '',
      servicePreference: 'shop',
      washesHair: false,
      providesHair: false,
      stylesMensHair: false,
      stylesChildrensHair: false,
      depositAmount: '',
      couponCode: '',
      businessAddress: '',
      city: '',
      state: '',
      zipCode: '',
      agreeToTerms: false,
    }
  });

  const onSubmit = async (data: FormType) => {
    try {
      await register(data, profileImage);
      
      toast({
        title: "Success!",
        description: "Your stylist account has been created successfully.",
      });

      // Navigate to registration success page
      navigate('/stylist-registration-success', { replace: true });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-4xl mx-auto px-4">
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
          <TermsAgreement form={form} />

          <div className="space-y-4">
            <p className="text-sm text-black tracking-normal text-center">
              Note: After your 30-day trial, your card will be charged $19.99/Month to use the BraidsNow Platform.
            </p>

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
                  'Join Stylist Community!'
                )}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </Form>
  );
}