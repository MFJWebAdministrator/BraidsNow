import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, AlertCircle } from 'lucide-react';
import axios from 'axios';
import type { BookingForm } from '@/lib/schemas/booking';

interface BookingConfirmationProps {
  booking: BookingForm;
  onComplete: () => void;
}

export function BookingConfirmation({ booking, onComplete }: BookingConfirmationProps|any) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const API_BASE_URL = import.meta.env.VITE_API_URL;

  // Calculate the deposit amount (in cents for Stripe)
  const depositAmount = booking.depositAmount ? booking.depositAmount * 100 : 0;
  const isDepositRequired = depositAmount > 0;
  
  const handleConfirm = async () => {
    try {
      // Reset error state
      setErrorMessage(null);
      setIsProcessing(true);
      
      // Validate booking data
      if (!booking.stylistId || !booking.serviceName || !booking.date || !booking.time) {
        throw new Error("Missing required booking information");
      }
      
      // Check if user is authenticated
      if (!user || !user.uid) {
        throw new Error("You must be logged in to complete this booking");
      }
      
      // Format date for API
      const formattedDate = booking.date instanceof Date 
        ? format(booking.date, 'yyyy-MM-dd')
        : typeof booking.date === 'string' ? booking.date : format(new Date(booking.date), 'yyyy-MM-dd');
      
      // Prepare complete booking details
      const completeBookingData = {
        ...booking,
        date: formattedDate,
        clientId: user.uid,
        status: 'pending',
        paymentStatus: isDepositRequired ? 'pending' : 'not_required',
        createdAt: new Date().toISOString()
      };
      
      // If no deposit required, create booking directly
      if (!isDepositRequired) {
        try {
          // Get fresh ID token
          const idToken = await user.getIdToken(true);
          
          // Create booking through API
          const response = await axios.post(
            `${API_BASE_URL}/create-booking`,
            completeBookingData,
            {
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`
              }
            }
          );
          
          if (response.data?.bookingId) {
            toast({
              title: "Booking Confirmed",
              description: "Your appointment has been successfully booked!",
            });
            
            onComplete();
          } else {
            throw new Error("Failed to create booking");
          }
        } catch (apiError: any) {
          console.error('API error details:', apiError);
          throw apiError;
        }
      } else {
        // If deposit is required, process payment with booking data
        // Get fresh ID token
        const idToken = await user.getIdToken(true);
        if (!idToken) {
          throw new Error("Authentication error. Please log in again.");
        }
        
        // Get the current URL for success/cancel redirects
        const origin = window.location.origin;
        const successUrl = `${origin}/booking-success`;
        const cancelUrl = `${origin}/booking-cancel`;
        
        // Call the API to create a payment checkout session with booking data
        try {
          const response = await axios.post(
            `${API_BASE_URL}/create-payment-to-stylist`,
            {
              userId: user.uid,
              stylistId: booking.stylistId,
              amount: depositAmount,
              serviceDescription: `Deposit for ${booking.serviceName} with ${booking.stylistName}`,
              successUrl,
              cancelUrl,
              bookingData: completeBookingData // Send complete booking data instead of bookingId
            },
            {
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`
              },
              timeout: 10000
            }
          );
          
          // Redirect to Stripe Checkout
          if (response.data?.url) {
            window.location.href = response.data.url;
          } else {
            throw new Error("Payment session creation failed - no URL returned");
          }
        } catch (apiError: any) {
          console.error('API error details:', apiError);
          
          // Handle specific API errors
          if (axios.isAxiosError(apiError)) {
            if (apiError.response?.status === 403) {
              throw new Error("Permission denied. You don't have access to complete this action.");
            } else if (apiError.response?.status === 401) {
              throw new Error("Authentication error. Please log in again.");
            } else if (apiError.response?.data?.error) {
              throw new Error(apiError.response.data.error);
            } else if (apiError.code === 'ECONNABORTED') {
              throw new Error("Request timed out. Please try again.");
            }
          }
          
          // If we got here, it's an unhandled error
          throw apiError;
        }
      }
    } catch (error) {
      console.error('Error processing booking:', error);
      
      let message = "There was an error processing your booking. Please try again.";
      
      // Check for specific error response
      if (axios.isAxiosError(error) && error.response) {
        if (error.response.status === 403) {
          message = "Permission denied. Please log in again or contact support.";
        } else if (error.response.status === 401) {
          message = "Your session has expired. Please log in again.";
        } else if (error.response.data?.error === "Stylist does not have an active payment account") {
          message = "This stylist is not set up to receive payments yet. Please contact them directly.";
        } else if (error.response.data?.error) {
          message = error.response.data.error;
        }
      } else if (error instanceof Error) {
        message = error.message;
      }
      
      // Set error message state instead of just showing toast
      setErrorMessage(message);
      
      // Also show toast
      toast({
        title: "Booking Failed",
        description: message,
        variant: "destructive"
      });
      
      // Make sure to set processing to false
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-light text-[#3F0052] mb-2">Booking Confirmation</h2>
        <p className="text-gray-600">Please review your booking details</p>
      </div>

      {/* Show error message if present */}
      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-800">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 mr-2 text-red-600 flex-shrink-0" />
            <p>{errorMessage}</p>
          </div>
        </div>
      )}

      <Card className="p-6 space-y-4">
        <div>
          <h3 className="font-medium mb-2">Service Details</h3>
          <p>Service: {booking.serviceName || booking.service.serviceId}</p>
          <p>Date: {booking.date instanceof Date ? 
            format(booking.date, 'MMMM d, yyyy') : 
            booking.dateTime?.date ? format(booking.dateTime.date, 'MMMM d, yyyy') : 'Not specified'}</p>
          <p>Time: {booking.time || booking.dateTime?.time}</p>
          <p>Stylist: {booking.stylistName}</p>
          {booking.businessName && <p>Business: {booking.businessName}</p>}
        </div>

        <div>
          <h3 className="font-medium mb-2">Client Information</h3>
          <p>Name: {booking.clientName || `${booking.clientInfo.firstName} ${booking.clientInfo.lastName}`}</p>
          <p>Email: {booking.clientEmail || booking.clientInfo.email}</p>
          <p>Phone: {booking.clientPhone || booking.clientInfo.phone}</p>
          {(booking.notes || booking.clientInfo.specialRequests) && (
            <p>Special Requests: {booking.notes || booking.clientInfo.specialRequests}</p>
          )}
        </div>

        <div>
          <h3 className="font-medium mb-2">Payment Details</h3>
          <p>Total Price: ${booking.totalAmount || booking.service.price}</p>
          {isDepositRequired && (
            <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 mr-2 text-amber-600 flex-shrink-0" />
                <div>
                  <p className="text-amber-800 font-medium">
                    A deposit of ${booking.depositAmount} is required to secure this booking.
                  </p>
                  <p className="text-sm text-amber-700 mt-1">
                    You'll be redirected to our secure payment page after confirming.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      <div className="flex justify-end space-x-4">
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
          className="bg-[#3F0052] hover:bg-[#3F0052]/90"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            isDepositRequired ? "Confirm & Pay Deposit" : "Confirm Booking"
          )}
        </Button>
      </div>
    </div>
  );
}