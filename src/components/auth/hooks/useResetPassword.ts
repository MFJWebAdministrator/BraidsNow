import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { resetPassword } from '@/lib/firebase/auth/resetPassword';

export function useResetPassword() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleResetPassword = async (email: string) => {
    try {
      setIsLoading(true);
      await resetPassword(email);
      
      toast({
        title: "Reset email sent",
        description: "Check your email for password reset instructions.",
      });
      
      return true;
    } catch (err: any) {
      console.error('Reset password error:', err);
      
      let errorMessage = 'Failed to send reset email. Please try again.';
      if (err.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address.';
      }
      
      toast({
        title: "Reset failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    handleResetPassword,
    isLoading
  };
}