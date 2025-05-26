import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ImageUpload } from './ImageUpload';
import { RegistrationFields } from './Steps/RegistrationFields';
import { TermsAgreement } from './Steps/TermsAgreement';
import { clientRegistrationSchema } from '@/lib/schemas/client-registration';
import { registerClient } from '@/lib/firebase/client/register';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import type { ClientRegistrationForm as FormType } from '@/lib/schemas/client-registration';

export function ClientRegistrationForm() {
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const form = useForm<FormType>({
    resolver: zodResolver(clientRegistrationSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      username: '',
      password: '',
      email: '',
      phone: '',
      streetAddress: '',
      city: '',
      state: '',
      zipCode: '',
      agreeToTerms: false,
    }
  });

  const onSubmit = async (data: FormType) => {
    try {
      setIsLoading(true);
      await registerClient(data, profileImage);
      
      toast({
        title: "Success!",
        description: "Your account has been created successfully.",
      });

      // Navigate to registration success page
      navigate('/registration-success', { replace: true });
    } catch (error: any) {
      console.error('Registration error:', error);
      
      let errorMessage = 'An error occurred during registration. Please try again.';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already registered. Please use a different email or sign in.';
      }
      
      toast({
        title: "Registration failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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

          <RegistrationFields form={form} />
          <TermsAgreement form={form} />

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
                'Join BraidsNow Community!'
              )}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}