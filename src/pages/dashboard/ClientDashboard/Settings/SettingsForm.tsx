import React from "react";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardHeader,
    CardContent,
    CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
    FormField,
    FormItem,
    FormLabel,
    FormControl,
    FormMessage,
} from "@/components/ui/form";
import { ImageUpload } from "@/components/ClientCommunity/ImageUpload";
import { Loader2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useClientSettings } from "@/hooks/use-client-settings";
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useNavigate } from "react-router-dom";
import { auth, db } from "@/lib/firebase/config";
import { doc, deleteDoc } from "firebase/firestore";

export function SettingsForm() {
    const {
        form,
        isLoading,
        hasChanges,
        handleSubmit,
        handleImageChange,
        userData,
    } = useClientSettings();
    const { toast } = useToast();
    const navigate = useNavigate();
    const [showCancelDialog, setShowCancelDialog] = React.useState(false);
    const [isCancelling, setIsCancelling] = React.useState(false);

    const handleCancelAccount = async () => {
        if (!auth.currentUser) return;

        try {
            setIsCancelling(true);

            // Delete user data from Firestore
            await deleteDoc(doc(db, "users", auth.currentUser.uid));

            // Delete user authentication
            await auth.currentUser.delete();

            toast({
                title: "Account Cancelled",
                description:
                    "Your account has been successfully cancelled. We're sorry to see you go!",
                duration: 3000,
            });

            navigate("/");
        } catch (error) {
            console.error("Error cancelling account:", error);
            toast({
                title: "Error",
                description: "Failed to cancel account. Please try again.",
                variant: "destructive",
                duration: 3000,
            });
        } finally {
            setIsCancelling(false);
            setShowCancelDialog(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-[#3F0052]" />
            </div>
        );
    }

    return (
        <>
            <Form {...form}>
                <form onSubmit={handleSubmit}>
                    <Card>
                        <CardHeader>
                            <h2 className="text-xl font-light text-[#3F0052]">
                                Profile Settings
                            </h2>
                            <p className="text-sm text-gray-500">
                                Update your account information
                            </p>
                        </CardHeader>

                        <CardContent className="space-y-8">
                            {/* Profile Image and Username */}
                            <div className="flex flex-col md:flex-row md:items-center md:gap-8">
                                <div className="flex items-center gap-8 mb-4 md:mb-0">
                                    {userData?.profileImage && (
                                        <Avatar className="h-24 w-24">
                                            <AvatarImage
                                                src={userData.profileImage}
                                                alt="Current profile"
                                            />
                                            <AvatarFallback>
                                                {userData.firstName?.[0]}
                                            </AvatarFallback>
                                        </Avatar>
                                    )}
                                    <div className="max-w-sm">
                                        <ImageUpload
                                            onImageSelect={handleImageChange}
                                        />
                                    </div>
                                </div>

                                <div className="flex-1 max-w-sm">
                                    <FormItem>
                                        <FormLabel className="text-md text-[#3F0052] font-light">
                                            Username
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                value={userData?.username || ""}
                                                disabled
                                                className="bg-gray-50"
                                            />
                                        </FormControl>
                                        <p className="text-sm text-gray-500 mt-1">
                                            Username cannot be changed after
                                            registration
                                        </p>
                                    </FormItem>
                                </div>
                            </div>

                            {/* Personal Information */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="firstName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-md text-[#3F0052] font-light">
                                                First Name
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    className="form-input"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="lastName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-md text-[#3F0052] font-light">
                                                Last Name
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    className="form-input"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Contact Information */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-md text-[#3F0052] font-light">
                                                Email
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    type="email"
                                                    className="form-input"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="phone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-md text-[#3F0052] font-light">
                                                Phone
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    className="form-input"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Address Information */}
                            <FormField
                                control={form.control}
                                name="streetAddress"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-md text-[#3F0052] font-light">
                                            Street Address (Optional)
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                className="form-input"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-12 gap-6">
                                <div className="col-span-12 md:col-span-6">
                                    <FormField
                                        control={form.control}
                                        name="city"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-md text-[#3F0052] font-light">
                                                    City
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        className="form-input"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="col-span-6 md:col-span-3">
                                    <FormField
                                        control={form.control}
                                        name="state"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-md text-[#3F0052] font-light">
                                                    State
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        className="form-input uppercase"
                                                        maxLength={2}
                                                        onChange={(e) =>
                                                            field.onChange(
                                                                e.target.value.toUpperCase()
                                                            )
                                                        }
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="col-span-6 md:col-span-3">
                                    <FormField
                                        control={form.control}
                                        name="zipCode"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-md text-[#3F0052] font-light">
                                                    ZIP Code
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        className="form-input"
                                                        maxLength={5}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>
                        </CardContent>

                        <CardFooter className="flex justify-between pt-6">
                            <Button
                                type="button"
                                size="lg"
                                variant="outline"
                                onClick={() => setShowCancelDialog(true)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                                Cancel Account
                            </Button>

                            <Button
                                type="submit"
                                size="lg"
                                disabled={!hasChanges || isLoading}
                                className="rounded-full font-light px-8"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving Changes...
                                    </>
                                ) : (
                                    "Save Changes"
                                )}
                            </Button>
                        </CardFooter>
                    </Card>
                </form>
            </Form>

            <AlertDialog
                open={showCancelDialog}
                onOpenChange={setShowCancelDialog}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="h-5 w-5" />
                            Cancel Your Account
                        </AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className="space-y-4">
                                <div className="text-black">
                                    Are you sure you want to cancel your
                                    account? This action cannot be undone.
                                </div>

                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-2">
                                    <div className="font-medium text-amber-800">
                                        You will lose access to:
                                    </div>
                                    <ul className="list-disc list-inside text-amber-700 space-y-1">
                                        <li>Your saved favorite stylists</li>
                                        <li>
                                            Your style board and uploaded images
                                        </li>
                                        <li>
                                            Your booking history and upcoming
                                            appointments
                                        </li>
                                        <li>
                                            Your messaging history with stylists
                                        </li>
                                        <li>Your reviews and ratings</li>
                                    </ul>
                                </div>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isCancelling}>
                            Keep My Account
                        </AlertDialogCancel>
                        <Button
                            variant="destructive"
                            onClick={handleCancelAccount}
                            disabled={isCancelling}
                        >
                            {isCancelling ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Cancelling...
                                </>
                            ) : (
                                "Yes, Cancel My Account"
                            )}
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
