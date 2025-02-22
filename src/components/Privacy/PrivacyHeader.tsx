import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export function PrivacyHeader() {
  return (
    <div className="max-w-4xl mx-auto px-4 pt-24 pb-12">
      <Link 
        to="/" 
        className="inline-flex items-center text-[#3F0052] hover:text-[#DFA801] transition-colors mb-8 group"
      >
        <ArrowLeft className="h-4 w-4 mr-2 transition-transform group-hover:-translate-x-1" />
        <span className="tracking-normal">Return to Homepage</span>
      </Link>
      
      <div className="space-y-4">
        <h1 className="text-4xl font-light tracking-normal block mt-2 bg-gradient-to-r from-[#3F0052] to-[#DFA801] bg-clip-text text-transparent">
          Privacy Policy
        </h1>
      </div>
    </div>
  );
}