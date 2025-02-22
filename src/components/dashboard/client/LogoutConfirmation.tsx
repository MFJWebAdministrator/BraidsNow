import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { auth } from '@/lib/firebase/config';

interface LogoutConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LogoutConfirmation({ isOpen, onClose }: LogoutConfirmationProps) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
    onClose();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-4xl font-light tracking-normal block mt-2 bg-gradient-to-r from-[#3F0052] to-[#DFA801] bg-clip-text text-transparent">
            Confirm Logout
          </AlertDialogTitle>
          <AlertDialogDescription className="tracking-normal text-md font-light text-black">
            Are you sure you want to log out? You will need to sign in again to access your dashboard.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="tracking-normal text-lg font-light">Cancel</AlertDialogCancel>
          <Button onClick={handleLogout} className="tracking-normal text-lg font-light">
            Logout
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}