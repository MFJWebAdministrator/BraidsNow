import { Star } from 'lucide-react';

interface StoryCardProps {
  name: string;
  business: string;
  location: string;
  image: string;
  story: string;
  stats: {
    clients: string;
    revenue: string;
    rating: string;
  };
  isReversed?: boolean;
}

export function StoryCard({ name, business, location, image, story, stats, isReversed }: StoryCardProps) {
  return (
    <div className={`flex flex-col lg:flex-row gap-12 items-center ${
      isReversed ? 'lg:flex-row-reverse' : ''
    }`}>
      <div className="lg:w-1/2">
        <div className="relative rounded-2xl overflow-hidden">
          <img
            src={image}
            alt={name}
            className="w-full h-[400px] object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#3F0052]/90 to-transparent">
            <div className="absolute bottom-6 left-6">
              <h3 className="text-2xl font-light text-white tracking-normal">{name}</h3>
              <p className="text-white tracking-normal">{business}</p>
              <p className="text-white text-sm tracking-normal">{location}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:w-1/2 space-y-6">
        <div className="flex items-center space-x-1 text-[#DFA801]">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-5 h-5 fill-current" />
          ))}
        </div>

        <blockquote className="text-xl text-black italic tracking-normal font-light">
          "{story}"
        </blockquote>

        <div className="grid grid-cols-3 gap-6">
          <div className="text-center p-4 bg-white rounded-xl shadow-sm border border-[#3F0052]/10">
            <p className="text-2xl font-bold text-[#3F0052]">{stats.clients}</p>
            <p className="text-sm text-black tracking-normal font-light">Clients Served</p>
          </div>
          <div className="text-center p-4 bg-white rounded-xl shadow-sm border border-[#3F0052]/10">
            <p className="text-2xl font-bold text-[#3F0052]">{stats.revenue}</p>
            <p className="text-sm text-black tracking-normal font-light">Revenue Growth</p>
          </div>
          <div className="text-center p-4 bg-white rounded-xl shadow-sm border border-[#3F0052]/10">
            <p className="text-2xl font-bold text-[#3F0052]">{stats.rating}</p>
            <p className="text-sm text-black tracking-normal font-light">Avg. Rating</p>
          </div>
        </div>
      </div>
    </div>
  );
}