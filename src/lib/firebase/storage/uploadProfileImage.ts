import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../config';

export async function uploadProfileImage(
  userId: string,
  file: File,
  type: 'profile-images' | 'stylist-profiles' = 'profile-images'
): Promise<string> {
  const timestamp = Date.now();
  const filename = `${timestamp}-${file.name}`;
  const imageRef = ref(storage, `${type}/${userId}/${filename}`);
  
  await uploadBytes(imageRef, file);
  return getDownloadURL(imageRef);
}