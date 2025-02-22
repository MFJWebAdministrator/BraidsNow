import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDkih6TdooYj47OMbkSDn_7Ebu-PK6Z-kI",
  authDomain: "braidsnow-25.firebaseapp.com",
  projectId: "braidsnow-25",
  storageBucket: "braidsnow-25.firebasestorage.app",
  messagingSenderId: "791602996493",
  appId: "1:791602996493:web:946f7256d1e615014bbc44"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;