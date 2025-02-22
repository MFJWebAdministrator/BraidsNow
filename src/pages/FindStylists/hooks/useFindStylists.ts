import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useFavorites } from '@/hooks/use-favorites';
import type { SearchParams, Stylist } from '../types';

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

  // Fetch all stylists on mount
  useEffect(() => {
    const fetchStylists = async () => {
      try {
        const stylistsRef = collection(db, 'stylists');
        const querySnapshot = await getDocs(stylistsRef);
        
        const stylistsData = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: `${data.firstName} ${data.lastName}`,
            username: data.username,
            businessName: data.businessName,
            introduction: data.introduction,
            location: `${data.city}, ${data.state}`,
            zipCode: data.zipCode,
            city: data.city,
            state: data.state,
            servicePreference: data.servicePreference,
            image: data.profileImage || 'https://images.unsplash.com/photo-1605980776566-0486c3ac7617?auto=format&fit=crop&q=80',
            availability: 'Available',
            depositAmount: parseFloat(data.depositAmount) || 0,
            price: {
              from: data.services?.length > 0 
                ? Math.min(...data.services.map((s: any) => s.price))
                : 50,
              to: data.services?.length > 0
                ? Math.max(...data.services.map((s: any) => s.price))
                : 200
            },
            socialMedia: {
              instagram: data.instagram,
              facebook: data.facebook
            },
            services: data.services || [],
            // Mark as favorite if in favorites list
            isFavorite: favorites.some(fav => fav.id === doc.id)
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
    };

    fetchStylists();
  }, [favorites]); // Re-run when favorites change

  // Filter stylists whenever search parameters change
  useEffect(() => {
    const filtered = allStylists.filter(stylist => {
      const matchBusinessName = searchParams.businessName 
        ? stylist.businessName.toLowerCase().includes(searchParams.businessName.toLowerCase())
        : true;

      const matchStyles = searchParams.styles
        ? stylist.services.some(service => 
            service.name.toLowerCase().includes(searchParams.styles.toLowerCase())
          )
        : true;

      const searchLocation = searchParams.location.toLowerCase();
      const matchLocation = searchParams.location
        ? stylist.city.toLowerCase().includes(searchLocation) ||
          stylist.state.toLowerCase().includes(searchLocation) ||
          stylist.zipCode.includes(searchLocation) ||
          `${stylist.city}, ${stylist.state}`.toLowerCase().includes(searchLocation)
        : true;

      return matchBusinessName && matchStyles && matchLocation;
    });

    setFilteredStylists(filtered);
  }, [searchParams, allStylists]);

  const handleToggleFavorite = (id: string) => {
    const stylist = allStylists.find(s => s.id === id);
    if (stylist) {
      toggleFav(stylist);
    }
  };

  const handleViewProfile = (stylistId: string) => {
    navigate(`/stylist/${stylistId}`);
  };

  return {
    stylists: filteredStylists,
    loading,
    error,
    searchParams,
    setSearchParams,
    handleToggleFavorite,
    handleViewProfile
  };
}