'use client';

import React, { useState } from 'react';
import { Plus, Minus } from 'lucide-react';

const faqs = [
  {
    question: "Will I receive orders directly on WhatsApp?",
    answer: "Yes! Every time a customer places an order on your RestoBuddy menu, you instantly receive a structured, easy-to-read order summary directly on your designated WhatsApp number. No separate devices or tablets required."
  },
  {
    question: "Can I continue using Swiggy and Zomato?",
    answer: "Absolutely. We encourage you to use delivery apps to discover new customers. Once they order, use your RestoBuddy link (via flyers, social media, or packaging) to convert them into direct customers for their next order, saving you 20-30%."
  },
  {
    question: "How long does setup take?",
    answer: "Most restaurants are fully set up in under 15 minutes. Just upload your logo, add your menu items, and you instantly receive your unique ordering link. No coding or technical skills required."
  },
  {
    question: "What happens after my trial ends?",
    answer: "After your 15-day free trial, you can choose either the Starter or Growth plan. If you decide RestoBuddy isn't for you, there are absolutely no cancellation fees or hidden charges."
  },
  {
    question: "Can I use my own domain name? (e.g., myrestaurant.com)",
    answer: "Yes! If you choose the Growth plan, you can connect your own custom domain so your brand looks 100% professional and independent."
  },
  {
    question: "How many products can I add?",
    answer: "Unlimited. There are no restrictions on the number of menu items, categories, or variants you can add to your RestoBuddy storefront."
  },
  {
    question: "Is there any commission on orders?",
    answer: "0%. We charge a flat monthly subscription fee (as low as ₹499/month). Whether you get 10 orders or 10,000 orders, you never pay us a single rupee in commission."
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
