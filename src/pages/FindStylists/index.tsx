import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { FindStylistsHeader } from "./FindStylistsHeader";
import { SearchSection } from "./SearchSection";
import { StylistsGrid } from "./StylistsGrid";
import { useFindStylists } from "./hooks/useFindStylists";
import { SEO } from "@/components/SEO";
import { getPageMetadata } from "@/lib/metadata";

export function FindStylistsPage() {
    const {
        stylists,
        loading,
        error,
        searchParams,
        pagination,
        setPagination,
        setSearchParams,
        handleToggleFavorite,
        handleViewProfile,
    } = useFindStylists();

    return (
        <div className="min-h-screen bg-gray-50">
            <SEO metadata={getPageMetadata("findStylists")} />
            <Header />
            <FindStylistsHeader />

            {/* Search Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10">
                <SearchSection
                    searchParams={searchParams}
                    onSearchChange={setSearchParams}
                />
            </div>

            {/* Results Section */}
            <div
                className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20"
                data-results-section
            >
                <StylistsGrid
                    stylists={stylists}
                    loading={loading}
                    error={error}
                    pagination={pagination}
                    onToggleFavorite={handleToggleFavorite}
                    onViewProfile={handleViewProfile}
                    setPagination={setPagination}
                />
            </div>

            <Footer />
        </div>
    );
}
