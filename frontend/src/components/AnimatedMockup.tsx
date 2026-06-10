'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Smartphone, Store, MessageCircle, Database, Repeat, ArrowRight } from 'lucide-react';

const steps = [
  { icon: Smartphone, label: 'Customer', color: 'bg-blue-500' },
  { icon: Store, label: 'Ordering Page', color: 'bg-orange-500' },
  { icon: MessageCircle, label: 'WhatsApp Order', color: 'bg-green-500' },
  { icon: Database, label: 'Customer Database', color: 'bg-purple-500' },
  { icon: Repeat, label: 'Repeat Order', color: 'bg-emerald-500' }
];

export default function AnimatedMockup() {
  return (
    <div className="relative w-full max-w-4xl mx-auto h-[400px] flex items-center justify-center overflow-visible">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-orange-500/10 rounded-full blur-[100px] -z-10"></div>
      
      <div className="flex flex-wrap justify-center items-center gap-4 md:gap-8 relative z-10 w-full px-4">
        {steps.map((step, index) => (
          <React.Fragment key={step.label}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.3, duration: 0.5, type: 'spring' }}
              whileHover={{ scale: 1.05, y: -5 }}
              className="flex flex-col items-center bg-white dark:bg-neutral-900 p-4 md:p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xl shadow-neutral-900/10 dark:shadow-none min-w-[120px] md:min-w-[140px]"
            >
              <div className={`w-12 h-12 md:w-16 md:h-16 ${step.color} rounded-2xl flex items-center justify-center text-white mb-3 md:mb-4 shadow-lg`}>
                <step.icon className="w-6 h-6 md:w-8 md:h-8" />
              </div>
              <span className="font-bold text-sm md:text-base text-neutral-900 dark:text-white text-center">
                {step.label}
              </span>
            </motion.div>

            {index < steps.length - 1 && (
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.3 + 0.15, duration: 0.3 }}
                className="hidden md:flex text-neutral-300 dark:text-neutral-700"
              >
                <ArrowRight className="w-8 h-8" />
              </motion.div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
