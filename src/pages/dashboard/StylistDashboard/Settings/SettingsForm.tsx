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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ImageUpload } from "@/components/ClientCommunity/ImageUpload";
import { Loader2 } from "lucide-react";
import { useStylistSettings } from "@/hooks/use-stylist-settings";
import { Textarea } from "@/components/ui/textarea";
import { StylistSettingsForm } from "@/lib/schemas/stylist-settings";
import { CopyableLink } from "@/components/ui/copyable-link";

const VITE_APP_DOMAIN = import.meta.env.VITE_APP_DOMAIN;

export function SettingsForm() {
    const {
        form,
        isLoading,
        hasChanges,
        handleSubmit,
        handleImageChange,
        userData,
    } = useStylistSettings();

    if (isLoading) {
        return (
            <div className="flex justify-center items-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-[#3F0052]" />
            </div>
        );
    }

    return (
        <Form {...form}>
            <form onSubmit={handleSubmit}>
                <Card>
                    <CardHeader>
                        <h2 className="text-xl font-light text-[#3F0052]">
                            Profile Settings
                        </h2>
                        <p className="text-sm text-gray-500">
                            Update Your Stylist Profile
                        </p>
                    </CardHeader>

                    <CardContent className="space-y-8">
                        {/* Profile Image and BraidsNow.com Link */}
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

                            <div className="flex-1">
                                <CopyableLink
                                    url={`${VITE_APP_DOMAIN}/stylist/${userData?.uid || ""}`}
                                    label="Your BraidsNow.com Unique Link"
                                    description="Share this link to promote your services"
                                />
                            </div>
                        </div>

                        {/* Personal Information */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                            <FormField
                                control={form.control}
                                name="businessName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-md text-[#3F0052] font-light">
                                            Business Name
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

                        {/* Business Information */}
                        <div className="space-y-6">
                            <FormField
                                control={form.control}
                                name="introduction"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-md text-[#3F0052] font-light">
                                            Introduction
                                        </FormLabel>
                                        <FormControl>
                                            <Textarea
                                                {...field}
                                                className="min-h-[100px] border-[#3F0052] focus:ring-[#3F0052]/20 focus:border-[#3F0052] rounded-lg text-md tracking-normal"
                                                placeholder="Tell potential clients about yourself and your experience..."
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="specialInstructions"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-md text-[#3F0052] font-light">
                                            Special Instructions
                                        </FormLabel>
                                        <FormControl>
                                            <Textarea
                                                {...field}
                                                className="min-h-[100px] border-[#3F0052] focus:ring-[#3F0052]/20 focus:border-[#3F0052] rounded-lg text-md tracking-normal"
                                                placeholder="Any specific instructions for your clients..."
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="policyAndProcedures"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-md text-[#3F0052] font-light">
                                            Policy and Procedures
                                        </FormLabel>
                                        <FormControl>
                                            <Textarea
                                                {...field}
                                                className="min-h-[100px] border-[#3F0052] focus:ring-[#3F0052]/20 focus:border-[#3F0052] rounded-lg text-md tracking-normal"
                                                placeholder="Your business policies, cancellation policy, etc..."
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Service Preferences */}
                        <div className="space-y-6">
                            <FormField
                                control={form.control}
                                name="servicePreference"
                                render={({ field }) => (
                                    <FormItem className="space-y-3">
                                        <FormLabel className="text-md text-[#3F0052] font-light">
                                            Service Preference
                                        </FormLabel>
                                        <FormControl>
                                            <RadioGroup
                                                onValueChange={field.onChange}
                                                value={field.value}
                                                className="flex flex-col space-y-2"
                                            >
                                                <FormItem className="flex items-center space-x-3 space-y-0">
                                                    <FormControl>
                                                        <RadioGroupItem value="shop" />
                                                    </FormControl>
                                                    <FormLabel className="font-light">
                                                        I Style Out of A Shop!
                                                    </FormLabel>
                                                </FormItem>
                                                <FormItem className="flex items-center space-x-3 space-y-0">
                                                    <FormControl>
                                                        <RadioGroupItem value="home" />
                                                    </FormControl>
                                                    <FormLabel className="font-light">
                                                        I Style From Home!
                                                    </FormLabel>
                                                </FormItem>
                                                <FormItem className="flex items-center space-x-3 space-y-0">
                                                    <FormControl>
                                                        <RadioGroupItem value="mobile" />
                                                    </FormControl>
                                                    <FormLabel className="font-light">
                                                        I Am A Mobile Stylist
                                                        That Likes To Travel!
                                                    </FormLabel>
                                                </FormItem>
                                            </RadioGroup>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Additional Services */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[
                                    {
                                        name: "washesHair",
                                        label: "Do You Wash Hair",
                                    },
                                    {
                                        name: "providesHair",
                                        label: "Do You Provide Hair",
                                    },
                                    {
                                        name: "stylesMensHair",
                                        label: "Do You Style Men's Hair",
                                    },
                                    {
                                        name: "stylesChildrensHair",
                                        label: "Do You Style Children's Hair",
                                    },
                                ].map((service) => (
                                    <FormField
                                        key={service.name}
                                        control={form.control}
                                        name={
                                            service.name as keyof StylistSettingsForm
                                        }
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                                <div className="space-y-0.5">
                                                    <FormLabel className="text-base font-light">
                                                        {service.label}
                                                    </FormLabel>
                                                </div>
                                                <FormControl>
                                                    <RadioGroup
                                                        onValueChange={(
                                                            value
                                                        ) =>
                                                            field.onChange(
                                                                value === "yes"
                                                            )
                                                        }
                                                        value={
                                                            field.value
                                                                ? "yes"
                                                                : "no"
                                                        }
                                                    >
                                                        <div className="flex space-x-4">
                                                            <FormItem className="flex items-center space-x-2">
                                                                <FormControl>
                                                                    <RadioGroupItem value="yes" />
                                                                </FormControl>
                                                                <FormLabel className="font-light">
                                                                    Yes
                                                                </FormLabel>
                                                            </FormItem>
                                                            <FormItem className="flex items-center space-x-2">
                                                                <FormControl>
                                                                    <RadioGroupItem value="no" />
                                                                </FormControl>
                                                                <FormLabel className="font-light">
                                                                    No
                                                                </FormLabel>
                                                            </FormItem>
                                                        </div>
                                                    </RadioGroup>
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Deposit Amount and Coupon Code */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="depositAmount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-md text-[#3F0052] font-light">
                                            Deposit Amount
                                        </FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                                                    $
                                                </span>
                                                <Input
                                                    type="number"
                                                    placeholder="Enter Amount"
                                                    className="form-input pl-7"
                                                    {...field}
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Location Information */}
                        <div className="space-y-6">
                            <FormField
                                control={form.control}
                                name="businessAddress"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-md text-[#3F0052] font-light">
                                            Business Address
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
                        </div>
                    </CardContent>

                    <CardFooter className="flex justify-end pt-6">
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
    );
}
