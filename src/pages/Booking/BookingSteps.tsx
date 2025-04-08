import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ServiceSelection } from './steps/ServiceSelection';
import { DateTimeSelection } from './steps/DateTimeSelection';
import { ClientInformation } from './steps/ClientInformation';
import { BookingConfirmation } from './steps/BookingConfirmation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

import type { BookingForm } from '@/lib/schemas/booking';
import type { ServiceSelection as ServiceSelectionType, DateTimeSelection as DateTimeSelectionType, ClientInformation as ClientInformationType } from '@/lib/schemas/booking';
import { useStylist } from '@/hooks/use-stylist';

interface BookingStepsProps {
  stylistId: string;
}

export function BookingSteps({ stylistId }: BookingStepsProps) {
  const [step, setStep] = useState(1);
  const [bookingData, setBookingData] = useState({
    service: null as ServiceSelectionType | null,
    dateTime: null as DateTimeSelectionType | null,
    clientInfo: null as ClientInformationType | null,
  });
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { stylist, loading } = useStylist(stylistId);
  
  // Check for pre-selected service from location state
  useEffect(() => {
    if (location.state?.selectedService) {
      setBookingData(prev => ({ 
        ...prev, 
        service: {
          serviceId: location.state.selectedService.serviceId,
          stylistId: location.state.selectedService.stylistId,
          price: location.state.selectedService.price,
          depositAmount: location.state.selectedService.depositAmount
        } 
      }));
      setStep(2);
    }
  }, [location.state]);

  const handleServiceSelect = (service: ServiceSelectionType) => {
    setBookingData(prev => ({ ...prev, service }));
    setStep(2);
  };

  const handleDateTimeSelect = (dateTime: DateTimeSelectionType) => {
    setBookingData(prev => ({ ...prev, dateTime }));
    setStep(3);
  };

  const handleClientInfoSubmit = (clientInfo: ClientInformationType) => {
    setBookingData(prev => ({ ...prev, clientInfo }));
    setStep(4);
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      navigate(`/stylist/${stylistId}`);
    }
  };

  // Prepare complete booking data for the confirmation step
  const prepareBookingData = (): BookingForm | null => {
    if (!bookingData.service || !bookingData.dateTime || !bookingData.clientInfo || !user || !stylist) {
      return null;
    }
  
    const paymentAmount = bookingData.clientInfo.paymentType === 'deposit' 
      ? bookingData.service.depositAmount 
      : bookingData.service.price;
  
    return {
      // Service details
      service: bookingData.service,
      dateTime: bookingData.dateTime,
      clientInfo: bookingData.clientInfo,
      
      // Additional required fields for API and database
      stylistId: stylistId,
      clientId: user.uid,
      serviceName: bookingData.service.serviceId,
      stylistName: `${stylist.firstName} ${stylist.lastName}`,
      businessName: stylist.businessName || '',
      date: bookingData.dateTime.date,
      time: bookingData.dateTime.time,
      clientName: `${bookingData.clientInfo.firstName} ${bookingData.clientInfo.lastName}`,
      clientEmail: bookingData.clientInfo.email,
      clientPhone: bookingData.clientInfo.phone,
      notes: bookingData.clientInfo.specialRequests || '',
      status: 'pending',
      paymentType: bookingData.clientInfo.paymentType,
      paymentAmount: paymentAmount,
      depositAmount: bookingData.service.depositAmount,
      totalAmount: bookingData.service.price,
      paymentStatus: 'pending',
      // Additional metadata for tracking
      bookingSource: 'website',
      createdAt: new Date()
    };
  };


  console.log(bookingData,"Password123")

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 relative overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#3F0052]/5 via-transparent to-[#DFA801]/5" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#DFA801]/5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#3F0052]/5 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative">
        {/* Progress Steps */}
        <div className="mb-12">
          <div className="flex items-center justify-between">
            {['Select Service', 'Choose Date & Time', 'Your Information', 'Confirmation'].map((title, index) => (
              <div key={title} className="flex flex-col items-center flex-1">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center mb-2
                  transition-all duration-300
                  ${step > index + 1 ? 'bg-green-500 text-white shadow-lg scale-105' : 
                    step === index + 1 ? 'bg-[#3F0052] text-white shadow-lg scale-105' : 
                    'bg-gray-100 text-gray-400'}
                `}>
                  {index + 1}
                </div>
                <span className={`text-sm ${step === index + 1 ? 'text-[#3F0052] font-medium' : 'text-gray-500'}`}>
                  {title}
                </span>
                {index < 3 && (
                  <div className={`absolute w-full h-0.5 left-0 top-5 -z-10 transition-all duration-300 ${
                    step > index + 1 ? 'bg-green-500' : 'bg-gray-100'
                  }`} style={{ width: 'calc(100% - 2.5rem)', left: 'calc(50% + 1.25rem)' }} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={handleBack}
          className="mb-8 hover:bg-[#3F0052]/5"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {/* Step Content */}
        <div className="mt-8">
          {step === 1 && (
            <ServiceSelection 
              stylistId={stylistId} 
              onSelect={handleServiceSelect}
            />
          )}
          {step === 2 && bookingData.service && (
            <DateTimeSelection
              stylistId={stylistId}
              onSelect={handleDateTimeSelect}
              selectedService={bookingData.service}
            />
          )}
          {step === 3 && bookingData.service && bookingData.dateTime && (
            <ClientInformation
              onSubmit={handleClientInfoSubmit}
              service={bookingData.service}
              dateTime={bookingData.dateTime}
            />
          )}
          {step === 4 && bookingData.service && bookingData.dateTime && bookingData.clientInfo && (
            <BookingConfirmation
              booking={prepareBookingData()!}
              onComplete={() => navigate(`/dashboard/client`)}
            />
          )}
        </div>
      </div>
    </div>
  );
}