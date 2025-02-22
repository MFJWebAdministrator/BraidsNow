import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../config';
import { uploadProfileImage } from '../storage/uploadProfileImage';
import type { ClientRegistrationForm } from '@/lib/schemas/client-registration';

export async function registerClient(
  data: ClientRegistrationForm,
  profileImage: File | null
) {
  // Create user account
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    data.email,
    data.password
  );

  let profileImageUrl = '';
  
  // Upload profile image if provided
  if (profileImage) {
    profileImageUrl = await uploadProfileImage(userCredential.user.uid, profileImage);
  }

  // Store client data
  await setDoc(doc(db, 'users', userCredential.user.uid), {
    ...data,
    profileImage: profileImageUrl,
    createdAt: new Date().toISOString(),
    userType: 'client',
  });

  return userCredential.user;
}