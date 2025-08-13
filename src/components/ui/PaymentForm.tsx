import React, { useState } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements,
  Elements,
} from '@stripe/react-stripe-js';
import { Button } from './button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PaymentFormProps {
  clientSecret: string;
  amount: number;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

function PaymentFormContent({ amount, onSuccess, onError }: Omit<PaymentFormProps, 'clientSecret'>) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        throw submitError;
      }

      const { error: confirmError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success`,
        },
      });

      if (confirmError) {
        throw confirmError;
      }

      toast({
        title: "Payment successful",
        description: "Your payment has been processed successfully.",
        duration: 3000,
      });

      onSuccess?.();
    } catch (error: any) {
      console.error('Payment error:', error);
      toast({
        title: "Payment failed",
        description: error.message || "An error occurred during payment.",
        variant: "destructive",
        duration: 3000,
      });
      onError?.(error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Amount to pay: ${(amount / 100).toFixed(2)}
        </p>
        <Button 
          type="submit" 
          disabled={isProcessing || !stripe || !elements}
          className="rounded-full"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            'Pay Now'
          )}
        </Button>
      </div>
    </form>
  );
}

export function PaymentForm({ clientSecret, ...props }: PaymentFormProps) {
  const stripe = useStripe();

  if (!stripe || !clientSecret) {
    return null;
  }

  return (
    <Elements stripe={stripe} options={{ clientSecret }}>
      <PaymentFormContent {...props} />
    </Elements>
  );
}