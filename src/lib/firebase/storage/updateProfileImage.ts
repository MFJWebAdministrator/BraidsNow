import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { storage, db } from '../config';

export async function updateProfileImage(userId: string, file: File, userType: 'client' | 'stylist' = 'client') {
  try {
    // Get current user data to check for existing image
    const collection = userType === 'client' ? 'users' : 'stylists';
    const userDoc = await getDoc(doc(db, collection, userId));
    const userData = userDoc.data();

    // If there's an existing image URL, extract the path and delete it
    if (userData?.profileImage) {
      try {
        const oldImageRef = ref(storage, userData.profileImage);
        await deleteObject(oldImageRef);
      } catch (error) {
        console.error('Error deleting old image:', error);
        // Continue even if delete fails
      }
    }

    // Upload new image
    const timestamp = Date.now();
    const filename = `${timestamp}-${file.name}`;
    const imageRef = ref(storage, `${userType}-profile-images/${userId}/${filename}`);
    await uploadBytes(imageRef, file);
    const downloadUrl = await getDownloadURL(imageRef);

    // Update user profile with new image URL
    const userRef = doc(db, collection, userId);
    await updateDoc(userRef, {
      profileImage: downloadUrl,
      updatedAt: new Date().toISOString()
    });

    return downloadUrl;
  } catch (error) {
    console.error('Error updating profile image:', error);
    throw error;
  }
}