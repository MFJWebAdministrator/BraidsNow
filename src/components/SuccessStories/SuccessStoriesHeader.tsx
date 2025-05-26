import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export function SuccessStoriesHeader() {
  return (
    <div className="relative">
      <div className="absolute inset-0">
        <img 
          src="https://images.unsplash.com/photo-1605980776566-0486c3ac7617?auto=format&fit=crop&q=80"
          alt="Hair styling"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-[#3F0052]/90" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <Link 
          to="/" 
          className="inline-flex items-center text-white hover:text-[#DFA801] transition-colors mb-8 group"
        >
          <ArrowLeft className="h-4 w-4 mr-2 transition-transform group-hover:-translate-x-1" />
          <span className="tracking-normal">Return to Homepage</span>
        </Link>

        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-light text-white mb-4 tracking-normal">
            Success Stories
          </h1>
          <p className="text-xl text-white tracking-normal font-light max-w-2xl mx-auto">
            Meet the stylists who transformed their businesses with BraidsNow!
          </p>
        </div>
      </div>
    </div>
  );
}