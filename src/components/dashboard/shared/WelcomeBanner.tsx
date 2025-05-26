interface WelcomeBannerProps {
  name: string;
  userType: 'client' | 'stylist';
}

export function WelcomeBanner({ name, userType }: WelcomeBannerProps) {
  return (
    <div className="bg-gradient-to-r from-[#3F0052] to-[#DFA801] rounded-lg p-8">
      <h1 className="text-3xl font-light tracking-normal text-white">
        Welcome back, {name}!
      </h1>
      <p className="text-white/80 mt-2 tracking-normal">
        {userType === 'client' 
          ? 'Manage your appointments and discover new styles'
          : 'View your schedule and manage your business'}
      </p>
    </div>
  );
}