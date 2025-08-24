import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useFavorites } from "@/hooks/use-favorites";
import type { Stylist, SearchParams, PaginationParams } from "../types";

const API_BASE_URL = import.meta.env.VITE_API_URL;

export function useFindStylists() {
    const navigate = useNavigate();
    const { favorites, toggleFavorite: toggleFav } = useFavorites();
    const [stylists, setStylists] = useState<Stylist[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const isInitialLoad = useRef(true);
    const [searchParams, setSearchParams] = useState<SearchParams>({
        businessName: "",
        braidStyle: "",
        location: "",
        servicePreference: [],
        minDepositAmount: 1,
        maxDepositAmount: 500,
    });
    const [pagination, setPagination] = useState<PaginationParams>({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        pageSize: 6,
        hasNextPage: false,
        hasPreviousPage: false,
    });

    // Fetch stylists from backend API
    const fetchStylists = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/search-stylists`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...searchParams,
                    page: pagination.currentPage,
                    pageSize: pagination.pageSize,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to load stylists");
            }
            const result = await response.json();

            const stylistsWithFavs: Stylist[] = (result.data || []).map(
                (s: Stylist) => ({
                    ...s,
                    isFavorite: favorites.some((fav) => fav.id === s.id),
                })
            );

            console.log("stylists", stylistsWithFavs);

            setStylists(stylistsWithFavs);
            setPagination(result.pagination);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching stylists:", err);
            setError("Failed to load stylists");
            setLoading(false);
        }
    }, [favorites, searchParams, pagination.currentPage, pagination.pageSize]);

    // Initial fetch and setup real-time listener
    useEffect(() => {
        console.log("initial");
        fetchStylists();
    }, [fetchStylists]);

    // Mark initial load as complete after first fetch
    useEffect(() => {
        console.log("second load");
        if (isInitialLoad.current && !loading && stylists.length > 0) {
            isInitialLoad.current = false;
        }
    }, [loading, stylists.length]);

    // Refetch when searchParams change
    useEffect(() => {
        console.log("params changed", searchParams);
        fetchStylists();
        // Scroll to top when search parameters change (but not on initial load)
        if (!isInitialLoad.current) {
            const resultsSection = document.querySelector(
                "[data-results-section]"
            );
            if (resultsSection) {
                setTimeout(() => {
                    resultsSection.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                    });
                }, 100);
            }
        }
    }, [searchParams, fetchStylists]);

    // Scroll to top when page changes
    useEffect(() => {
        console.log("pagination changed", pagination);
        // Scroll to the top of the results section smoothly (but not on initial load)
        if (!isInitialLoad.current) {
            const resultsSection = document.querySelector(
                "[data-results-section]"
            );
            if (resultsSection) {
                // Add a small delay to ensure the new content is rendered
                setTimeout(() => {
                    resultsSection.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                    });
                }, 100);
            } else {
                // Fallback to scrolling to top of page
                window.scrollTo({
                    top: 0,
                    behavior: "smooth",
                });
            }
        }
    }, [pagination.currentPage]);

    // Improved handleToggleFavorite for real-time UI updates
    const handleToggleFavorite = (id: string) => {
        if (!id) {
            console.error("Cannot toggle favorite: Invalid stylist ID");
            return;
        }

        const stylist = stylists.find((s) => s.id === id);
        if (stylist) {
            // First update local state for immediate UI feedback
            const newIsFavorite = !stylist.isFavorite;

            // Update both allStylists and filteredStylists for consistent UI
            setStylists((prev) =>
                prev.map((s) =>
                    s.id === id ? { ...s, isFavorite: newIsFavorite } : s
                )
            );

            // Make sure the stylist object has all required fields
            const validStylist = {
                ...stylist,
                id: stylist.id,
                name: stylist.name || "",
                businessName: stylist.businessName || "",
                image: stylist.image || "",
            };

            // Then call the toggle function from the hook
            try {
                toggleFav(validStylist);
            } catch (error) {
                console.error("Error toggling favorite:", error);
                // Revert UI changes if the backend operation fails
                setStylists((prev) =>
                    prev.map((s) =>
                        s.id === id ? { ...s, isFavorite: !newIsFavorite } : s
                    )
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
        stylists,
        loading,
        error,
        searchParams,
        setSearchParams,
        pagination,
        setPagination,
        handleToggleFavorite,
        handleViewProfile,
        refreshStylists,
    };
}
