import React, { useState } from 'react';
import { FAQCard } from './FAQCard';
import { faqData } from '@/data/faqData';

export function FAQList() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const handleCardClick = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {faqData.map((faq, index) => (
        <FAQCard
          key={index}
          question={faq.question}
          answer={faq.answer}
          isOpen={openIndex === index}
          onClick={() => handleCardClick(index)}
        />
      ))}
    </div>
  );
}