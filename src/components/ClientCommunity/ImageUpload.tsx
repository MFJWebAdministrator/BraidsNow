import React, { useState, useRef } from "react";
import { Upload } from "lucide-react";
import { ImageCropper } from "./ImageCropper";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface ImageUploadProps {
    onImageSelect: (file: File) => void;
}

export function ImageUpload({ onImageSelect }: ImageUploadProps) {
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [showCropper, setShowCropper] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                alert("File size must be less than 5MB");
                return;
            }
            if (
                !["image/png", "image/jpeg", "image/webp"].includes(file.type)
            ) {
                alert("Only PNG, JPG, or WebP files are allowed");
                return;
            }
            setSelectedImage(file);
            setShowCropper(true);
        }
    };

    const handleCropComplete = (croppedFile: File) => {
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }
        const newPreviewUrl = URL.createObjectURL(croppedFile);
        setPreviewUrl(newPreviewUrl);
        onImageSelect(croppedFile);
        setShowCropper(false);
    };

    const handleUploadClick = () => {
        if (!previewUrl) {
            fileInputRef.current?.click();
        }
    };

    React.useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    return (
        <div className="space-y-4 justify-center">
            <label className="block text-md text-center font-bold tracking-normal text-[#3F0052]">
                BraidsNow.com Profile Image
            </label>

            {previewUrl ? (
                <div className="flex flex-col items-center">
                    <Avatar className="w-32 h-32">
                        <AvatarImage src={previewUrl} alt="Profile preview" />
                        <AvatarFallback>Preview</AvatarFallback>
                    </Avatar>
                </div>
            ) : (
                <div
                    className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-200 border-dashed rounded-2xl hover:border-[#3F0052]/50 transition-colors cursor-pointer"
                    onClick={handleUploadClick}
                >
                    <div className="space-y-2">
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="flex justify-center text-sm text-gray-600">
                            <span className="text-md tracking-normal font-bold text-[#3F0052] hover:text-[#DFA801]">
                                Upload Your Image
                            </span>
                            <input
                                ref={fileInputRef}
                                id="image-upload"
                                type="file"
                                className="sr-only"
                                accept="image/png,image/jpeg,image/webp"
                                onChange={handleFileSelect}
                            />
                        </div>
                        <p className="text-xs text-[#3F0052] font-light tracking-normal italic">
                            PNG, JPG or WebP up to 5MB
                        </p>
                    </div>
                </div>
            )}

            {showCropper && selectedImage && (
                <ImageCropper
                    image={selectedImage}
                    onCropComplete={handleCropComplete}
                    onCancel={() => setShowCropper(false)}
                />
            )}
        </div>
    );
}
