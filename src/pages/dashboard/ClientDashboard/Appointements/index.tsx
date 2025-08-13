import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ClientDashboardHeader } from "@/components/dashboard/client/ClientDashboardHeader";
import { AppointementsContent } from "./AppointementsContent";
import { SEO } from "@/components/SEO";
import { getPageMetadata } from "@/lib/metadata";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

export function ClientAppointmentsPage() {
    const { toast } = useToast();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        const paymentSuccess = searchParams.get("payment_success");

        if (paymentSuccess !== null) {
            if (paymentSuccess === "true") {
                toast({
                    title: "Payment Successful!",
                    description:
                        "Your payment has been processed successfully. Thank you!",
                    variant: "default",
                    duration: 3000,
                });
            } else {
                toast({
                    title: "Payment Failed",
                    description:
                        "There was an issue processing your payment. Please try again or contact support if the problem persists.",
                    variant: "destructive",
                    duration: 3000,
                });
            }

            // Clean up the URL by removing the query parameters
            const url = new URL(window.location.href);
            url.searchParams.delete("payment_success");
            window.history.replaceState({}, "", url.toString());
        }
    }, [searchParams, toast]);

    return (
        <DashboardLayout>
            <SEO metadata={getPageMetadata("clientAppointments")} />
            <ClientDashboardHeader />
            <main className="flex-1 overflow-y-auto p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-3xl font-light tracking-normal text-[#3F0052]">
                            My Appointments
                        </h1>
                        <p className="text-gray-600 mt-2">
                            View and manage your appointments
                        </p>
                    </div>
                    <AppointementsContent />
                </div>
            </main>
        </DashboardLayout>
    );
}
