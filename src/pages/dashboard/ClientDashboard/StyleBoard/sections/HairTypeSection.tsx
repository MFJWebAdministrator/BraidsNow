import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Edit2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface HairTypeSectionProps {
    hairType: string;
    onUpdate: (description: string) => Promise<void>;
}

export function HairTypeSection({ hairType, onUpdate }: HairTypeSectionProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [description, setDescription] = useState(hairType);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async () => {
        try {
            setIsSubmitting(true);
            await onUpdate(description);
            setIsEditing(false);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to update hair type",
                variant: "destructive",
                duration: 3000,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-light text-[#3F0052] tracking-normal">
                    My Hair Type
                </h2>
                {!isEditing && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                    >
                        <Edit2 className="w-4 h-4 mr-2" />
                        Edit
                    </Button>
                )}
            </div>

            {isEditing ? (
                <div className="space-y-4">
                    <Textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe your hair type, texture, and any other important details..."
                        className="min-h-[100px]"
                    />
                    <div className="flex justify-end space-x-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setDescription(hairType);
                                setIsEditing(false);
                            }}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit} disabled={isSubmitting}>
                            {isSubmitting ? "Saving..." : "Save"}
                        </Button>
                    </div>
                </div>
            ) : (
                <p className="text-gray-600 tracking-normal">
                    {hairType || "Click edit to add your hair type description"}
                </p>
            )}
        </div>
    );
}
