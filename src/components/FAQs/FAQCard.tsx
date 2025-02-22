import React from 'react';
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Plus } from 'lucide-react';

interface FAQCardProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onClick: () => void;
}

export function FAQCard({ question, answer, isOpen, onClick }: FAQCardProps) {
  return (
    <Card 
      className="cursor-pointer group hover:shadow-md transition-all duration-200 border-[#3F0052]/10 bg-white"
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between p-6">
        <h3 className="text-xl font-light text-[#3F0052] group-hover:text-[#DFA801] transition-colors pr-8 tracking-normal">
          {question}
        </h3>
        <Plus 
          className={`h-5 w-5 flex-shrink-0 text-[#3F0052] transition-transform duration-200 ${
            isOpen ? 'rotate-45' : ''
          }`}
        />
      </CardHeader>
      {isOpen && (
        <CardContent className="px-6 pb-6 pt-0">
          <p className="text-black leading-relaxed tracking-normal">
            {answer}
          </p>
        </CardContent>
      )}
    </Card>
  );
}