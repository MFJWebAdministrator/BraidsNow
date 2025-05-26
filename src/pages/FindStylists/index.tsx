import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { FindStylistsHeader } from './FindStylistsHeader';
import { SearchSection } from './SearchSection';
import { StylistsGrid } from './StylistsGrid';
import { useFindStylists } from './hooks/useFindStylists';

export function FindStylistsPage() {
  const {
    stylists,
    loading,
    error,
    searchParams,
    setSearchParams,
    handleToggleFavorite,
    handleViewProfile
  } = useFindStylists();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <FindStylistsHeader />
      
      {/* Search Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
        <SearchSection 
          searchParams={searchParams}
          onSearchChange={setSearchParams}
        />
      </div>

      {/* Results Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <StylistsGrid 
          stylists={stylists}
          loading={loading}
          error={error}
          onToggleFavorite={handleToggleFavorite}
          onViewProfile={handleViewProfile}
        />
      </div>

      <Footer />
    </div>
  );
}