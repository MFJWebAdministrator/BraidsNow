import { Heart, Mail } from 'lucide-react';
import { useStylistFavorites } from '@/hooks/use-stylist-favorites';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function FavoritesContent() {
  const { favoriteClients, loading, error } = useStylistFavorites();

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3F0052]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (favoriteClients.length === 0) {
    return (
      <div className="text-center py-16 px-4">
        <div className="bg-gray-50 rounded-2xl p-8 max-w-2xl mx-auto">
          <div className="bg-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6 shadow-md">
            <Heart className="w-8 h-8 text-[#3F0052]" />
          </div>
          <h3 className="text-2xl font-light text-[#3F0052] mb-3 tracking-normal">
            No Favorite Clients Yet
          </h3>
          <p className="text-gray-600 tracking-normal max-w-md mx-auto">
            When clients favorite your profile, they'll appear here. This helps you keep track of interested clients and manage your client relationships.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {favoriteClients.map((client) => (
        <Card key={client.id} className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-start space-x-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={client.profileImage} alt={client.name} />
              <AvatarFallback>{client.name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="font-medium text-[#3F0052]">{client.name}</h3>
              <p className="text-sm text-gray-500">{client.city}, {client.state}</p>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button 
              variant="outline" 
              size="sm"
              className="rounded-full"
              onClick={() => window.location.href = `mailto:${client.email}`}
            >
              <Mail className="w-4 h-4 mr-2" />
              Contact
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}