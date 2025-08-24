import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import type { StylistService } from "@/lib/schemas/stylist-service";

export function useStylistServices() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [services, setServices] = useState<StylistService[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch services
    useEffect(() => {
        const fetchServices = async () => {
            if (!user) return;

            try {
                const stylistRef = doc(db, "stylists", user.uid);
                const docSnap = await getDoc(stylistRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setServices(data.services || []);
                }
            } catch (err) {
                console.error("Error fetching services:", err);
                setError("Failed to load services");
            } finally {
                setLoading(false);
            }
        };

        fetchServices();
    }, [user]);

    // Add service
    const handleAddService = async (service: StylistService) => {
        if (!user) return;

        try {
            const stylistRef = doc(db, "stylists", user.uid);
            const updatedServices = [...services, service];
            await updateDoc(stylistRef, { services: updatedServices });
            setServices(updatedServices);

            toast({
                title: "Success",
                description: "Service added successfully.",
                duration: 3000,
            });
        } catch (err) {
            console.error("Error adding service:", err);
            toast({
                title: "Error",
                description: "Failed to add service. Please try again.",
                variant: "destructive",
                duration: 3000,
            });
        }
    };

    // Edit service
    const handleEditService = async (updatedService: StylistService) => {
        if (!user) return;

        try {
            const stylistRef = doc(db, "stylists", user.uid);
            const updatedServices = services.map((service) =>
                service.name === updatedService.name ? updatedService : service
            );
            await updateDoc(stylistRef, { services: updatedServices });
            setServices(updatedServices);

            toast({
                title: "Success",
                description: "Service updated successfully.",
                duration: 3000,
            });
        } catch (err) {
            console.error("Error updating service:", err);
            toast({
                title: "Error",
                description: "Failed to update service. Please try again.",
                variant: "destructive",
                duration: 3000,
            });
        }
    };

    // Delete service
    const handleDeleteService = async (serviceToDelete: StylistService) => {
        if (!user) return;

        try {
            const stylistRef = doc(db, "stylists", user.uid);
            const updatedServices = services.filter(
                (service) => service.name !== serviceToDelete.name
            );
            await updateDoc(stylistRef, { services: updatedServices });
            setServices(updatedServices);

            toast({
                title: "Success",
                description: "Service deleted successfully.",
                duration: 3000,
            });
        } catch (err) {
            console.error("Error deleting service:", err);
            toast({
                title: "Error",
                description: "Failed to delete service. Please try again.",
                variant: "destructive",
                duration: 3000,
            });
        }
    };

    return {
        services,
        loading,
        error,
        handleAddService,
        handleEditService,
        handleDeleteService,
    };
}
