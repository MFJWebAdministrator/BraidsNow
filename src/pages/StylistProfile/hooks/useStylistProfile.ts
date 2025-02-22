import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Stylist } from '@/pages/FindStylists/types';
import type { Schedule } from '@/lib/schemas/schedule';

export function useStylistProfile(stylistId: string) {
  const [stylist, setStylist] = useState<Stylist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStylist = async () => {
      try {
        const stylistRef = doc(db, 'stylists', stylistId);
        const scheduleRef = doc(db, 'stylists', stylistId, 'settings', 'schedule');
        
        const [stylistDoc, scheduleDoc] = await Promise.all([
          getDoc(stylistRef),
          getDoc(scheduleRef)
        ]);

        if (stylistDoc.exists()) {
          const data = stylistDoc.data();
          setStylist({
            id: stylistDoc.id,
            name: `${data.firstName} ${data.lastName}`,
            username: data.username,
            businessName: data.businessName,
            introduction: data.introduction || '',
            specialInstructions: data.specialInstructions || '',
            policyAndProcedures: data.policyAndProcedures || '',
            location: `${data.city}, ${data.state}`,
            city: data.city,
            state: data.state,
            zipCode: data.zipCode,
            servicePreference: data.servicePreference,
            image: data.profileImage || 'https://images.unsplash.com/photo-1605980776566-0486c3ac7617?auto=format&fit=crop&q=80',
            availability: 'Available',
            depositAmount: parseFloat(data.depositAmount) || 0,
            washesHair: data.washesHair || false,
            providesHair: data.providesHair || false,
            stylesMensHair: data.stylesMensHair || false,
            stylesChildrensHair: data.stylesChildrensHair || false,
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
            schedule: scheduleDoc.exists() 
              ? scheduleDoc.data() as Schedule 
              : null
          } as Stylist);
        } else {
          setError('Stylist not found');
        }
      } catch (err) {
        console.error('Error fetching stylist:', err);
        setError('Failed to load stylist profile');
      } finally {
        setLoading(false);
      }
    };

    fetchStylist();
  }, [stylistId]);

  return { stylist, loading, error };
}