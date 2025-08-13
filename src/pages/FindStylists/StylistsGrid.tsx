import { Search, Users } from "lucide-react";
import { StylistCard } from "./StylistCard";
import type { PaginationParams, Stylist } from "./types";
import { Pagination } from "@/components/ui/pagination";

interface StylistsGridProps {
    stylists: Stylist[];
    loading: boolean;
    error: string | null;
    onToggleFavorite: (id: string) => void;
    onViewProfile: (id: string) => void;
    pagination?: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        pageSize: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    };
    setPagination: (pagination: PaginationParams) => void;
}

// Skeleton component for loading state
function StylistCardSkeleton() {
    return (
        <div className="group">
            <div className="bg-white rounded-3xl p-6 transition-all duration-300 relative overflow-hidden">
                {/* Gradient Background Skeleton */}
                <div className="absolute inset-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-transparent to-gray-50" />
                    <div className="absolute top-0 right-0 w-96 h-96 bg-gray-50 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-gray-50 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl" />
                </div>

                {/* Content */}
                <div className="relative">
                    {/* Header with Avatar and Actions */}
                    <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center space-x-4">
                            {/* Avatar skeleton */}
                            <div className="w-20 h-20 rounded-full bg-gray-200 animate-pulse border-4 border-white shadow-xl" />
                            <div className="flex-1">
                                {/* Business name */}
                                <div className="h-6 w-48 bg-gray-200 rounded mb-2 animate-pulse" />
                                {/* Stylist name */}
                                <div className="h-4 w-32 bg-gray-200 rounded mb-2 animate-pulse" />
                                {/* Reviews */}
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="h-4 w-4 bg-yellow-200 rounded animate-pulse" />
                                    <div className="h-4 w-8 bg-gray-200 rounded animate-pulse" />
                                    <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                                </div>
                                {/* Location */}
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
                                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                                </div>
                                {/* Service preference */}
                                <div className="flex items-center gap-2">
                                    <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
                                    <div className="h-4 w-28 bg-gray-200 rounded animate-pulse" />
                                </div>
                            </div>
                        </div>
                        {/* Favorite button skeleton */}
                        <div className="w-9 h-9 rounded-full bg-gray-100 animate-pulse" />
                    </div>
                </div>

                {/* Services List skeleton */}
                <div className="flex justify-left mb-4">
                    <div className="flex flex-wrap gap-2">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div
                                key={i}
                                className="h-8 w-20 bg-gray-100 rounded-full animate-pulse"
                            />
                        ))}
                    </div>
                </div>

                {/* Price and availability section */}
                <div className="flex items-center justify-between py-4 mt-4 border-y border-gray-100">
                    <div>
                        <div className="h-3 w-20 bg-gray-200 rounded mb-1 animate-pulse" />
                        <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
                    </div>
                    <div className="text-right">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="h-4 w-4 bg-green-200 rounded animate-pulse" />
                            <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                        </div>
                        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                    </div>
                </div>

                {/* Action Buttons skeleton */}
                <div className="flex gap-3 mt-4">
                    <div className="flex-1 h-10 bg-gray-100 rounded-full animate-pulse" />
                    <div className="flex-1 h-10 bg-gray-200 rounded-full animate-pulse" />
                </div>
            </div>
        </div>
    );
}

export function StylistsGrid({
    stylists,
    loading,
    error,
    onToggleFavorite,
    onViewProfile,
    pagination,
    setPagination,
}: StylistsGridProps) {
    if (loading) {
        return (
            <div className="space-y-8">
                {/* Results header skeleton */}
                <div className="text-center">
                    <div className="h-8 w-64 bg-gray-200 rounded mx-auto mb-2 animate-pulse" />
                    <div className="h-4 w-96 bg-gray-100 rounded mx-auto animate-pulse" />
                </div>

                {/* Stylists grid skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {Array.from({ length: pagination?.pageSize || 6 }).map(
                        (_, index) => (
                            <div
                                key={index}
                                className="animate-in fade-in-0 slide-in-from-bottom-4"
                                style={{
                                    animationDelay: `${index * 100}ms`,
                                    animationDuration: "500ms",
                                }}
                            >
                                <StylistCardSkeleton />
                            </div>
                        )
                    )}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-16 px-4">
                <div className="bg-gray-50 rounded-2xl p-8 max-w-2xl mx-auto border border-gray-100">
                    <div className="bg-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6 shadow-md">
                        <Users className="w-8 h-8 text-red-500" />
                    </div>
                    <h3 className="text-2xl font-light text-[#3F0052] mb-3 tracking-normal">
                        Oops! Something went wrong
                    </h3>
                    <p className="text-black text-md tracking-normal mb-6">
                        {error}
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="bg-[#3F0052] text-white px-6 py-3 rounded-lg hover:bg-[#6B0F8C] transition-colors tracking-normal"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    if (stylists.length === 0) {
        return (
            <div className="text-center py-16 px-4">
                <div className="bg-gray-50 rounded-2xl p-8 max-w-2xl mx-auto border border-gray-100">
                    <div className="bg-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6 shadow-md">
                        <Search className="w-8 h-8 text-[#3F0052]" />
                    </div>
                    <h3 className="text-2xl font-light text-[#3F0052] mb-3 tracking-normal">
                        No Stylists Found!
                    </h3>
                    <p className="text-black text-md tracking-normal mb-4 max-w-md mx-auto">
                        Try adjusting your search criteria:
                    </p>
                    <ul className="text-left max-w-md mx-auto space-y-2 text-gray-600 tracking-normal">
                        <li className="flex items-center">
                            <span className="w-2 h-2 bg-[#3F0052] rounded-full mr-2"></span>
                            Check the spelling of the business name
                        </li>
                        <li className="flex items-center">
                            <span className="w-2 h-2 bg-[#3F0052] rounded-full mr-2 tracking-normal"></span>
                            Try searching for a different hairstyle
                        </li>
                        <li className="flex items-center">
                            <span className="w-2 h-2 bg-[#3F0052] rounded-full mr-2 tracking-normal"></span>
                            Expand your location search or try a nearby city
                        </li>
                    </ul>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Results header */}
            <div className="text-center">
                <h3 className="text-2xl font-light text-[#3F0052] mb-2 tracking-normal">
                    Found {pagination?.totalItems ?? stylists.length} Amazing
                    Stylist
                    {(pagination?.totalItems ?? stylists.length) !== 1
                        ? "s"
                        : ""}
                </h3>
                <p className="text-gray-600 tracking-normal">
                    Discover talented stylists ready to create your perfect look
                </p>
            </div>

            {/* Stylists grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {stylists.map((stylist) => (
                    <StylistCard
                        key={stylist.id}
                        stylist={stylist}
                        onToggleFavorite={onToggleFavorite}
                        onViewProfile={onViewProfile}
                    />
                ))}
            </div>

            {/* Pagination */}
            {pagination && setPagination && (
                <div className="mt-8">
                    <Pagination
                        pagination={pagination}
                        onPaginationChange={setPagination}
                    />
                </div>
            )}
        </div>
    );
}
