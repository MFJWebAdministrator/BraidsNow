import React from 'react';
import { Heart } from 'lucide-react';
import { useFavorites } from '@/hooks/use-favorites';
import { StylistCard } from '@/pages/FindStylists/StylistCard';
import { useNavigate } from 'react-router-dom';

export function FavoritesContent() {
  const { favorites, loading, toggleFavorite } = useFavorites();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3F0052]" />
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="text-center py-16 px-4">
        <div className="bg-gray-50 rounded-2xl p-8 max-w-2xl mx-auto">
          <div className="bg-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6 shadow-md">
            <Heart className="w-8 h-8 text-[#3F0052]" />
          </div>
          <h3 className="text-2xl font-light text-[#3F0052] mb-3 tracking-normal">
            No Favorite Stylists Yet
          </h3>
          <p className="text-gray-600 tracking-normal max-w-md mx-auto">
            Start adding stylists to your favorites by clicking the heart icon on their profile.
            Your favorite stylists will appear here for quick access.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {favorites.map((stylist) => (
        <StylistCard
          key={stylist.id}
          stylist={{ ...stylist, isFavorite: true }}
          onToggleFavorite={() => toggleFavorite(stylist)}
          onViewProfile={() => navigate(`/stylist/${stylist.id}`)}
        />
      ))}
    </div>
  );
}