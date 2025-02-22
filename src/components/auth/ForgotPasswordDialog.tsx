import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useResetPassword } from './hooks/useResetPassword';

const resetSchema = z.object({
  email: z.string().email('Please enter a valid email address')
});

interface ForgotPasswordDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ForgotPasswordDialog({ isOpen, onClose }: ForgotPasswordDialogProps) {
  const { handleResetPassword, isLoading } = useResetPassword();
  const form = useForm({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      email: ''
    }
  });

  const onSubmit = async (data: { email: string }) => {
    const success = await handleResetPassword(data.email);
    if (success) {
      onClose();
      form.reset();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-light tracking-normal text-[#3F0052]">
            Reset Password
          </DialogTitle>
          <DialogDescription className="text-md text-black tracking-normal">
            Enter your Email Address and we'll send you instructions to reset your password.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-md text-[#3F0052] font-light tracking-normal">
                    Email Address
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder=""
                      className="form-input border-[#3F0052] focus:ring-[#3F0052]/20 focus:border-[#3F0052] tracking-normal"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              size="lg"
              className="w-full rounded-full font-light"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Reset Instructions'
              )}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}