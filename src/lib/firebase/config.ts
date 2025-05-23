import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";
import { getStorage, connectStorageEmulator } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyDkih6TdooYj47OMbkSDn_7Ebu-PK6Z-kI",
    authDomain: "braidsnow-25.firebaseapp.com",
    databaseURL: "https://braidsnow-25-default-rtdb.firebaseio.com",
    projectId: "braidsnow-25",
    storageBucket: "braidsnow-25.firebasestorage.app",
    messagingSenderId: "791602996493",
    appId: "1:791602996493:web:946f7256d1e615014bbc44",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app, "us-central1");

// Connect to emulators in development mode
if (
    import.meta.env.DEV &&
    import.meta.env.VITE_USE_FIREBASE_EMULATORS === "true"
) {
    connectAuthEmulator(auth, "http://localhost:9099");
    connectFirestoreEmulator(db, "localhost", 8080);
    connectFunctionsEmulator(functions, "localhost", 5001);
    connectStorageEmulator(storage, "localhost", 9199);
    console.log("Connected to Firebase emulators");
}

export default app;
