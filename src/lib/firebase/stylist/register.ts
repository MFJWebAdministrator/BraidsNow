import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../config";
import { uploadProfileImage } from "../storage/uploadProfileImage";
import type { StylistRegistrationForm } from "@/lib/schemas/stylist-registration";

export async function registerStylist(
    data: StylistRegistrationForm,
    profileImage: File | null
) {
    // Create user account
    const userCredential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
    );

    let profileImageUrl = "";

    // Upload profile image if provided
    if (profileImage) {
        profileImageUrl = await uploadProfileImage(
            userCredential.user.uid,
            profileImage,
            "stylist-profiles"
        );
    }

    // Store stylist data
    await setDoc(doc(db, "stylists", userCredential.user.uid), {
        ...data,
        profileImage: profileImageUrl,
        createdAt: new Date().toISOString(),
        userType: "stylist",
        subscription: {
            status: "inactive",
            currentPeriodEnd: null,
        },
    });

    // Ensure user is signed in
    await signInWithEmailAndPassword(auth, data.email, data.password);

    return userCredential.user;
}
