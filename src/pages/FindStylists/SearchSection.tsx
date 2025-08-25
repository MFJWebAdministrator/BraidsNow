import type { SearchParams } from "./types";

interface SearchSectionProps {
    searchParams: SearchParams;
    onSearchChange: (params: SearchParams) => void;
}

("use client");
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

const serviceOptions = [
    { id: "shop", label: "Style Out of A Shop" },
    { id: "home", label: "Style From Home" },
    { id: "mobile", label: "Mobile Stylist That Likes to Travel" },
];

export function SearchSection({
    searchParams,
    onSearchChange,
}: SearchSectionProps) {
    const {
        businessName,
        braidStyle,
        location,
        servicePreference,
        maxDepositAmount,
    } = searchParams;

    const onBusinessNameChange = (value: string) => {
        onSearchChange({ ...searchParams, businessName: value });
    };

    const onStyleChange = (value: string) => {
        onSearchChange({ ...searchParams, braidStyle: value });
    };

    const onLocationChange = (value: string) => {
        onSearchChange({ ...searchParams, location: value });
    };

    const handleServicePreferenceChange = (
        serviceId: string,
        checked: boolean
    ) => {
        if (checked) {
            onSearchChange({
                ...searchParams,
                servicePreference: [...servicePreference, serviceId],
            });
        } else {
            onSearchChange({
                ...searchParams,
                servicePreference: servicePreference.filter(
                    (id) => id !== serviceId
                ),
            });
        }
    };

    const handleDepositAmountChange = (value: [number, number]) => {
        console.log(
            "Slider value changed:",
            value,
            "Current max:",
            maxDepositAmount
        );

        if (value[1] !== searchParams.maxDepositAmount) {
            onSearchChange({
                ...searchParams,
                minDepositAmount: 1,
                maxDepositAmount: value[1],
            });
        }
    };

    return (
        <Card className="w-full p-4 md:p-6 bg-white/95 backdrop-blur-xl border-2 border-[#3F0052]/20 shadow-xl">
            <div className="space-y-6">
                {/* Search Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Input
                            placeholder="Search by Business Name"
                            value={businessName}
                            onChange={(e) =>
                                onBusinessNameChange(e.target.value)
                            }
                            className="bg-white/95 border-2 border-[#3F0052]/20 rounded-full px-6 py-3 text-gray-700 placeholder:text-gray-500 focus:ring-2 focus:ring-[#3F0052]/30 focus:border-[#3F0052] focus:bg-white transition-all duration-200"
                        />
                    </div>

                    <div className="space-y-2">
                        <Input
                            placeholder="Search By Style (e.g., Box Braids)"
                            value={braidStyle}
                            onChange={(e) => onStyleChange(e.target.value)}
                            className="bg-white/95 border-2 border-[#3F0052]/20 rounded-full px-6 py-3 text-gray-700 placeholder:text-gray-500 focus:ring-2 focus:ring-[#3F0052]/30 focus:border-[#3F0052] focus:bg-white transition-all duration-200"
                        />
                    </div>

                    <div className="space-y-2 md:col-span-2 lg:col-span-1">
                        <Input
                            placeholder="Search by City, State, or Zip Code"
                            value={location}
                            onChange={(e) => onLocationChange(e.target.value)}
                            className="bg-white/95 border-2 border-[#3F0052]/20 rounded-full px-6 py-3 text-gray-700 placeholder:text-gray-500 focus:ring-2 focus:ring-[#3F0052]/30 focus:border-[#3F0052] focus:bg-white transition-all duration-200"
                        />
                    </div>
                </div>

                {/* Filters */}
                <div className="space-y-6 pt-2">
                    {/* Service Preferences */}
                    <div className="space-y-4">
                        <Label className="text-[#3F0052] font-semibold text-lg">
                            Service Preferences
                        </Label>
                        <div className="flex flex-wrap gap-4 sm:gap-6">
                            {serviceOptions.map((option) => (
                                <div
                                    key={option.id}
                                    className="flex items-center space-x-3"
                                >
                                    <Checkbox
                                        id={option.id}
                                        checked={servicePreference.includes(
                                            option.id
                                        )}
                                        onCheckedChange={(checked) =>
                                            handleServicePreferenceChange(
                                                option.id,
                                                checked as boolean
                                            )
                                        }
                                        className="border-2 border-[#3F0052]/50 data-[state=checked]:bg-[#3F0052] data-[state=checked]:border-[#3F0052] data-[state=checked]:text-white w-5 h-5"
                                    />
                                    <Label
                                        htmlFor={option.id}
                                        className="text-[#3F0052] font-medium text-base cursor-pointer select-none"
                                    >
                                        {option.label}
                                    </Label>
                                </div>
                            ))}
                        </div>
                    </div>
                    {/* Deposit Amount Range */}
                    <div className="space-y-4 max-w-md">
                        <Label className="text-[#3F0052] font-semibold text-lg">
                            Max Deposit Amount: ${maxDepositAmount}
                        </Label>
                        <div className="px-2">
                            <Slider
                                value={[1, maxDepositAmount]}
                                onValueChange={(value) =>
                                    handleDepositAmountChange([1, value[1]] as [
                                        number,
                                        number,
                                    ])
                                }
                                max={500}
                                min={1}
                                step={1}
                                className="w-full [&>span[data-orientation=horizontal]]:bg-gray-200 [&>span[data-orientation=horizontal]]:h-2 [&_[role=slider]]:bg-[#3F0052] [&_[role=slider]]:border-2 [&_[role=slider]]:border-[#3F0052] [&_[role=slider]]:w-6 [&_[role=slider]]:h-6 [&_[role=slider]]:shadow-lg [&>span[data-orientation=horizontal]>span]:bg-[#3F0052] [&>span[data-orientation=horizontal]>span]:h-2"
                            />
                            <div className="flex justify-between text-[#3F0052]/70 text-sm mt-2">
                                <span>$1</span>
                                <span>$500</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
}

// export function SearchSection({
//     searchParams,
//     onSearchChange,
// }: SearchSectionProps) {
//     return (
//         <div className="bg-white/90 backdrop-blur rounded-2xl shadow-lg border border-[#3F0052]/10 p-4">
//             {/* Top row: 3 inputs */}
//             <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
//                 <Input
//                     placeholder="Search by Business Name"
//                     value={searchParams.businessName}
//                     onChange={(e) =>
//                         onSearchChange({
//                             ...searchParams,
//                             businessName: e.target.value,
//                             page: 1,
//                         })
//                     }
//                     className="border-2 border-[#3F0052]/20 focus:border-[#3F0052] shadow-none bg-white rounded-full"
//                 />
//                 <Input
//                     placeholder="Search By Style (e.g., Box Braids)"
//                     value={searchParams.braidStyle}
//                     onChange={(e) =>
//                         onSearchChange({
//                             ...searchParams,
//                             braidStyle: e.target.value,
//                             page: 1,
//                         })
//                     }
//                     className="border-2 border-[#3F0052]/20 focus:border-[#3F0052] shadow-none bg-white rounded-full"
//                 />
//                 <Input
//                     placeholder="Search by City, State, or Zip Code"
//                     value={searchParams.location}
//                     onChange={(e) =>
//                         onSearchChange({
//                             ...searchParams,
//                             location: e.target.value,
//                             page: 1,
//                         })
//                     }
//                     className="border-2 border-[#3F0052]/20 focus:border-[#3F0052] shadow-none bg-white rounded-full"
//                 />
//             </div>

//             {/* Advanced filters */}
//             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-5">
//                 <div>
//                     <Label className="text-sm">Service Preferences</Label>
//                     <div className="mt-3 flex flex-wrap gap-4">
//                         {[
//                             { id: "shop", label: "Shop" },
//                             { id: "home", label: "Home" },
//                             { id: "mobile", label: "Mobile" },
//                         ].map((opt) => (
//                             <div
//                                 key={opt.id}
//                                 className="flex items-center space-x-2"
//                             >
//                                 <Checkbox
//                                     id={`pref-${opt.id}`}
//                                     checked={searchParams.servicePreference?.includes(
//                                         opt.id
//                                     )}
//                                     onCheckedChange={(checked) => {
//                                         const current =
//                                             searchParams.servicePreference ||
//                                             [];
//                                         const next = checked
//                                             ? Array.from(
//                                                   new Set([...current, opt.id])
//                                               )
//                                             : current.filter(
//                                                   (p) => p !== opt.id
//                                               );
//                                         onSearchChange({
//                                             ...searchParams,
//                                             servicePreference: next,
//                                             page: 1,
//                                         });
//                                     }}
//                                 />
//                                 <Label
//                                     htmlFor={`pref-${opt.id}`}
//                                     className="text-sm"
//                                 >
//                                     {opt.label}
//                                 </Label>
//                             </div>
//                         ))}
//                     </div>
//                 </div>

//                 <div className="md:col-span-2">
//                     <Label className="text-sm">
//                         Deposit Amount: ${searchParams.minDepositAmount} - $
//                         {searchParams.maxDepositAmount}
//                     </Label>
//                     <div className="mt-3 px-1">
//                         <Slider
//                             min={1}
//                             max={500}
//                             step={1}
//                             value={[
//                                 searchParams.minDepositAmount,
//                                 searchParams.maxDepositAmount,
//                             ]}
//                             onValueChange={([min, max]) =>
//                                 onSearchChange({
//                                     ...searchParams,
//                                     minDepositAmount: min,
//                                     maxDepositAmount: max,
//                                     page: 1,
//                                 })
//                             }
//                         />
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// }
