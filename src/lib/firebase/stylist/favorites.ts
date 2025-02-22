import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config';

export async function getStylistFavorites(stylistId: string) {
  try {
    // Query favorites collection for this stylist
    const favoritesRef = collection(db, 'favorites');
    const q = query(favoritesRef, where('stylistId', '==', stylistId));
    const querySnapshot = await getDocs(q);

    // Get user IDs who favorited this stylist
    const userIds = querySnapshot.docs.map(doc => doc.data().userId);

    // Get user details for each favorite
    const usersRef = collection(db, 'users');
    const userDetails = await Promise.all(
      userIds.map(async (userId) => {
        const userQuery = query(usersRef, where('__name__', '==', userId));
        const userSnapshot = await getDocs(userQuery);
        const userData = userSnapshot.docs[0]?.data();
        
        if (userData) {
          return {
            id: userId,
            name: `${userData.firstName} ${userData.lastName}`,
            email: userData.email,
            profileImage: userData.profileImage,
            city: userData.city,
            state: userData.state
          };
        }
        return null;
      })
    );

    return userDetails.filter(user => user !== null);
  } catch (error) {
    console.error('Error getting stylist favorites:', error);
    throw error;
  }
}