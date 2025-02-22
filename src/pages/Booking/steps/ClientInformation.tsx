import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { format, parse } from 'date-fns';
import { useAuth } from '@/hooks/use-auth';
import { useUserData } from '@/hooks/use-user-data';
import type { ServiceSelection, DateTimeSelection, ClientInformation as ClientInformationType } from '@/lib/schemas/booking';

interface ClientInformationProps {
  service: ServiceSelection;
  dateTime: DateTimeSelection;
  onSubmit: (data: ClientInformationType) => void;
}

export function ClientInformation({ service, dateTime, onSubmit }: ClientInformationProps) {
  const { user } = useAuth();
  const { userData } = useUserData(user?.uid);
  const [paymentType, setPaymentType] = useState<'deposit' | 'full'>('deposit');

  const handleSubmit = () => {
    if (!userData) return;

    onSubmit({
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      phone: userData.phone,
      specialRequests: '',
      paymentType
    });
  };

  if (!userData) return null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-light text-[#3F0052] mb-2">Review Your Information</h2>
        <p className="text-gray-600">Please review your booking details</p>
      </div>

      {/* Booking Summary */}
      <Card className="p-6 space-y-6">
        {/* Service Details */}
        <div>
          <h3 className="font-medium text-[#3F0052] mb-3">Service Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Service</p>
              <p className="font-medium">{service.serviceId}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Date & Time</p>
              <p className="font-medium">
                {format(dateTime.date, 'MMMM d, yyyy')} at {format(parse(dateTime.time, 'HH:mm', new Date()), 'h:mm a')}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Price</p>
              <p className="font-medium">${service.price}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Required Deposit</p>
              <p className="font-medium">${service.depositAmount}</p>
            </div>
          </div>
        </div>

        {/* Client Information */}
        <div>
          <h3 className="font-medium text-[#3F0052] mb-3">Your Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">First Name</p>
              <p className="font-medium">{userData.firstName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Last Name</p>
              <p className="font-medium">{userData.lastName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{userData.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <p className="font-medium">{userData.phone}</p>
            </div>
          </div>
        </div>

        {/* Payment Options */}
        <div>
          <h3 className="font-medium text-[#3F0052] mb-3">Payment Options</h3>
          <div className="grid grid-cols-2 gap-4">
            <Card 
              className={`p-4 cursor-pointer transition-all duration-300 ${
                paymentType === 'deposit' 
                  ? 'bg-[#3F0052]/5 border-2 border-[#3F0052] shadow-lg' 
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => setPaymentType('deposit')}
            >
              <div className="flex items-start gap-4">
                <div className={`w-4 h-4 mt-1 rounded-full flex-shrink-0 ${
                  paymentType === 'deposit'
                    ? 'bg-[#3F0052]'
                    : 'border-2 border-gray-300'
                }`} />
                <div>
                  <p className="font-medium">Pay ${service.depositAmount} Deposit Now!</p>
                  <p className="text-sm text-gray-600">
                    Paid Deposit Will Secure Your Appointment
                  </p>
                </div>
              </div>
            </Card>

            <Card 
              className={`p-4 cursor-pointer transition-all duration-300 ${
                paymentType === 'full' 
                  ? 'bg-[#3F0052]/5 border-2 border-[#3F0052] shadow-lg' 
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => setPaymentType('full')}
            >
              <div className="flex items-start gap-4">
                <div className={`w-4 h-4 mt-1 rounded-full flex-shrink-0 ${
                  paymentType === 'full'
                    ? 'bg-[#3F0052]'
                    : 'border-2 border-gray-300'
                }`} />
                <div>
                  <p className="font-medium">Pay ${service.price} In Full Now!</p>
                  <p className="text-sm text-gray-600">
                    Pay In Full to Secure Your Appointment!
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button 
          onClick={handleSubmit}
          className="rounded-full px-8"
        >
          Continue to Payment
        </Button>
      </div>
    </div>
  );
}