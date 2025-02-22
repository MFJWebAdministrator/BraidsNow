import { useState, useEffect } from 'react';
import { useAuth } from './use-auth';
import { getStylistFavorites } from '@/lib/firebase/stylist/favorites';

interface FavoriteClient {
  id: string;
  name: string;
  email: string;
  profileImage?: string;
  city: string;
  state: string;
}

export function useStylistFavorites() {
  const { user } = useAuth();
  const [favoriteClients, setFavoriteClients] = useState<FavoriteClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!user) {
        setFavoriteClients([]);
        setLoading(false);
        return;
      }

      try {
        const favorites = await getStylistFavorites(user.uid);
        setFavoriteClients(favorites);
      } catch (err) {
        console.error('Error fetching favorite clients:', err);
        setError('Failed to load favorite clients');
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [user]);

  return {
    favoriteClients,
    loading,
    error
  };
}