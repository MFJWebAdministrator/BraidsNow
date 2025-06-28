"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Info, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import type { StylistService } from "@/lib/schemas/stylist-service";
import { useToast } from "@/hooks/use-toast";
import ImageLightbox from "@/components/ImageLightBox";

interface ServicesSectionProps {
    services: StylistService[];
    depositAmount: number;
    stylistId: string;
}

export function ServicesSection({
    services,
    depositAmount,
    stylistId,
}: ServicesSectionProps) {
    const [showAll, setShowAll] = useState(false);
    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
    const displayedServices = showAll ? services : services.slice(0, 3);
    const hasMoreServices = services.length > 3;
    const navigate = useNavigate();
    const { user } = useAuth();
    const { toast } = useToast();

    const handleBookService = (service: StylistService) => {
        // Check if user is logged in
        if (!user) {
            navigate("/login", {
                state: {
                    from: `/book/${stylistId}`,
                    selectedService: {
                        serviceId: service.name,
                        stylistId,
                        price: service.price,
                        depositAmount,
                        duration: service.duration.hours,
                    },
                },
            });
            return;
        }

        // Navigate to booking page with service pre-selected
        navigate(`/book/${stylistId}`, {
            state: {
                selectedService: {
                    serviceId: service.name,
                    stylistId,
                    price: service.price,
                    depositAmount,
                    duration: service.duration,
                },
            },
        });

        // Show confirmation toast
        toast({
            title: "Service Selected",
            description: `You've selected ${service.name}. Complete your booking details.`,
            variant: "default",
        });
    };

    return (
        <Card className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                <h2 className="text-xl sm:text-2xl font-light text-[#3F0052] tracking-normal">
                    Services & Pricing
                </h2>

                {/* Deposit Information */}
                <div className="flex items-center gap-2 bg-gradient-to-r from-[#3F0052]/5 to-[#DFA801]/5 px-3 py-2 rounded-full border border-[#3F0052]/10">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger>
                                <AlertCircle className="w-4 h-4 text-[#3F0052]" />
                            </TooltipTrigger>
                            <TooltipContent>
                                <p className="max-w-xs">
                                    A deposit is required to secure your booking
                                </p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    <span className="text-sm text-[#3F0052] font-bold tracking-normal">
                        ${depositAmount} Deposit Required!
                    </span>
                </div>
            </div>

            <div className="space-y-4">
                {/* Services */}
                {displayedServices.map((service) => (
                    <div key={service.name} className="relative group">
                        {/* Service Card with Gradient Border */}
                        <div className="relative bg-white rounded-xl p-4 sm:p-6 border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 hover:border-[#3F0052]/20">
                            {/* Desktop Layout */}
                            <div className="hidden sm:flex items-center justify-between gap-6">
                                {/* Left Section: Service Info */}
                                <div className="flex items-center gap-4 flex-1">
                                    {/* Service Image - Fixed size for alignment */}
                                    <div className="flex-shrink-0">
                                        {service.imageUrl ? (
                                            <img
                                                src={
                                                    service.imageUrl ||
                                                    "/placeholder.svg"
                                                }
                                                alt={service.name}
                                                className="w-16 h-16 object-cover rounded-full border-2 border-gray-100 cursor-pointer hover:opacity-80 transition-opacity hover:border-[#3F0052]/30"
                                                onClick={() =>
                                                    setLightboxUrl(
                                                        service.imageUrl!
                                                    )
                                                }
                                            />
                                        ) : (
                                            <div className="w-16 h-16 bg-gradient-to-br from-[#3F0052]/10 to-[#DFA801]/10 rounded-full border-2 border-gray-100 flex items-center justify-center">
                                                <span className="text-[#3F0052] font-medium text-sm">
                                                    {service.name.charAt(0)}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Service Details */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="text-lg font-medium text-[#3F0052] tracking-normal truncate">
                                                {service.name}
                                            </h3>
                                            {service.description && (
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger>
                                                            <Info className="w-4 h-4 text-gray-400 hover:text-[#3F0052] transition-colors" />
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p className="max-w-xs">
                                                                {
                                                                    service.description
                                                                }
                                                            </p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            )}
                                        </div>
                                        <div className="flex items-center text-gray-500">
                                            <Clock className="w-4 h-4 mr-1" />
                                            <span className="text-sm tracking-normal">
                                                {service.duration.hours}h{" "}
                                                {service.duration.minutes}m
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Section: Price and Button */}
                                <div className="flex items-center gap-4 flex-shrink-0">
                                    {/* Price Tag */}
                                    <div className="relative">
                                        <div className="absolute -inset-2 bg-gradient-to-br from-[#3F0052]/5 to-[#DFA801]/5 rounded-full blur-sm" />
                                        <div className="relative bg-white px-4 py-2 rounded-full border border-[#3F0052]/10 shadow-sm">
                                            <span className="text-xl font-bold bg-gradient-to-r from-[#3F0052] to-[#DFA801] bg-clip-text text-transparent">
                                                ${service.price}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Book Button */}
                                    <Button
                                        onClick={() =>
                                            handleBookService(service)
                                        }
                                        className="rounded-full bg-gradient-to-r from-[#3F0052] to-[#DFA801] hover:from-[#3F0052]/90 hover:to-[#DFA801]/90 transition-all duration-300 text-base tracking-normal font-medium px-6 py-2 shadow-md hover:shadow-lg"
                                    >
                                        Book Now
                                    </Button>
                                </div>
                            </div>

                            {/* Mobile Layout */}
                            <div className="sm:hidden space-y-4">
                                {/* First Row: Image and Service Info */}
                                <div className="flex items-start gap-4">
                                    {/* Service Image - Fixed size for alignment */}
                                    <div className="flex-shrink-0">
                                        {service.imageUrl ? (
                                            <img
                                                src={
                                                    service.imageUrl ||
                                                    "/placeholder.svg"
                                                }
                                                alt={service.name}
                                                className="w-14 h-14 object-cover rounded-full border-2 border-gray-100 cursor-pointer hover:opacity-80 transition-opacity"
                                                onClick={() =>
                                                    setLightboxUrl(
                                                        service.imageUrl!
                                                    )
                                                }
                                            />
                                        ) : (
                                            <div className="w-14 h-14 bg-gradient-to-br from-[#3F0052]/10 to-[#DFA801]/10 rounded-full border-2 border-gray-100 flex items-center justify-center">
                                                <span className="text-[#3F0052] font-medium text-sm">
                                                    {service.name.charAt(0)}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Service Details */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="text-lg font-medium text-[#3F0052] tracking-normal">
                                                {service.name}
                                            </h3>
                                            {service.description && (
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger>
                                                            <Info className="w-4 h-4 text-gray-400" />
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p className="max-w-xs">
                                                                {
                                                                    service.description
                                                                }
                                                            </p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            )}
                                        </div>
                                        <div className="flex items-center text-gray-500">
                                            <Clock className="w-4 h-4 mr-1" />
                                            <span className="text-sm tracking-normal">
                                                {service.duration.hours}h{" "}
                                                {service.duration.minutes}m
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Second Row: Price and Button */}
                                <div className="flex items-center justify-between gap-4 pt-2 border-t border-gray-50">
                                    {/* Price Tag */}
                                    <div className="relative">
                                        <div className="absolute -inset-1 bg-gradient-to-br from-[#3F0052]/5 to-[#DFA801]/5 rounded-full blur-sm" />
                                        <div className="relative bg-white px-3 py-1.5 rounded-full border border-[#3F0052]/10 shadow-sm">
                                            <span className="text-lg font-bold bg-gradient-to-r from-[#3F0052] to-[#DFA801] bg-clip-text text-transparent">
                                                ${service.price}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Book Button */}
                                    <Button
                                        onClick={() =>
                                            handleBookService(service)
                                        }
                                        className="rounded-full bg-gradient-to-r from-[#3F0052] to-[#DFA801] hover:from-[#3F0052]/90 hover:to-[#DFA801]/90 transition-all duration-300 text-sm tracking-normal font-medium px-5 py-2 shadow-md hover:shadow-lg flex-1 max-w-[140px]"
                                    >
                                        Book Now
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Show More Button */}
                {hasMoreServices && (
                    <div className="text-center pt-4">
                        <Button
                            variant="ghost"
                            onClick={() => setShowAll(!showAll)}
                            className="text-[#3F0052] hover:text-white hover:bg-gradient-to-r hover:from-[#3F0052] hover:to-[#DFA801] transition-all duration-300 font-medium text-sm tracking-normal rounded-full px-6 py-2"
                        >
                            {showAll
                                ? "Show Less"
                                : `Show ${services.length - 3} More Services`}
                        </Button>
                    </div>
                )}

                {services.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        <div className="w-16 h-16 bg-gradient-to-br from-[#3F0052]/10 to-[#DFA801]/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                            <AlertCircle className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="tracking-normal text-lg">
                            No services available yet.
                        </p>
                        <p className="text-sm text-gray-400 mt-1">
                            Check back soon for new services!
                        </p>
                    </div>
                )}
            </div>

            {/* Lightbox for image preview */}
            {lightboxUrl && (
                <ImageLightbox
                    imageUrl={lightboxUrl}
                    onClose={() => setLightboxUrl(null)}
                />
            )}
        </Card>
    );
}
