import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Scissors, 
  Image, 
  Settings,
  Heart,
  Clock,
  LogOut,
  UserCircle,
  MessageSquare,
  CreditCard
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { LogoutConfirmation } from '@/components/dashboard/client/LogoutConfirmation';
import { useAuth } from '@/hooks/use-auth';

const links = [
  { href: '/dashboard/stylist', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/stylist/appointments', label: 'Appointments', icon: Calendar },
  { href: '/dashboard/stylist/schedule', label: 'Schedule', icon: Clock },
  { href: '/dashboard/stylist/messages', label: 'Messages', icon: MessageSquare },
  { href: '/dashboard/stylist/clients', label: 'Clients', icon: Users },
  { href: '/dashboard/stylist/services', label: 'My Services', icon: Scissors },
  { href: '/dashboard/stylist/favorites', label: 'My Favorites', icon: Heart },
  { href: '/dashboard/stylist/styleboard', label: 'Style Board', icon: Image },
  { href: '/dashboard/stylist/payments', label: 'Payments', icon: CreditCard },
  { href: '/dashboard/stylist/settings', label: 'Settings', icon: Settings },
];

export function StylistSidebar() {
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);
  const { user } = useAuth();

  return (
    <nav className="w-64 border-r bg-white pt-24 p-4 space-y-2">
      {links.map(({ href, label, icon: Icon }) => (
        <NavLink
          key={href}
          to={href}
          className={({ isActive }) =>
            cn(
              'flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-colors',
              isActive
                ? 'bg-[#3F0052] text-white'
                : 'text-gray-700 hover:bg-gray-100'
            )
          }
        >
          <Icon className="h-4 w-4" />
          <span>{label}</span>
        </NavLink>
      ))}

      {/* My Profile Link */}
      <NavLink
        to={`/stylist/${user?.uid}`}
        className={({ isActive }) =>
          cn(
            'flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-colors',
            isActive
              ? 'bg-[#3F0052] text-white'
              : 'text-gray-700 hover:bg-gray-100'
          )
        }
      >
        <UserCircle className="h-4 w-4" />
        <span>My Profile</span>
      </NavLink>

      {/* Logout Button */}
      <button
        onClick={() => setShowLogoutConfirmation(true)}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-colors w-full text-red-600 hover:bg-red-50"
      >
        <LogOut className="h-4 w-4" />
        <span>Logout</span>
      </button>

      <LogoutConfirmation 
        isOpen={showLogoutConfirmation}
        onClose={() => setShowLogoutConfirmation(false)}
      />
    </nav>
  );
}