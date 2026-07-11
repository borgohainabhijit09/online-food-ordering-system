'use client';

import React, { useState } from 'react';
import { Plus, Minus } from 'lucide-react';

const faqs = [
  {
    question: "Can I use RestoBuddy without changing my current POS?",
    answer: "Yes. RestoBuddy is built to work alongside your existing POS system. You don't need to replace any of your current setup to start accepting direct orders."
  },
  {
    question: "Does it support WhatsApp Ordering?",
    answer: "Yes. Customers can browse your menu and place their orders directly via WhatsApp. You will receive structured, easy-to-read order details instantly."
  },
  {
    question: "Can customers order without downloading an app?",
    answer: "Absolutely. Customers simply scan a QR code or click your direct ordering link to browse and order from their mobile browser. No app download required."
  },
  {
    question: "Is it suitable for small restaurants?",
    answer: "Yes. RestoBuddy is designed specifically for independent restaurants, cafes, and bakeries. It requires zero tech skills and fits even the smallest operations."
  },
  {
    question: "Does it work for multiple outlets?",
    answer: "Yes. You can manage multiple restaurant locations, menus, inventory, and staff roles from a single unified RestoBuddy owner dashboard."
  },
  {
    question: "Is onboarding included?",
    answer: "Yes. We provide complete setup assistance, menu uploading support, and staff training to ensure your restaurant is running smoothly from day one."
  }
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="max-w-3xl mx-auto divide-y divide-neutral-200 dark:divide-neutral-800">
      {faqs.map((faq, index) => (
        <div key={index} className="py-5">
          <button
            onClick={() => toggleFaq(index)}
            className="flex w-full items-center justify-between text-left focus:outline-none"
          >
            <span className="text-lg font-bold text-neutral-900 dark:text-neutral-100 pr-4">
              {faq.question}
            </span>
            <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
              {openIndex === index ? (
                <Minus className="w-4 h-4" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
            </span>
          </button>
          
          <div 
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              openIndex === index ? 'max-h-96 opacity-100 mt-4' : 'max-h-0 opacity-0'
            }`}
          >
            <p className="text-neutral-600 dark:text-neutral-400 text-base leading-relaxed">
              {faq.answer}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
