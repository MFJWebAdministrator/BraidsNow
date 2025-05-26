import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export function StylistCommunityHeader() {
  return (
    <div className="max-w-4xl mx-auto px-4 pt-24 pb-12">
      <div className="flex justify-between items-center mb-8">
        <Link 
          to="/" 
          className="inline-flex items-center text-[#3F0052] hover:text-[#DFA801] transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 mr-2 transition-transform group-hover:-translate-x-1" />
          <span className="tracking-normal font-light">Return to Homepage</span>
        </Link>

        <Link
          to="/client-community"
          className="inline-flex items-center text-[#3F0052] hover:text-[#DFA801] transition-colors group"
        >
          <span className="tracking-normal font-bold">Not A Stylist?</span>
          <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
      
      <div className="space-y-4">
        <h1 className="text-4xl font-light tracking-normal">
          Join as a
          <span className="block mt-2 bg-gradient-to-r from-[#3F0052] to-[#DFA801] bg-clip-text text-transparent">
            Professional Stylist
          </span>
        </h1>
        <p className="text-lg text-black font-light tracking-normal">
          Create your stylist account and grow your business!
        </p>
      </div>
    </div>
  );
}