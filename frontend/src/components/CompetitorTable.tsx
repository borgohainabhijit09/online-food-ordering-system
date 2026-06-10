'use client';

import React from 'react';
import { Check, X } from 'lucide-react';
import { motion } from 'framer-motion';

const comparisons = [
  { feature: 'Commission per order', us: '0% (Flat Monthly Fee)', them: '20% - 30%', winner: 'us' },
  { feature: 'Customer Database', us: 'You own 100% of the data', them: 'They hide customer details', winner: 'us' },
  { feature: 'Direct Marketing', us: 'Send SMS / WhatsApp campaigns', them: 'Not allowed', winner: 'us' },
  { feature: 'Customer Ownership', us: 'They belong to your brand', them: 'They belong to the app', winner: 'us' },
  { feature: 'Repeat Customer Tools', us: 'Coupons & Loyalty Programs', them: 'Expensive to run ads', winner: 'us' },
  { feature: 'Order Reception', us: 'Directly on WhatsApp', them: 'Requires their device/tablet', winner: 'us' }
];

export default function CompetitorTable() {
  return (
    <div className="w-full max-w-5xl mx-auto overflow-hidden rounded-[2rem] border border-neutral-200 dark:border-neutral-800 shadow-2xl">
      <div className="grid grid-cols-3 bg-neutral-100 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
        <div className="p-6 font-bold text-neutral-500 dark:text-neutral-400 flex items-center">
          Feature
        </div>
        <div className="p-6 font-black text-xl text-orange-600 dark:text-orange-500 flex items-center justify-center border-l border-neutral-200 dark:border-neutral-800 bg-orange-50 dark:bg-orange-900/10">
          RestoBuddy
        </div>
        <div className="p-6 font-bold text-xl text-neutral-900 dark:text-white flex items-center justify-center border-l border-neutral-200 dark:border-neutral-800">
          Delivery Apps
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-950 divide-y divide-neutral-100 dark:divide-neutral-800/50">
        {comparisons.map((item, index) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: index * 0.1 }}
            key={item.feature} 
            className="grid grid-cols-3 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors"
          >
            <div className="p-6 font-semibold text-neutral-800 dark:text-neutral-200 flex items-center">
              {item.feature}
            </div>
            <div className="p-6 border-l border-neutral-100 dark:border-neutral-800/50 bg-orange-50/50 dark:bg-orange-900/5 flex items-center justify-center text-center">
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <Check className="w-5 h-5" />
                </div>
                <span className="font-bold text-neutral-900 dark:text-white text-sm md:text-base">{item.us}</span>
              </div>
            </div>
            <div className="p-6 border-l border-neutral-100 dark:border-neutral-800/50 flex items-center justify-center text-center">
              <div className="flex flex-col items-center gap-2 opacity-70">
                <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400">
                  <X className="w-5 h-5" />
                </div>
                <span className="font-medium text-neutral-500 dark:text-neutral-400 text-sm md:text-base">{item.them}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      
      <div className="bg-orange-600 p-6 text-center text-white">
        <p className="font-bold text-lg md:text-xl tracking-tight">Stop renting your customers. Start owning them.</p>
      </div>
    </div>
  );
}
