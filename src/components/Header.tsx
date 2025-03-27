import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Scissors, Bell, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { UserProfile } from './Header/UserProfile';
import { LogoutConfirmation } from './Header/LogoutConfirmation';
import { NotificationPopup } from './Header/NotificationPopup';
import { BalanceDisplay } from './Header/BalanceDisplay';

export function Header() {
  const { user } = useAuth();
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);
  const navigate = useNavigate();

  return (
    <header className="fixed w-full top-0 z-50 bg-white/80 backdrop-blur-md border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <Scissors className="h-6 w-6 text-[#3F0052]" />
            <span className="text-xl font-light tracking-tight text-[#3F0052]">BraidsNow</span>
          </Link>

          {user ? (
            // Authenticated user header
            <div className="flex items-center space-x-6">
              <nav className="hidden md:flex items-center space-x-6">
                <Link to="/find-stylists" className="text-[#3F0052] hover:text-[#B98EC1] font-light transition-colors tracking-normal">
                  Find Stylists
                </Link>
                <Link to="/style-show" className="text-[#3F0052] hover:text-[#B98EC1] font-light transition-colors tracking-normal">
                  StyleShow
                </Link>
              </nav>
              
            
              <div className="flex items-center space-x-4">
                {/* Balance display - clickable to navigate to earnings page */}
              
                <NotificationPopup />
                <div className="flex items-center space-x-4">
                  {/* <div onClick={() => navigate('/dashboard/stylist/paymentss')} className="cursor-pointer">
                    <BalanceDisplay />
                  </div> */}
                  <div className="relative">
                    <UserProfile />
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowLogoutConfirmation(true)}
                  className="hidden md:flex"
                >
                  <LogOut className="h-5 w-5 text-[#3F0052]" />
                </Button>
              </div>
            </div>
          ) : (
            // Non-authenticated header content
            <div className="hidden md:flex items-center space-x-4">
              <nav className="flex items-center space-x-6">
                <Link to="/find-stylists" className="text-[#3F0052] hover:text-[#B98EC1] font-light transition-colors tracking-normal">
                  Find Stylists
                </Link>
                <Link to="/style-show" className="text-[#3F0052] hover:text-[#B98EC1] font-light transition-colors tracking-normal">
                  StyleShow
                </Link>
              </nav>
              <div className="flex items-center space-x-4">
                <Button variant="default" className="font-light rounded-full tracking-normal" asChild>
                  <Link to="/login">Sign In</Link>
                </Button>
                <Button variant="default" className="font-light rounded-full tracking-normal" asChild>
                  <Link to="/client-community">Join BraidsNow Community</Link>
                </Button>
              </div>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button className="md:hidden p-2 rounded-md text-[#3F0052]">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      <LogoutConfirmation 
        isOpen={showLogoutConfirmation}
        onClose={() => setShowLogoutConfirmation(false)}
      />
    </header>
  );
}