import { useState, useEffect } from "react";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import {
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject,
} from "firebase/storage";
import { db, storage } from "@/lib/firebase/config";
import { useToast } from "./use-toast";
import type { StyleBoard, StyleImage } from "@/lib/schemas/style-board";

export function useStyleBoard(userId: string) {
    const [styleBoard, setStyleBoard] = useState<StyleBoard | null>(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    // Fetch style board
    useEffect(() => {
        const fetchStyleBoard = async () => {
            if (!userId) {
                setLoading(false);
                return;
            }

            try {
                const styleBoardRef = doc(db, "styleBoards", userId);
                const docSnap = await getDoc(styleBoardRef);

                if (!docSnap.exists()) {
                    const newStyleBoard: StyleBoard = {
                        userId,
                        hairType: "",
                        currentStyles: [],
                        pastStyles: [],
                        wishlist: [],
                        naturalHair: [],
                        updatedAt: new Date().toISOString(),
                    };
                    await setDoc(styleBoardRef, newStyleBoard);
                    setStyleBoard(newStyleBoard);
                } else {
                    setStyleBoard(docSnap.data() as StyleBoard);
                }
            } catch (error) {
                console.error("Error fetching style board:", error);
                toast({
                    title: "Error",
                    description: "Failed to load style board",
                    variant: "destructive",
                });
            } finally {
                setLoading(false);
            }
        };

        fetchStyleBoard();
    }, [userId, toast]);

    const getCategoryKey = (
        category: StyleImage["category"]
    ): keyof StyleBoard => {
        switch (category) {
            case "current":
                return "currentStyles";
            case "past":
                return "pastStyles";
            case "wishlist":
                return "wishlist";
            case "natural":
                return "naturalHair";
            default:
                throw new Error("Invalid category");
        }
    };

    const uploadImage = async (
        file: File,
        category: StyleImage["category"]
    ) => {
        if (!userId || !styleBoard) {
            throw new Error("Style board not initialized");
        }

        try {
            // Create a clean filename
            const timestamp = Date.now();
            const cleanFileName = file.name
                .toLowerCase()
                .replace(/[^a-z0-9.-]/g, "")
                .replace(/\s+/g, "-");
            const imageId = `${timestamp}-${cleanFileName}`;

            // Create storage path with category
            const imagePath = `style-boards/${userId}/${category}/${imageId}`;
            const imageRef = ref(storage, imagePath);

            // Upload to Storage
            await uploadBytes(imageRef, file);
            const url = await getDownloadURL(imageRef);

            // Create new image object
            const newImage: StyleImage = {
                id: imageId,
                url,
                category,
                createdAt: new Date().toISOString(),
            };

            // Get the correct category key and current images
            const categoryKey = getCategoryKey(category);
            const currentImages = [
                ...(styleBoard[categoryKey] as StyleImage[]),
            ];

            // Check image limit
            if (currentImages.length >= 5) {
                throw new Error("Maximum of 5 images allowed per category");
            }

            const updatedImages = [...currentImages, newImage];

            // Update Firestore
            const styleBoardRef = doc(db, "styleBoards", userId);
            const updateData = {
                [categoryKey]: updatedImages,
                updatedAt: new Date().toISOString(),
            };

            await updateDoc(styleBoardRef, updateData);

            // Update local state
            setStyleBoard((prev) => {
                if (!prev) return null;
                return {
                    ...prev,
                    ...updateData,
                };
            });

            toast({
                title: "Success",
                description: "Image uploaded successfully",
                duration: 3000,
            });

            return newImage;
        } catch (error) {
            console.error("Error uploading image:", error);
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Failed to upload image";
            toast({
                title: "Error",
                description: errorMessage,
                variant: "destructive",
                duration: 3000,
            });
            throw error;
        }
    };

    const deleteImage = async (
        imageId: string,
        category: StyleImage["category"]
    ) => {
        if (!userId || !styleBoard) {
            throw new Error("Style board not initialized");
        }

        try {
            // Delete from Storage
            const imagePath = `style-boards/${userId}/${category}/${imageId}`;
            const imageRef = ref(storage, imagePath);
            await deleteObject(imageRef);

            // Get the correct category key and filter images
            const categoryKey = getCategoryKey(category);
            const currentImages = styleBoard[categoryKey] as StyleImage[];
            const updatedImages = currentImages.filter(
                (img) => img.id !== imageId
            );

            // Update Firestore
            const styleBoardRef = doc(db, "styleBoards", userId);
            const updateData = {
                [categoryKey]: updatedImages,
                updatedAt: new Date().toISOString(),
            };

            await updateDoc(styleBoardRef, updateData);

            // Update local state
            setStyleBoard((prev) => {
                if (!prev) return null;
                return {
                    ...prev,
                    ...updateData,
                };
            });

            toast({
                title: "Success",
                description: "Image deleted successfully",
                duration: 3000,
            });
        } catch (error) {
            console.error("Error deleting image:", error);
            toast({
                title: "Error",
                description: "Failed to delete image",
                variant: "destructive",
                duration: 3000,
            });
            throw error;
        }
    };

    const updateHairType = async (description: string) => {
        if (!userId || !styleBoard) {
            throw new Error("Style board not initialized");
        }

        try {
            const styleBoardRef = doc(db, "styleBoards", userId);
            const updateData = {
                hairType: description,
                updatedAt: new Date().toISOString(),
            };

            await updateDoc(styleBoardRef, updateData);

            setStyleBoard((prev) => {
                if (!prev) return null;
                return {
                    ...prev,
                    ...updateData,
                };
            });

            toast({
                title: "Success",
                description: "Hair type updated successfully",
                duration: 3000,
            });
        } catch (error) {
            console.error("Error updating hair type:", error);
            throw new Error("Failed to update hair type. Please try again.");
        }
    };

    return {
        styleBoard,
        loading,
        uploadImage,
        deleteImage,
        updateHairType,
    };
}
