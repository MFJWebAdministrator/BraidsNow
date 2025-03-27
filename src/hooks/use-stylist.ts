import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

interface Stylist {
  id: string;
  firstName: string;
  lastName: string;
  businessName?: string;
  email?: string;
  phone?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  profileImage?: string;
  services?: Array<{
    name: string;
    price: number;
    duration: number;
    description?: string;
  }>;
  availability?: {
    [key: string]: {
      start: string;
      end: string;
      isAvailable: boolean;
    }[];
  };
  depositAmount?: number;
  [key: string]: any;
}

export function useStylist(stylistId: string) {
  const [stylist, setStylist] = useState<Stylist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStylist() {
      if (!stylistId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const stylistRef = doc(db, 'stylists', stylistId);
        const stylistDoc = await getDoc(stylistRef);

        if (stylistDoc.exists()) {
          const stylistData = stylistDoc.data();
          setStylist({
            id: stylistDoc.id,
            ...stylistData,
          } as Stylist);
        } else {
          setError('Stylist not found');
        }
      } catch (err) {
        console.error('Error fetching stylist:', err);
        setError('Failed to load stylist information');
      } finally {
        setLoading(false);
      }
    }

    fetchStylist();
  }, [stylistId]);

  return { stylist, loading, error };
}