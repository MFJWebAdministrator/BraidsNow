import { Loader2, Search, Users } from 'lucide-react';
import { StylistCard } from './StylistCard';
import type { Stylist } from './types';

interface StylistsGridProps {
  stylists: Stylist[];
  loading: boolean;
  error: string | null;
  onToggleFavorite: (id: string) => void;
  onViewProfile: (id: string) => void;
}

// Skeleton component for loading state
function StylistCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col justify-between min-h-[410px]">
      {/* Top section: Avatar and info */}
      <div className="p-6 pb-2 flex items-start gap-4">
        {/* Avatar */}
        <div className="w-16 h-16 rounded-full bg-gray-200 animate-pulse" />
        <div className="flex-1">
          {/* Name */}
          <div className="h-5 w-2/3 bg-gray-200 rounded mb-2 animate-pulse" />
          {/* Subname */}
          <div className="h-4 w-1/2 bg-gray-200 rounded mb-2 animate-pulse" />
          {/* Reviews */}
          <div className="flex items-center gap-2 mb-2">
            <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
          </div>
          {/* Location & Role */}
          <div className="flex items-center gap-2 mb-1">
            <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
        {/* Favorite icon placeholder */}
        <div className="w-6 h-6 rounded-full bg-gray-100 animate-pulse ml-2" />
      </div>
      {/* Tags */}
      <div className="flex flex-wrap gap-2 px-6 pb-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-7 w-24 bg-gray-100 rounded-full animate-pulse" />
        ))}
      </div>
      {/* Divider */}
      <div className="border-t border-gray-100 my-2" />
      {/* Price, availability, deposit */}
      <div className="flex items-center justify-between px-6 py-2">
        <div>
          <div className="h-3 w-16 bg-gray-100 rounded mb-1 animate-pulse" />
          <div className="h-6 w-20 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="flex flex-col items-end">
          <div className="h-4 w-16 bg-gray-100 rounded mb-1 animate-pulse" />
          <div className="h-4 w-14 bg-gray-100 rounded animate-pulse" />
        </div>
      </div>
      {/* Buttons */}
      <div className="flex gap-3 px-6 pb-6 pt-2">
        <div className="flex-1 h-10 bg-gray-100 rounded-full animate-pulse" />
        <div className="flex-1 h-10 bg-gray-200 rounded-full animate-pulse" />
      </div>
    </div>
  );
}

export function StylistsGrid({ 
  stylists, 
  loading, 
  error,
  onToggleFavorite,
  onViewProfile 
}: StylistsGridProps) {
  if (loading) {
    return (
      <div className="space-y-8">
        {/* Loading header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#3F0052] to-[#6B0F8C] rounded-full mb-4">
            <Users className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-2xl font-light text-[#3F0052] mb-2 tracking-normal">
            Finding Amazing Stylists
          </h3>
          <p className="text-gray-600 tracking-normal">
            Discovering talented stylists in your area...
          </p>
        </div>

        {/* Skeleton grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.from({ length: 6 }).map((_, index) => (
            <StylistCardSkeleton key={index} />
          ))}
        </div>

        {/* Loading indicator */}
        <div className="flex justify-center items-center py-8">
          <div className="flex items-center space-x-3">
            <Loader2 className="w-6 h-6 animate-spin text-[#3F0052]" />
            <span className="text-gray-600 tracking-normal">Loading stylists...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 rounded-2xl p-8 max-w-2xl mx-auto border border-red-100">
          <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
            <Search className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-2xl font-light text-red-600 mb-3 tracking-normal">
            Oops! Something went wrong
          </h3>
          <p className="text-red-600 tracking-normal mb-4">{error}</p>
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
          Found {stylists.length} Amazing Stylist{stylists.length !== 1 ? 's' : ''}
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
    </div>
  );
}