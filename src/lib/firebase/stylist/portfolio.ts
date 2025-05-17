import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { storage, db } from '../config';

export interface PortfolioImage {
  id: string;
  url: string;
  createdAt: string;
}

export async function uploadPortfolioImage(userId: string, file: File): Promise<PortfolioImage> {
  try {
    // Create unique filename with timestamp
    const timestamp = Date.now();
    const imageId = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`;
    const imagePath = `portfolio-images/${userId}/${imageId}`;
    
    // Upload to Storage
    const imageRef = ref(storage, imagePath);
    await uploadBytes(imageRef, file);
    const url = await getDownloadURL(imageRef);
    
    // Create portfolio image object
    const image = {
      id: imageId,
      url,
      createdAt: new Date().toISOString()
    };

    // Add to Firestore portfolio array
    const stylistRef = doc(db, 'stylists', userId);
    const stylistDoc = await getDoc(stylistRef);
    
    if (stylistDoc.exists()) {
      const currentPortfolio = stylistDoc.data().portfolio || [];
      await updateDoc(stylistRef, {
        portfolio: [...currentPortfolio, image]
      });
    } else {
      await updateDoc(stylistRef, {
        portfolio: [image]
      });
    }

    return image;
  } catch (error) {
    console.error('Error uploading portfolio image:', error);
    throw new Error('Failed to upload image. Please try again.');
  }
}

export async function deletePortfolioImage(userId: string, imageId: string) {
  try {
    // Delete from Storage
    const imagePath = `portfolio-images/${userId}/${imageId}`;
    const imageRef = ref(storage, imagePath);
    await deleteObject(imageRef);

    // Remove from Firestore portfolio array
    const stylistRef = doc(db, 'stylists', userId);
    const stylistDoc = await getDoc(stylistRef);
    
    if (stylistDoc.exists()) {
      const currentPortfolio = stylistDoc.data().portfolio || [];
      const updatedPortfolio = currentPortfolio.filter((img: { id: string; }) => img.id !== imageId);
      
      await updateDoc(stylistRef, {
        portfolio: updatedPortfolio
      });
    }
  } catch (error) {
    console.error('Error deleting portfolio image:', error);
    throw new Error('Failed to delete image. Please try again.');
  }
}

export async function getPortfolioImages(userId: string): Promise<PortfolioImage[]> {
  try {
    const stylistRef = doc(db, 'stylists', userId);
    const docSnap = await getDoc(stylistRef);
    
    if (docSnap.exists()) {
      const portfolio = docSnap.data().portfolio;
      return Array.isArray(portfolio) ? portfolio : [];
    }
    
    return [];
  } catch (error) {
    console.error('Error getting portfolio images:', error);
    throw new Error('Failed to load portfolio images');
  }
}