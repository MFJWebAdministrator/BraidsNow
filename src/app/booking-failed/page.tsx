'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { XCircleIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';

export default function BookingFailedPage() {
  const searchParams = useSearchParams();
  const [bookingData, setBookingData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      fetch(`/api/functions/booking-failed?session_id=${sessionId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.error) {
            setError(data.error);
          } else {
            setBookingData(data);
          }
        })
        .catch((err) => {
          setError('Failed to load booking details');
          console.error('Error:', err);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setError('No session ID provided');
      setLoading(false);
    }
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow">
        <div className="text-center">
          <XCircleIcon className="mx-auto h-12 w-12 text-red-500" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Booking Failed
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {error || 'Your booking payment was not completed.'}
          </p>
        </div>

        {bookingData?.pendingBooking && (
          <div className="mt-8 space-y-4">
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-lg font-medium text-gray-900">
                Booking Details
              </h3>
              <dl className="mt-4 space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <dt className="text-sm font-medium text-gray-500">Service</dt>
                  <dd className="text-sm text-gray-900 col-span-2">
                    {bookingData.pendingBooking.bookingData.serviceName}
                  </dd>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <dt className="text-sm font-medium text-gray-500">Date</dt>
                  <dd className="text-sm text-gray-900 col-span-2">
                    {bookingData.pendingBooking.bookingData.date}
                  </dd>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <dt className="text-sm font-medium text-gray-500">Time</dt>
                  <dd className="text-sm text-gray-900 col-span-2">
                    {bookingData.pendingBooking.bookingData.time}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        )}

        <div className="mt-8 flex justify-center space-x-4">
          <Link
            href={`/book/${bookingData?.pendingBooking?.bookingData?.stylistId}`}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            Try Again
          </Link>
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}