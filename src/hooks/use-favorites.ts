import { useState, useEffect } from "react";
import { useAuth } from "./use-auth";
import { useToast } from "./use-toast";
import {
    addToFavorites,
    removeFromFavorites,
    getFavoriteStylists,
} from "@/lib/firebase/client/favorites";
import type { Stylist } from "@/pages/FindStylists/types";

export function useFavorites() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [favorites, setFavorites] = useState<Stylist[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch favorites on mount and when user changes
    useEffect(() => {
        const fetchFavorites = async () => {
            if (!user) {
                setFavorites([]);
                setLoading(false);
                return;
            }

            try {
                const favoriteStylists = await getFavoriteStylists(user.uid);
                setFavorites(favoriteStylists);
            } catch (error) {
                console.error("Error fetching favorites:", error);
                toast({
                    title: "Error",
                    description: "Failed to load favorite stylists",
                    variant: "destructive",
                });
            } finally {
                setLoading(false);
            }
        };

        fetchFavorites();
    }, [user, toast]);

    // TODO
    const toggleFavorite = async (stylist: Stylist) => {
        if (!user) {
            toast({
                title: "Sign in required",
                description: "Please sign in to save favorites",
                variant: "destructive",
            });
            return;
        }

        try {
            const isFavorite = favorites.some((fav) => fav.id === stylist.id);

            if (isFavorite) {
                setFavorites((prev) =>
                    prev.filter((fav) => fav.id !== stylist.id)
                );
                await removeFromFavorites(user.uid, stylist.id);

                toast({
                    title: "Removed from favorites",
                    description: `${stylist.businessName} has been removed from your favorites`,
                });
            } else {
                setFavorites((prev) => [
                    ...prev,
                    { ...stylist, isFavorite: true },
                ]);
                await addToFavorites(user.uid, stylist.id);

                toast({
                    title: "Added to favorites",
                    description: `${stylist.businessName} has been added to your favorites`,
                });
            }
        } catch (error) {
            // console.error("Error toggling favorite:", error);
            // toast({
            //     title: "Error",
            //     description: "Failed to update favorites",
            //     variant: "destructive",
            // });
        }
    };

    return {
        favorites,
        loading,
        toggleFavorite,
        isFavorite: (stylistId: string) =>
            favorites.some((fav) => fav.id === stylistId),
    };
}
