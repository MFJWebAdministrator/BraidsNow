import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
    collection,
    getDocs,
    onSnapshot,
    query,
    where,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useFavorites } from "@/hooks/use-favorites";
import type { SearchParams, Stylist } from "../types";
import axios from "axios";
import { SubscriptionStatus } from "@/hooks/use-subscription";
const API_BASE_URL = import.meta.env.VITE_API_URL;

export function useFindStylists() {
  const navigate = useNavigate();
  const { favorites, toggleFavorite: toggleFav } = useFavorites();
  const [allStylists, setAllStylists] = useState<Stylist[]>([]);
  const [filteredStylists, setFilteredStylists] = useState<Stylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useState<SearchParams>({
    businessName: '',
    styles: '',
    location: ''
  });

    // Fetch stylists function - extracted for reuse
    const fetchStylists = useCallback(async () => {
        try {
            setLoading(false);
            const stylistsRef = collection(db, "stylists");
            const q = query(
                stylistsRef,
                where("subscription.status", "==", "active")
            );

            const querySnapshot = await getDocs(q);
            // Check each stylist's Stripe account status
            const filteredDocs = [];
            for (const doc of querySnapshot.docs) {
                try {
                    const response = await axios.post(
                        `${API_BASE_URL}/get-stripe-account-details`,
                        {
                            stylistId: doc.id,
                        },
                        {
                            headers: {
                                "Content-Type": "application/json",
                            },
                        }
                    );

                    const subscriptionStatus: SubscriptionStatus =
                        response.data;

                    // Only include stylists with active Stripe accounts
                    if (subscriptionStatus.status === "active") {
                        filteredDocs.push(doc);
                    }
                } catch (error) {
                    console.error(
                        "Error checking Stripe account for stylist:",
                        doc.id,
                        error
                    );
                    // Skip this stylist if there's an error
                }
            }

            const stylistsData = filteredDocs.map((doc) => {
                const data = doc.data();

                return {
                    id: doc.id,
                    name: `${data.firstName} ${data.lastName}`,
                    username: data.username || "",
                    businessName: data.businessName || "",
                    introduction: data.introduction || "",
                    location: `${data.city || ""}, ${data.state || ""}`,
                    zipCode: data.zipCode || "",
                    city: data.city || "",
                    state: data.state || "",
                    servicePreference: data.servicePreference || "shop",
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
                                          (s: any) => parseFloat(s.price) || 0
                                      )
                                  )
                                : 50,
                        to:
                            data.services?.length > 0
                                ? Math.max(
                                      ...data.services.map(
                                          (s: any) => parseFloat(s.price) || 0
                                      )
                                  )
                                : 200,
                    },
                    socialMedia: {
                        instagram: data.instagram || "",
                        facebook: data.facebook || "",
                    },
                    services: data.services || [],
                    // Mark as favorite if in favorites list
                    isFavorite: favorites.some((fav) => fav.id === doc.id),
                } as Stylist;
            });

      setAllStylists(stylistsData);
      setFilteredStylists(stylistsData);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching stylists:', err);
      setError('Failed to load stylists');
      setLoading(false);
    }
  }, [favorites]);

  // Initial fetch and setup real-time listener
  useEffect(() => {
    fetchStylists();
    
    // Set up real-time listener for stylists collection
    const stylistsRef = collection(db, 'stylists');
    const q = query(stylistsRef);
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        fetchStylists();
      }
    }, (err) => {
      console.error('Error in stylists listener:', err);
      setError('Failed to listen for stylist updates');
    });
    
    // Clean up listener on unmount
    return () => unsubscribe();
  }, [fetchStylists]);

  // Filter stylists whenever search parameters change
  useEffect(() => {
    const filtered = allStylists.filter(stylist => {
      const matchBusinessName = searchParams.businessName 
        ? stylist.businessName?.toLowerCase().includes(searchParams.businessName.toLowerCase())
        : true;

      const matchStyles = searchParams.styles
        ? stylist.services?.some(service => 
            service.name?.toLowerCase().includes(searchParams.styles.toLowerCase())
          )
        : true;

      const searchLocation = searchParams.location.toLowerCase();
      const matchLocation = searchParams.location
        ? stylist.city?.toLowerCase().includes(searchLocation) ||
          stylist.state?.toLowerCase().includes(searchLocation) ||
          stylist.zipCode?.includes(searchLocation) ||
          `${stylist.city}, ${stylist.state}`.toLowerCase().includes(searchLocation)
        : true;

      return matchBusinessName && matchStyles && matchLocation;
    });

    setFilteredStylists(filtered);
  }, [searchParams, allStylists]);

  // Improved handleToggleFavorite for real-time UI updates
  const handleToggleFavorite = (id: string) => {
    if (!id) {
      console.error('Cannot toggle favorite: Invalid stylist ID');
      return;
    }
    
    const stylist = allStylists.find(s => s.id === id);
    if (stylist) {
      // First update local state for immediate UI feedback
      const newIsFavorite = !stylist.isFavorite;
      
      // Update both allStylists and filteredStylists for consistent UI
      setAllStylists(prev => 
        prev.map(s => s.id === id ? {...s, isFavorite: newIsFavorite} : s)
      );
      
      setFilteredStylists(prev => 
        prev.map(s => s.id === id ? {...s, isFavorite: newIsFavorite} : s)
      );
      
      // Make sure the stylist object has all required fields
      const validStylist = {
        ...stylist,
        id: stylist.id,
        name: stylist.name || '',
        businessName: stylist.businessName || '',
        image: stylist.image || ''
      };
      
      // Then call the toggle function from the hook
      try {
        toggleFav(validStylist);
      } catch (error) {
        console.error('Error toggling favorite:', error);
        // Revert UI changes if the backend operation fails
        setAllStylists(prev => 
          prev.map(s => s.id === id ? {...s, isFavorite: !newIsFavorite} : s)
        );
        setFilteredStylists(prev => 
          prev.map(s => s.id === id ? {...s, isFavorite: !newIsFavorite} : s)
        );
      }
    }
  };

  const handleViewProfile = (stylistId: string) => {
    navigate(`/stylist/${stylistId}`);
  };

  // Add a manual refresh function
  const refreshStylists = () => {
    fetchStylists();
  };

  return {
    stylists: filteredStylists,
    loading,
    error,
    searchParams,
    setSearchParams,
    handleToggleFavorite,
    handleViewProfile,
    refreshStylists
  };
}