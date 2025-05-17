import { Link } from 'react-router-dom';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/use-auth';
import { useUserData } from '@/hooks/use-user-data';

export function UserProfile() {
  const { user } = useAuth();
  const { userData } = useUserData(user?.uid);

  if (!userData) return null;

  const dashboardPath = userData.userType === 'client' 
    ? '/dashboard/client' 
    : '/dashboard/stylist';

  return (
    <Link to={dashboardPath} className="flex items-center space-x-3 group">
      <Avatar className="h-12 w-12 border-2 border-[#3F0052] transition-transform group-hover:scale-105">
        <AvatarImage src={userData.profileImage} alt={userData.firstName} />
        <AvatarFallback className="bg-[#3F0052] text-white">
          {userData.firstName?.[0]}
        </AvatarFallback>
      </Avatar>
      <div className="hidden md:block">
        <p className="text-md font-light tracking-normal text-[#3F0052] group-hover:text-[#DFA801] transition-colors">
          Hi, {userData.firstName}!
        </p>
      </div>
    </Link>
  );
}