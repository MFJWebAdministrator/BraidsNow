import { Calendar, DollarSign, MessageSquare, BarChart2, Users, Image } from 'lucide-react';
import { ToolCard } from './ToolCard';

const tools = [
  {
    icon: Calendar,
    name: "Smart Scheduling",
    description: "Manage your appointments with our intuitive calendar system. Set your availability, handle bookings, and send automatic reminders to clients.",
  },
  {
    icon: DollarSign,
    name: "Payment Processing",
    description: "Secure payment processing for deposits and services. Track earnings, manage refunds, and generate financial reports.",
  },
  {
    icon: MessageSquare,
    name: "Client Communication",
    description: "Built-in messaging system to communicate with clients, share style inspiration, and provide pre-appointment instructions.",
  },
  {
    icon: BarChart2,
    name: "Business Analytics",
    description: "Track your business growth with detailed analytics. Monitor revenue, client retention, popular services, and more.",
  },
  {
    icon: Users,
    name: "Client Management",
    description: "Maintain detailed client profiles, including style history, preferences, and notes for personalized service.",
  },
  {
    icon: Image,
    name: "Style Portfolio",
    description: "Showcase your work with a professional portfolio. Share your expertise and attract new clients.",
  },
] as const;

export function ToolsGrid() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {tools.map((tool) => (
          <ToolCard key={tool.name} {...tool} />
        ))}
      </div>
    </div>
  );
}