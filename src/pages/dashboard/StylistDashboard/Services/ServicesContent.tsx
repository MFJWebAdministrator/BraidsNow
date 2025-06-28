import { useState } from "react";
import { Plus, Edit, Trash2, Clock, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AddServiceDialog } from "./AddServiceDialog";
import { useStylistServices } from "./hooks/useStylistServices";
import type { StylistService } from "@/lib/schemas/stylist-service";
import ImageLightbox from "@/components/ImageLightBox";

export function ServicesContent() {
    const {
        services,
        loading,
        error,
        handleAddService,
        handleEditService,
        handleDeleteService,
    } = useStylistServices();

    const [showDialog, setShowDialog] = useState(false);
    const [editingService, setEditingService] = useState<StylistService | null>(
        null
    );
    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

    const handleEdit = (service: StylistService) => {
        setEditingService(service);
        setShowDialog(true);
    };

    const handleClose = () => {
        setShowDialog(false);
        setEditingService(null);
    };

    const handleSave = (service: StylistService) => {
        if (editingService) {
            handleEditService(service);
        } else {
            handleAddService(service);
        }
        handleClose();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3F0052]"></div>
            </div>
        );
    }

    if (error) {
        return (
            <Card className="p-6">
                <div className="text-center py-8">
                    <div className="w-16 h-16 bg-red-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                        <Trash2 className="w-8 h-8 text-red-500" />
                    </div>
                    <p className="text-red-600 font-medium">
                        Error loading services
                    </p>
                    <p className="text-red-500 text-sm mt-1">{error}</p>
                </div>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <Card className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-light text-[#3F0052] tracking-normal">
                            Services Management
                        </h2>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="w-2 h-2 bg-gradient-to-r from-[#3F0052] to-[#DFA801] rounded-full"></div>
                            <p className="text-sm text-gray-500 tracking-normal">
                                {services.length} services configured
                            </p>
                        </div>
                    </div>
                    <Button
                        onClick={() => setShowDialog(true)}
                        className="rounded-full bg-gradient-to-r from-[#3F0052] to-[#DFA801] hover:from-[#3F0052]/90 hover:to-[#DFA801]/90 transition-all duration-300 font-medium tracking-normal shadow-md hover:shadow-lg"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add New Service
                    </Button>
                </div>
            </Card>

            {/* Services List */}
            <div className="space-y-4">
                {services.length === 0 ? (
                    <Card className="p-8">
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-gradient-to-br from-[#3F0052]/10 to-[#DFA801]/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                                <Plus className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                No services yet
                            </h3>
                            <p className="text-gray-500 mb-4">
                                Get started by adding your first service
                            </p>
                            <Button
                                onClick={() => setShowDialog(true)}
                                className="rounded-full bg-gradient-to-r from-[#3F0052] to-[#DFA801] hover:from-[#3F0052]/90 hover:to-[#DFA801]/90 transition-all duration-300"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Add Service
                            </Button>
                        </div>
                    </Card>
                ) : (
                    services.map((service) => (
                        <Card
                            key={service.name}
                            className="p-4 sm:p-6 hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-[#3F0052]/20"
                        >
                            {/* Desktop Layout */}
                            <div className="hidden sm:flex items-center justify-between gap-6">
                                {/* Left Section: Image and Service Info */}
                                <div className="flex items-center gap-4 flex-1">
                                    {/* Service Image - Fixed size for alignment */}
                                    <div className="flex-shrink-0">
                                        {service.imageUrl ? (
                                            <img
                                                src={
                                                    service.imageUrl ||
                                                    "/placeholder.svg"
                                                }
                                                alt={service.name}
                                                className="w-16 h-16 object-cover rounded-full border-2 border-gray-100 cursor-pointer hover:opacity-80 transition-opacity hover:border-[#3F0052]/30 shadow-sm"
                                                onClick={() =>
                                                    setLightboxUrl(
                                                        service.imageUrl!
                                                    )
                                                }
                                            />
                                        ) : (
                                            <div className="w-16 h-16 bg-gradient-to-br from-[#3F0052]/10 to-[#DFA801]/10 rounded-full border-2 border-gray-100 flex items-center justify-center shadow-sm">
                                                <span className="text-[#3F0052] font-medium text-sm">
                                                    {service.name.charAt(0)}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Service Details */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-lg font-medium text-[#3F0052] tracking-normal truncate mb-2">
                                            {service.name}
                                        </h3>
                                        <div className="flex items-center gap-4 text-sm">
                                            <div className="flex items-center gap-1 text-gray-600">
                                                <DollarSign className="w-4 h-4" />
                                                <span className="font-medium">
                                                    ${service.price}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1 text-gray-500">
                                                <Clock className="w-4 h-4" />
                                                <span>
                                                    {service.duration.hours}h{" "}
                                                    {service.duration.minutes}m
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Section: Action Buttons */}
                                <div className="flex items-center gap-3 flex-shrink-0">
                                    <Button
                                        variant="outline"
                                        onClick={() => handleEdit(service)}
                                        className="rounded-full border-[#3F0052]/20 text-[#3F0052] hover:bg-[#3F0052] hover:text-white transition-all duration-300"
                                    >
                                        <Edit className="w-4 h-4 mr-2" />
                                        Edit
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() =>
                                            handleDeleteService(service)
                                        }
                                        className="rounded-full border-red-200 text-red-600 hover:bg-red-600 hover:text-white transition-all duration-300"
                                    >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Delete
                                    </Button>
                                </div>
                            </div>

                            {/* Mobile Layout */}
                            <div className="sm:hidden space-y-4">
                                {/* First Row: Image and Service Info */}
                                <div className="flex items-start gap-4">
                                    {/* Service Image */}
                                    <div className="flex-shrink-0">
                                        {service.imageUrl ? (
                                            <img
                                                src={
                                                    service.imageUrl ||
                                                    "/placeholder.svg"
                                                }
                                                alt={service.name}
                                                className="w-14 h-14 object-cover rounded-full border-2 border-gray-100 cursor-pointer hover:opacity-80 transition-opacity shadow-sm"
                                                onClick={() =>
                                                    setLightboxUrl(
                                                        service.imageUrl!
                                                    )
                                                }
                                            />
                                        ) : (
                                            <div className="w-14 h-14 bg-gradient-to-br from-[#3F0052]/10 to-[#DFA801]/10 rounded-full border-2 border-gray-100 flex items-center justify-center shadow-sm">
                                                <span className="text-[#3F0052] font-medium text-sm">
                                                    {service.name.charAt(0)}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Service Details */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-lg font-medium text-[#3F0052] tracking-normal mb-2">
                                            {service.name}
                                        </h3>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-1 text-sm text-gray-600">
                                                <DollarSign className="w-4 h-4" />
                                                <span className="font-medium">
                                                    ${service.price}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1 text-sm text-gray-500">
                                                <Clock className="w-4 h-4" />
                                                <span>
                                                    {service.duration.hours}h{" "}
                                                    {service.duration.minutes}m
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Second Row: Action Buttons */}
                                <div className="flex gap-3 pt-2 border-t border-gray-50">
                                    <Button
                                        variant="outline"
                                        onClick={() => handleEdit(service)}
                                        className="flex-1 rounded-full border-[#3F0052]/20 text-[#3F0052] hover:bg-[#3F0052] hover:text-white transition-all duration-300 text-sm"
                                    >
                                        <Edit className="w-4 h-4 mr-2" />
                                        Edit
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() =>
                                            handleDeleteService(service)
                                        }
                                        className="flex-1 rounded-full border-red-200 text-red-600 hover:bg-red-600 hover:text-white transition-all duration-300 text-sm"
                                    >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Delete
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>

            {/* Add/Edit Service Dialog */}
            <AddServiceDialog
                open={showDialog}
                onClose={handleClose}
                onSave={handleSave}
                initialData={editingService}
                isEdit={!!editingService}
            />

            {/* Lightbox for image preview */}
            {lightboxUrl && (
                <ImageLightbox
                    imageUrl={lightboxUrl}
                    onClose={() => setLightboxUrl(null)}
                />
            )}
        </div>
    );
}
