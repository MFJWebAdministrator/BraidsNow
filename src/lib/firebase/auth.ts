import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    User,
    UserCredential,
} from "firebase/auth";
import { auth } from "./config";

export const loginUser = (
    email: string,
    password: string
): Promise<UserCredential> => {
    return signInWithEmailAndPassword(auth, email, password);
};

export const registerUser = (
    email: string,
    password: string
): Promise<UserCredential> => {
    return createUserWithEmailAndPassword(auth, email, password);
};

export const logoutUser = (): Promise<void> => {
    return signOut(auth);
};

export const getCurrentUser = (): User | null => {
    return auth.currentUser;
};

export const getAuthToken = async (): Promise<string | null> => {
    const user = auth.currentUser;
    if (user) {
        return await user.getIdToken();
    }
    return null;
};
