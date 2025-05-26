import { StoryCard } from './StoryCard';

const stories = [
  {
    name: "Sarah Johnson2",
    business: "Crown & Glory Braids",
    location: "Brooklyn, NY",
    image: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    story: "Since joining BraidsNow, my business has grown by 300%. The platform's tools have helped me streamline my bookings and focus on what I love - creating beautiful styles for my clients.",
    stats: {
      clients: "500+",
      revenue: "200%",
      rating: "4.9"
    }
  },
  {
    name: "Michelle Davis",
    business: "Braids & Beauty Studio",
    location: "Manhattan, NY",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    story: "BraidsNow has transformed how I run my business. The automated scheduling and payment system saves me hours each week, and the client reach is incredible.",
    stats: {
      clients: "400+",
      revenue: "150%",
      rating: "4.8"
    }
  },
  {
    name: "Jessica Williams",
    business: "Natural Hair Haven",
    location: "Queens, NY",
    image: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    story: "As a new stylist, BraidsNow gave me the platform I needed to establish my brand. The support and tools provided helped me build a thriving business from scratch.",
    stats: {
      clients: "300+",
      revenue: "180%",
      rating: "4.9"
    }
  }
] as const;

export function StoriesList() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="space-y-20">
        {stories.map((story, index) => (
          <StoryCard 
            key={story.name} 
            {...story} 
            isReversed={index % 2 === 1}
          />
        ))}
      </div>
    </div>
  );
}
