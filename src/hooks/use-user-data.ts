import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { getUserType } from '@/lib/firebase/auth/getUserType';

export function useUserData(uid: string | undefined) {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUserData() {
      if (!uid) {
        setLoading(false);
        return;
      }

      try {
        const userType = await getUserType(uid);
        const collection = userType === 'client' ? 'users' : 'stylists';
        const docRef = doc(db, collection, uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setUserData(docSnap.data());
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();
  }, [uid]);

  return { userData, loading };
}