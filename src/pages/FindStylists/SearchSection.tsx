import { Input } from "@/components/ui/input";
import type { SearchParams } from "./types";

interface SearchSectionProps {
    searchParams: SearchParams;
    onSearchChange: (params: SearchParams) => void;
}

export function SearchSection({
    searchParams,
    onSearchChange,
}: SearchSectionProps) {
    return (
        <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-[#3F0052]/20 to-[#DFA801]/20 rounded-full blur-xl opacity-50" />
            <div className="relative bg-white/95 backdrop-blur-xl rounded-full shadow-lg border-2 border-[#3F0052]/20">
                <div className="flex items-center p-2">
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <Input
                            placeholder="Search by Business Name"
                            value={searchParams.businessName}
                            onChange={(e) =>
                                onSearchChange({
                                    ...searchParams,
                                    businessName: e.target.value,
                                })
                            }
                            className="border-2 border-[#3F0052]/20 focus:border-[#3F0052] shadow-none bg-transparent rounded-full"
                        />
                        <Input
                            placeholder="Search By Style (e.g., Box Braids)"
                            value={searchParams.styles}
                            onChange={(e) =>
                                onSearchChange({
                                    ...searchParams,
                                    styles: e.target.value,
                                })
                            }
                            className="hidden sm:block border-2 border-[#3F0052]/20 focus:border-[#3F0052] shadow-none bg-transparent rounded-full"
                        />
                        <Input
                            placeholder="Search by City, State, or Zip Code"
                            value={searchParams.location}
                            onChange={(e) =>
                                onSearchChange({
                                    ...searchParams,
                                    location: e.target.value,
                                })
                            }
                            className="hidden sm:block border-2 border-[#3F0052]/20 focus:border-[#3F0052] shadow-none bg-transparent rounded-full"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
