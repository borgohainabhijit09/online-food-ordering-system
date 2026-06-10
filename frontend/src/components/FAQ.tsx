'use client';

import React, { useState } from 'react';
import { Plus, Minus } from 'lucide-react';

const faqs = [
  {
    question: "Will this replace Swiggy or Zomato?",
    answer: "Not necessarily. Swiggy and Zomato are great for customer discovery. RestoBuddy is for converting those customers into your direct, loyal customers so you don't keep paying 20-30% commission every time they order."
  },
  {
    question: "How quickly can I start accepting orders?",
    answer: "Within 15 minutes. Just sign up, add your menu items, and you instantly get a custom link and QR code to share with your customers or put on your tables."
  },
  {
    question: "Do I need technical knowledge?",
    answer: "Zero. If you can use WhatsApp or Facebook, you can use RestoBuddy. We designed it specifically for busy restaurant owners, not tech experts."
  },
  {
    question: "Can customers order from mobile?",
    answer: "Yes! RestoBuddy is built to look and feel like a modern mobile app on your customer's phone, but they don't have to download anything from the App Store. They just click a link and order."
  },
  {
    question: "Can I use my own domain name? (e.g., myrestaurant.com)",
    answer: "Absolutely! The RestoBuddy Growth plan allows you to link your custom domain so your brand looks 100% professional."
  },
  {
    question: "Can I cancel anytime?",
    answer: "Yes. There are no lock-in contracts or hidden cancellation fees. You can pause or cancel your subscription at any time right from your dashboard."
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
