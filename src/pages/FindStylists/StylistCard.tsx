import { useState } from "react";
import {
    Heart,
    MapPin,
    Star,
    Home,
    Scissors,
    Store,
    Clock,
    Loader2,
    X,
    CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useFavorites } from "@/hooks/use-favorites";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router-dom";
import type { Stylist } from "./types";
import { useReviews } from "@/hooks/use-reviews";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

interface StylistCardProps {
    stylist: Stylist;
    onToggleFavorite: (id: string) => void;
    onViewProfile: (id: string) => void;
}

export function StylistCard({
    stylist,
    onToggleFavorite,
    onViewProfile,
}: StylistCardProps) {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { isFavorite, toggleFavorite } = useFavorites();
    const isFavorited = isFavorite(stylist.id);
    const { averageRating, reviews } = useReviews(stylist.id);
    const [isLoading, setIsLoading] = useState(false);
    const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
    const [paymentError, setPaymentError] = useState<string | null>(null);

    // Use stylist's starting price for the amount
    const serviceDescription = "Hair Styling Service";
    const amount = stylist.price?.from ? stylist.price.from * 100 : 5000; // Convert to cents, default to $50 if not available
    const platformFeePercentage = 0.1; // 10%
    const platformFee = amount * platformFeePercentage;
    const totalAmount = amount;
    const depositAmount =
        stylist.depositAmount ||
        (stylist.price?.from ? Math.round(stylist.price.from * 0.2) : 10);

    const handleFavoriteToggle = () => {
        if (!user) {
            navigate("/login", { state: { from: `/find-stylists` } });
            return;
        }

        // Call the parent component's toggle function
        onToggleFavorite(stylist.id);

        // Also update local state through the hook for immediate UI feedback
        toggleFavorite(stylist);
    };

    // Updated to use the same approach as ServicesSection
    const handleBookNow = () => {
        if (!user) {
            navigate("/login", { state: { from: `/book/${stylist.id}` } });
            return;
        }

        // Navigate to booking page with default service
        navigate(`/book/${stylist.id}`, {
            state: {
                selectedService: {
                    serviceId: serviceDescription,
                    stylistId: stylist.id,
                    price: stylist.price?.from || 50,
                    depositAmount,
                },
            },
        });
    };

    // Keep this for backward compatibility or alternative payment flow
    const handleProceedToPayment = async () => {
        setIsLoading(true);
        setPaymentError(null); // Clear previous errors
        console.log(amount);

        return;
    };
    const getServicePreferenceIcon = () => {
        switch (stylist.servicePreference) {
            case "home":
                return <Home className="w-4 h-4 mr-1" />;
            case "mobile":
                return <Scissors className="w-4 h-4 mr-1" />;
            default:
                return <Store className="w-4 h-4 mr-1" />;
        }
    };

    const getServicePreferenceText = () => {
        switch (stylist.servicePreference) {
            case "home":
                return "Styles From Home";
            case "mobile":
                return "Mobile Stylist";
            default:
                return "Styles at Shop";
        }
    };

    return (
        <>
            <div className="group">
                <div className="bg-white rounded-3xl p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 relative overflow-hidden">
                    {/* Gradient Background */}
                    <div className="absolute inset-0">
                        <div className="absolute inset-0 bg-gradient-to-br from-[#3F0052]/5 via-transparent to-[#DFA801]/5" />
                        <div className="absolute top-0 right-0 w-96 h-96 bg-[#DFA801]/5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
                        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#3F0052]/5 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl" />
                    </div>

                    {/* Content */}
                    <div className="relative">
                        {/* Header with Avatar and Actions */}
                        <div className="flex items-start justify-between mb-6">
                            <div className="flex items-center space-x-4">
                                <Avatar className="w-20 h-20 border-4 border-white shadow-xl">
                                    <AvatarImage
                                        src={stylist.image}
                                        alt={stylist.name}
                                    />
                                    <AvatarFallback>
                                        {stylist.name[0]}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="text-xl font-semibold text-[#3F0052] tracking-normal">
                                        {stylist.businessName}
                                    </h3>
                                    <p className="text-gray-600 tracking-normal">
                                        {stylist.name}
                                    </p>
                                    <div className="flex items-center mt-1">
                                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                        <span className="ml-1 text-sm font-medium">
                                            {averageRating}
                                        </span>
                                        <span className="text-[#3F0052] ml-1">
                                            ({reviews.length} Reviews)
                                        </span>
                                    </div>
                                    <div className="flex items-center mt-1 text-gray-600">
                                        <MapPin className="w-4 h-4 mr-1" />
                                        <span className="text-sm">
                                            {stylist.location}
                                        </span>
                                    </div>
                                    <div className="flex items-center mt-1 text-gray-600">
                                        {getServicePreferenceIcon()}
                                        <span className="text-sm">
                                            {getServicePreferenceText()}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleFavoriteToggle}
                                className="p-2 rounded-full hover:bg-white/50 transition-colors"
                                aria-label={
                                    isFavorited
                                        ? "Remove from favorites"
                                        : "Add to favorites"
                                }
                            >
                                <Heart
                                    className={`w-5 h-5 ${
                                        isFavorited
                                            ? "text-red-500 fill-red-500"
                                            : "text-[#3F0052]"
                                    } transition-colors duration-300`}
                                />
                            </button>
                        </div>

                        {/* Remove this duplicate button */}
                    </div>

                    {/* Services List - Limited to 4 */}
                    {stylist.services && stylist.services.length > 0 && (
                        <div className="flex justify-left">
                            <div className="flex flex-wrap justify-left gap-2 max-w-md">
                                {stylist.services.slice(0, 4).map((service) => (
                                    <span
                                        key={service.name}
                                        className="px-4 py-1.5 bg-white/50 backdrop-blur-sm rounded-full text-sm font-medium text-[#3F0052] border border-[#3F0052]/10 shadow-sm hover:bg-white/80 transition-colors"
                                    >
                                        {service.name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex items-center justify-between py-4 mt-4 border-y border-[#3F0052]/10">
                        <div>
                            <p className="text-sm text-gray-500 tracking-normal">
                                Starting from
                            </p>
                            <p className="text-2xl font-bold text-[#3F0052] tracking-normal">
                                ${stylist.price?.from || 50}
                            </p>
                        </div>

                        <div className="text-right">
                            <div className="flex items-center text-green-600 mb-1">
                                <Clock className="w-4 h-4 mr-1" />
                                <span className="text-sm tracking-normal">
                                    {stylist.availability}
                                </span>
                            </div>
                            <p className="text-sm text-gray-500 tracking-normal">
                                ${depositAmount} deposit
                            </p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 mt-4 relative">
                        <Button
                            variant="outline"
                            onClick={() => onViewProfile(stylist.id)}
                            className="flex-1 rounded-full font-light text-md tracking-normal border-2 hover:bg-[#3F0052] hover:text-white transition-all duration-300"
                        >
                            View Profile
                        </Button>

                        <Button
                            onClick={handleBookNow}
                            className="flex-1 rounded-full font-light text-md tracking-normal bg-[#3F0052] hover:bg-[#3F0052]/90 transition-all duration-300"
                        >
                            Book Now
                        </Button>
                    </div>
                </div>
            </div>

            {/* Payment Dialog - Keep for backward compatibility */}
            <Dialog
                open={paymentDialogOpen}
                onOpenChange={setPaymentDialogOpen}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-center text-xl">
                            Book Appointment
                        </DialogTitle>
                        <DialogDescription className="text-center">
                            Complete your booking with {stylist.name}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* Error Message - Added for better visibility */}
                        {paymentError && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                                <div className="flex items-start">
                                    <X className="h-5 w-5 mr-2 flex-shrink-0" />
                                    <div>
                                        <h4 className="font-medium">
                                            Payment Error
                                        </h4>
                                        <p className="text-sm">
                                            {paymentError}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Stylist Info */}
                        <div className="flex items-center space-x-3">
                            <Avatar className="h-12 w-12">
                                <AvatarImage
                                    src={stylist.image}
                                    alt={stylist.name}
                                />
                                <AvatarFallback>
                                    {stylist.name[0]}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <h4 className="font-medium">
                                    {stylist.businessName}
                                </h4>
                                <p className="text-sm text-gray-500">
                                    {stylist.location}
                                </p>
                            </div>
                        </div>

                        {/* Service Details */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="font-medium mb-2">
                                Service Details
                            </h4>
                            <p className="text-sm">{serviceDescription}</p>

                            <Separator className="my-3" />

                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">
                                    Service Fee
                                </span>
                                <span className="font-medium">
                                    ${amount / 100}
                                </span>
                            </div>

                            <div className="flex justify-between items-center mt-1">
                                <span className="text-sm text-gray-600">
                                    Platform Fee
                                </span>
                                <span className="font-medium">
                                    ${platformFee / 100}
                                </span>
                            </div>

                            <Separator className="my-3" />

                            <div className="flex justify-between items-center">
                                <span className="font-medium">Total</span>
                                <span className="font-bold text-lg">
                                    ${totalAmount / 100}
                                </span>
                            </div>
                        </div>

                        {/* Payment Notice */}
                        <div className="text-sm text-gray-500">
                            <p>
                                By proceeding, you agree to our Terms of Service
                                and Privacy Policy. You'll be redirected to our
                                secure payment processor to complete your
                                booking.
                            </p>
                        </div>
                    </div>

                    <DialogFooter className="flex-col sm:flex-col gap-2">
                        <Button
                            onClick={handleProceedToPayment}
                            className="w-full bg-[#3F0052] hover:bg-[#3F0052]/90"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <CreditCard className="mr-2 h-4 w-4" />
                                    Proceed to Payment
                                </>
                            )}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setPaymentDialogOpen(false);
                                setPaymentError(null); // Clear error when closing
                            }}
                            className="w-full"
                        >
                            Cancel
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
