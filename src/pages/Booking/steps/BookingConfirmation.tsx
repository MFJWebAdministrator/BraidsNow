import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { createBooking } from '@/lib/firebase/booking/createBooking';
import { useToast } from '@/hooks/use-toast';
import type { BookingForm } from '@/lib/schemas/booking';

interface BookingConfirmationProps {
  booking: BookingForm;
  onComplete: () => void;
}

export function BookingConfirmation({ booking, onComplete }: BookingConfirmationProps) {
  const [isProcessing, setIsProcessing] = React.useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleConfirm = async () => {
    try {
      setIsProcessing(true);
      await createBooking(booking);
      
      toast({
        title: "Booking Confirmed",
        description: "Your appointment has been successfully booked!",
      });
      
      onComplete();
    } catch (error) {
      console.error('Error creating booking:', error);
      toast({
        title: "Booking Failed",
        description: "There was an error processing your booking. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-light text-[#3F0052] mb-2">Booking Confirmation</h2>
        <p className="text-gray-600">Please review your booking details</p>
      </div>

      <Card className="p-6 space-y-4">
        <div>
          <h3 className="font-medium mb-2">Service Details</h3>
          <p>Service: {booking.service.serviceId}</p>
          <p>Date: {format(booking.dateTime.date, 'MMMM d, yyyy')}</p>
          <p>Time: {booking.dateTime.time}</p>
        </div>

        <div>
          <h3 className="font-medium mb-2">Client Information</h3>
          <p>Name: {booking.clientInfo.firstName} {booking.clientInfo.lastName}</p>
          <p>Email: {booking.clientInfo.email}</p>
          <p>Phone: {booking.clientInfo.phone}</p>
          {booking.clientInfo.specialRequests && (
            <p>Special Requests: {booking.clientInfo.specialRequests}</p>
          )}
        </div>

        <div>
          <h3 className="font-medium mb-2">Payment Details</h3>
          <p>Total Price: ${booking.service.price}</p>
          <p>Payment Type: {booking.clientInfo.paymentType === 'deposit' ? 
            `Deposit (${booking.service.depositAmount})` : 
            `Full Payment (${booking.service.price})`}
          </p>
        </div>
      </Card>

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => navigate(-1)}
          disabled={isProcessing}
        >
          Back
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={isProcessing}
        >
          {isProcessing ? 'Processing...' : 'Confirm Booking'}
        </Button>
      </div>
    </div>
  );
}