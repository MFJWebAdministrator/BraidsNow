import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import type { LoginFormType } from '@/lib/schemas/login';

export function useLogin() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogin = async (data: LoginFormType) => {
    try {
      setIsLoading(true);
      setError(null);

      // Sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(
        auth,
        data.usernameOrEmail,
        data.password
      );

      // Check user type in Firestore
      const clientDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      const stylistDoc = await getDoc(doc(db, 'stylists', userCredential.user.uid));

      let userType: 'client' | 'stylist' | null = null;
      if (clientDoc.exists()) userType = 'client';
      if (stylistDoc.exists()) userType = 'stylist';

      // Handle user type
      if (userType) {
        toast({
          title: "Welcome back!",
          description: `You have successfully signed in as a ${userType}.`,
        });

        // Route based on user type
        navigate(userType === 'client' ? '/client-dashboard' : '/stylist-dashboard');
      } else {
        throw new Error('Unable to determine user type. Please contact support.');
      }
    } catch (err: any) {
      console.error('Login error:', err);

      let errorMessage = 'An error occurred. Please try again.';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found') {
        errorMessage = 'Invalid email or password.';
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.';
      }

      setError(errorMessage);

      toast({
        title: "Sign in failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    handleLogin,
    isLoading,
    error,
  };
}
