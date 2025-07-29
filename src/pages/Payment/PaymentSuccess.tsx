import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import axios from "axios";
import { auth } from "@/lib/firebase/config";
import { SEO } from "@/components/SEO";
import { getPageMetadata } from "@/lib/metadata";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";

export function PaymentSuccess() {
    const [searchParams] = useSearchParams();
    const { user } = useAuth();
    const [paymentDetails, setPaymentDetails] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const sessionId = searchParams.get("session_id");
    const stylistId = searchParams.get("stylistId");
    const API_BASE_URL = import.meta.env.VITE_API_URL;

    const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;

    useEffect(() => {
        const fetchPaymentDetails = async () => {
            if (!user || !sessionId) {
                setLoading(false);
                return;
            }

            try {
                // Get fresh ID token
                const idToken = await auth.currentUser?.getIdToken(true);

                // Call the API to get payment details
                const response = await axios.get(
                    `${API_BASE_URL}/payment-details?sessionId=${sessionId}`,
                    {
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${idToken}`,
                        },
                    }
                );

                console.log("response", response.data);

                setPaymentDetails(response.data);
            } catch (error) {
                console.error("Error fetching payment details:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchPaymentDetails();
    }, [user, sessionId]);

    return (
        <div className="container max-w-md mx-auto py-12 px-4">
            <SEO metadata={getPageMetadata("paymentSuccess")} />
            <Card className="p-6 text-center">
                <div className="flex justify-center mb-4">
                    <CheckCircle className="h-16 w-16 text-green-500" />
                </div>
                <h1 className="text-2xl font-bold mb-2">Payment Successful!</h1>
                <p className="text-gray-600 mb-6">
                    Your payment has been processed successfully.
                </p>
                <div className="bg-blue-50 text-blue-900 p-3 rounded-md mb-6 text-sm">
                    Your booking request has been sent to the stylist for
                    review. They will either accept or reject it based on their
                    availability. You’ll be notified once they respond. If the
                    stylist rejects the booking, your payment will be
                    automatically refunded.
                </div>

                {loading ? (
                    <div className="animate-pulse bg-gray-200 h-20 rounded-md mb-6"></div>
                ) : paymentDetails ? (
                    <div className="bg-gray-50 p-4 rounded-md mb-6 text-left">
                        <div className="flex justify-between mb-2">
                            <span className="text-gray-600">Amount:</span>
                            <span className="font-medium">
                                ${(paymentDetails.amount / 100).toFixed(2)}
                            </span>
                        </div>
                        <div className="flex justify-between mb-2">
                            <span className="text-gray-600">Service:</span>
                            <span className="font-medium">
                                {paymentDetails.description}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Date:</span>
                            <span className="font-medium">
                                {`${format(
                                    toZonedTime(
                                        paymentDetails.bookingDateTime,
                                        browserTz
                                    ),
                                    "MMM dd, yyyy h:mm a"
                                )} ${browserTz}`}
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="bg-gray-50 p-4 rounded-md mb-6 text-center">
                        <p>Payment completed successfully.</p>
                    </div>
                )}

                <div className="space-y-3">
                    <Button asChild className="w-full">
                        <Link
                            to={
                                stylistId
                                    ? `/stylist/${stylistId}`
                                    : "/find-stylists"
                            }
                        >
                            {stylistId
                                ? "Back to Stylist"
                                : "View All Stylists"}{" "}
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full">
                        <Link to="/dashboard/client/appointments">
                            View My Appointments
                        </Link>
                    </Button>
                </div>
            </Card>
        </div>
    );
}
