import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, LogOut, Home, Scissors } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LogoutConfirmation } from '../client/LogoutConfirmation';
import { useAuth } from '@/hooks/use-auth';
import { useUserData } from '@/hooks/use-user-data';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

export function StylistDashboardHeader() {
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);
  const { user } = useAuth();
  const { userData } = useUserData(user?.uid);

  if (!userData) return null;

  return (
    <div className="border-b bg-white">
      <div className="max-w-7xl mx-auto flex h-16 items-center px-4">
        {/* Logo and Name */}
        <Link to="/" className="flex items-center space-x-2">
          <Scissors className="h-6 w-6 text-[#3F0052]" />
          <span className="text-xl font-light tracking-tight text-[#3F0052]">
            BraidsNow
          </span>
        </Link>

        {/* Right-aligned buttons and avatar */}
        <div className="ml-auto flex items-center space-x-4">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <Home className="h-5 w-5 text-[#3F0052]" />
            </Button>
          </Link>

          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5 text-[#3F0052]" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowLogoutConfirmation(true)}
          >
            <LogOut className="h-5 w-5 text-[#3F0052]" />
          </Button>

          <Avatar className="h-10 w-10 border-2 border-[#3F0052]">
            <AvatarImage src={userData.profileImage} alt={userData.firstName} />
            <AvatarFallback>{userData.firstName[0]}</AvatarFallback>
          </Avatar>
        </div>
      </div>

      <LogoutConfirmation 
        isOpen={showLogoutConfirmation}
        onClose={() => setShowLogoutConfirmation(false)}
      />
    </div>
  );
}