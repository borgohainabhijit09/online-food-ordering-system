'use client';

import React, { useState, useEffect } from 'react';
import { IndianRupee, TrendingUp, AlertTriangle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function ROICalculator() {
  const [orders, setOrders] = useState(500);
  const [aov, setAov] = useState(400);
  const [commission, setCommission] = useState(20);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const totalRevenue = orders * aov;
  const platformFee = Math.round(totalRevenue * (commission / 100));
  const restobuddyFee = 499; // Starter plan
  const savings = platformFee - restobuddyFee;

  if (!isClient) return null; // Hydration fix

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-6 md:p-10 shadow-xl shadow-orange-900/5 max-w-4xl mx-auto">
      <div className="grid md:grid-cols-2 gap-12 items-center">
        
        {/* Sliders */}
        <div className="space-y-8">
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="font-bold text-neutral-700 dark:text-neutral-300">Orders per Month</label>
              <span className="font-mono bg-neutral-100 dark:bg-neutral-800 px-3 py-1 rounded text-orange-600 font-bold">{orders}</span>
            </div>
            <input 
              type="range" 
              min="100" 
              max="5000" 
              step="50"
              value={orders}
              onChange={(e) => setOrders(Number(e.target.value))}
              className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-orange-600"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="font-bold text-neutral-700 dark:text-neutral-300">Average Order Value (₹)</label>
              <span className="font-mono bg-neutral-100 dark:bg-neutral-800 px-3 py-1 rounded text-orange-600 font-bold">₹{aov}</span>
            </div>
            <input 
              type="range" 
              min="100" 
              max="2000" 
              step="50"
              value={aov}
              onChange={(e) => setAov(Number(e.target.value))}
              className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-orange-600"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="font-bold text-neutral-700 dark:text-neutral-300">Aggregator Commission (%)</label>
              <span className="font-mono bg-neutral-100 dark:bg-neutral-800 px-3 py-1 rounded text-red-500 font-bold">{commission}%</span>
            </div>
            <input 
              type="range" 
              min="10" 
              max="35" 
              step="1"
              value={commission}
              onChange={(e) => setCommission(Number(e.target.value))}
              className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-red-500"
            />
          </div>
        </div>

        {/* Results */}
        <div className="bg-neutral-50 dark:bg-neutral-950 p-6 sm:p-8 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-6 relative overflow-hidden">
          {/* Decorative element */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl"></div>
          
          <div className="flex justify-between items-center pb-4 border-b border-neutral-200 dark:border-neutral-800">
            <span className="text-neutral-500 font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" /> You pay others
            </span>
            <span className="text-xl font-mono text-red-500 font-bold">₹{platformFee.toLocaleString('en-IN')}</span>
          </div>

          <div className="flex justify-between items-center pb-4 border-b border-neutral-200 dark:border-neutral-800">
            <span className="text-neutral-500 font-medium flex items-center gap-2">
              <img src="/favicon.ico" alt="" className="w-4 h-4 opacity-50 grayscale" onError={(e) => e.currentTarget.style.display='none'} />
              You pay RestoBuddy
            </span>
            <span className="text-xl font-mono font-bold text-neutral-800 dark:text-neutral-200">₹{restobuddyFee}</span>
          </div>

          <div className="pt-2">
            <p className="text-sm text-neutral-500 font-medium mb-1 uppercase tracking-wider">Your Potential Monthly Savings</p>
            <div className="text-4xl sm:text-5xl font-extrabold text-emerald-500 flex items-center gap-2">
              ₹{savings > 0 ? savings.toLocaleString('en-IN') : '0'}
            </div>
          </div>
          
          <div className="pt-4">
            <Link href="/signup" className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-transform hover:scale-105 active:scale-95 shadow-lg shadow-emerald-500/20">
              Start Saving Today <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
