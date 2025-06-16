import {
    doc,
    setDoc,
    deleteDoc,
    collection,
    query,
    where,
    getDocs,
    getDoc,
} from "firebase/firestore";
import { db } from "../config";
import type { Stylist } from "@/pages/FindStylists/types";

export async function addToFavorites(userId: string, stylistId: string) {
    const favoriteId = `${userId}_${stylistId}`;
    const favoriteRef = doc(db, "favorites", favoriteId);

    await setDoc(favoriteRef, {
        userId,
        stylistId,
        createdAt: new Date().toISOString(),
    });
}

export async function removeFromFavorites(userId: string, stylistId: string) {
    const favoriteId = `${userId}_${stylistId}`;
    const favoriteRef = doc(db, "favorites", favoriteId);

    await deleteDoc(favoriteRef);
}

export async function getFavoriteStylists(userId: string): Promise<Stylist[]> {
    try {
        // Get all favorites for the user
        const favoritesRef = collection(db, "favorites");
        const q = query(favoritesRef, where("userId", "==", userId));
        const querySnapshot = await getDocs(q);

        // Get all stylist IDs from favorites
        const stylistIds = querySnapshot.docs.map(
            (doc) => doc.data().stylistId
        );

        // Fetch each stylist's data
        const stylistsData = await Promise.all(
            stylistIds.map(async (stylistId) => {
                const stylistDoc = await getDoc(doc(db, "stylists", stylistId));
                if (stylistDoc.exists()) {
                    const data = stylistDoc.data();
                    return {
                        id: stylistDoc.id,
                        name: `${data.firstName} ${data.lastName}`,
                        username: data.username,
                        businessName: data.businessName,
                        introduction: data.introduction,
                        location: `${data.city}, ${data.state}`,
                        city: data.city,
                        state: data.state,
                        zipCode: data.zipCode,
                        servicePreference: data.servicePreference,
                        image:
                            data.profileImage ||
                            "https://images.unsplash.com/photo-1605980776566-0486c3ac7617?auto=format&fit=crop&q=80",
                        availability: "Available",
                        depositAmount: parseFloat(data.depositAmount) || 0,
                        price: {
                            from:
                                data.services?.length > 0
                                    ? Math.min(
                                          ...data.services.map(
                                              (s: any) => s.price
                                          )
                                      )
                                    : 50,
                            to:
                                data.services?.length > 0
                                    ? Math.max(
                                          ...data.services.map(
                                              (s: any) => s.price
                                          )
                                      )
                                    : 200,
                        },
                        socialMedia: {
                            instagram: data.instagram,
                            facebook: data.facebook,
                        },
                        services: data.services || [],
                        isFavorite: true,
                    } as Stylist;
                }
                return null;
            })
        );

        return stylistsData.filter(
            (stylist): stylist is Stylist => stylist !== null
        );
    } catch (error) {
        console.error("Error fetching favorite stylists:", error);
        throw error;
    }
}
