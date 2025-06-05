import { useState } from "react";
import {
    Heart,
    MapPin,
    Star,
    Home,
    Scissors,
    Store,
    MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { useFavorites } from "@/hooks/use-favorites";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router-dom";
import { MessageDialog } from "@/components/MessageDialog";
import type { Stylist } from "@/pages/FindStylists/types";
import { useReviews } from "@/hooks/use-reviews";
import { SocialShare } from "@/components/ui/social-share";

const VITE_APP_DOMAIN = import.meta.env.VITE_APP_DOMAIN;

interface ProfileHeaderProps {
    stylist: Stylist;
}

export function ProfileHeader({ stylist }: ProfileHeaderProps) {
    const [showMessageDialog, setShowMessageDialog] = useState(false);
    const { toggleFavorite, isFavorite } = useFavorites();
    const { user } = useAuth();
    const navigate = useNavigate();
    const isFavorited = isFavorite(stylist.id);
    const { averageRating, reviews } = useReviews(stylist.id);

    // const handleBookNow = () => {
    //   if (!user) {
    //     navigate('/login', { state: { from: `/book/${stylist.id}` } });
    //     return;
    //   }
    //   navigate(`/book/${stylist.id}`);
    // };

    const handleMessageClick = () => {
        if (!user) {
            navigate("/login", { state: { from: `/stylist/${stylist.id}` } });
            return;
        }
        setShowMessageDialog(true);
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
            <Card className="p-8 relative overflow-hidden">
                {/* Gradient Background */}
                <div className="absolute inset-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#3F0052]/5 via-transparent to-[#DFA801]/5" />
                    <div className="absolute top-0 right-0 w-96 h-96 bg-[#DFA801]/5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#3F0052]/5 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl" />
                </div>

                {/* Content */}
                <div className="relative">
                    <div className="flex flex-col md:flex-row items-start gap-8">
                        <Avatar className="w-32 h-32 rounded-full border-4 border-white shadow-xl">
                            <AvatarImage
                                src={stylist.image}
                                alt={stylist.name}
                            />
                            <AvatarFallback>{stylist.name[0]}</AvatarFallback>
                        </Avatar>

                        <div className="flex-1">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div>
                                    <h1 className="text-3xl font-light text-[#3F0052] tracking-normal">
                                        {stylist.businessName}
                                    </h1>
                                    <p className="text-gray-600 tracking-normal">
                                        {stylist.name}
                                    </p>

                                    <div className="flex flex-wrap items-center mt-2 gap-4">
                                        <div className="flex items-center">
                                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                            <span className="ml-1 text-sm font-medium">
                                                {averageRating}
                                            </span>
                                            <span className="text-[#3F0052] ml-1">
                                                ({reviews.length} reviews)
                                            </span>
                                        </div>
                                        <div className="flex items-center text-gray-600">
                                            <MapPin className="w-4 h-4 mr-1" />
                                            <span className="text-sm">
                                                {stylist.location}
                                            </span>
                                        </div>
                                        <div className="flex items-center text-gray-600">
                                            {getServicePreferenceIcon()}
                                            <span className="text-sm">
                                                {getServicePreferenceText()}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-3">
                                    <SocialShare
                                        url={`${VITE_APP_DOMAIN}/stylist/${stylist.id}`}
                                        title={`Check out ${stylist.businessName} on BraidsNow.com!`}
                                        description={`${stylist.businessName} - Professional Hair Stylist in ${stylist.location}. ${stylist.introduction || "Specializing in beautiful braided hairstyles."}`}
                                        image={stylist.image}
                                    />
                                    <Button
                                        variant="outline"
                                        size="lg"
                                        className="rounded-full"
                                        onClick={() => toggleFavorite(stylist)}
                                    >
                                        <Heart
                                            className={`w-4 h-4 mr-2 ${isFavorited ? "fill-red-500 text-red-500" : ""}`}
                                        />
                                        {isFavorited ? "My Fav!" : "Favorite"}
                                    </Button>
                                    <Button
                                        size="lg"
                                        className="rounded-full"
                                        onClick={handleMessageClick}
                                    >
                                        <MessageSquare className="w-4 h-4 mr-2" />
                                        Message Me
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            <MessageDialog
                isOpen={showMessageDialog}
                onClose={() => setShowMessageDialog(false)}
                recipientId={stylist.id}
                recipientName={stylist.name}
            />
        </>
    );
}
