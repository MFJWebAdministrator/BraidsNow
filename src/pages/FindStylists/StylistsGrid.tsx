import { Loader2, Search } from 'lucide-react';
import { StylistCard } from './StylistCard';
import type { Stylist } from './types';

interface StylistsGridProps {
  stylists: Stylist[];
  loading: boolean;
  error: string | null;
  onToggleFavorite: (id: string) => void;
  onViewProfile: (id: string) => void;
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
      <div className="flex justify-center items-center py-20">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#3F0052] mx-auto mb-4" />
          <p className="text-gray-600 tracking-normal">Loading stylists...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 bg-red-50 rounded-lg">
        <p className="text-red-600 tracking-normal">{error}</p>
      </div>
    );
  }

  if (stylists.length === 0) {
    return (
      <div className="text-center py-16 px-4">
        <div className="bg-gray-50 rounded-2xl p-8 max-w-2xl mx-auto">
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
  );
}