import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import { useToast } from './use-toast';
import type { LoginFormType } from '@/lib/schemas/login';

export function useLogin() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (data: LoginFormType) => {
    try {
      setIsLoading(true);
      setError(null);

      const userCredential = await signInWithEmailAndPassword(
        auth, 
        data.usernameOrEmail, 
        data.password
      );

      // Check user type
      const clientDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      const stylistDoc = await getDoc(doc(db, 'stylists', userCredential.user.uid));

      let dashboardPath = '/dashboard/client';
      if (stylistDoc.exists()) {
        dashboardPath = '/dashboard/stylist';
      }

      // Navigate to appropriate dashboard
      navigate(dashboardPath);
      
      toast({
        title: "Welcome back!",
        description: "Successfully signed in.",
      });
    } catch (err) {
      setError('Invalid email or password');
      toast({
        title: "Login failed",
        description: "Invalid email or password",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return { handleLogin, isLoading, error };
}