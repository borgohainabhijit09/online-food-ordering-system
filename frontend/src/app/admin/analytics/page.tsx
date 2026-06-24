'use client';

import React, { useState } from 'react';
import FeatureGate from '../../../components/FeatureGate';
import { BarChart3, TrendingUp, DollarSign, ShoppingBag, Percent, ArrowUpRight, Calendar } from 'lucide-react';

export default function AnalyticsPage() {
  const [range, setRange] = useState('7d');

  return (
    <FeatureGate
      feature="ADVANCED_ANALYTICS"
      featureName="Advanced Analytics"
      featureDescription="Unlock deep business intelligence. Understand your peak service hours, highest-margin menu items, returning customer metrics, and cost-of-goods-sold analysis."
    >
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-5">
          <div>
            <h1 className="text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight flex items-center gap-2">
              <BarChart3 className="w-8 h-8 text-orange-500" /> Advanced Analytics
            </h1>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">Deep dive business reports, profitability ratios, and customer retention analysis.</p>
          </div>
          
          <div className="flex items-center gap-2">
            <select
              value={range}
              onChange={(e) => setRange(e.target.value)}
              className="px-4 py-2 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 text-sm transition-all font-semibold"
            >
              <option value="today">Today</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="ytd">Year to Date</option>
            </select>
          </div>
        </div>

        {/* Analytics Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-neutral-950 p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Gross Revenue</span>
              <div className="w-8 h-8 bg-orange-50 dark:bg-orange-950/20 text-orange-600 rounded-lg flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-extrabold text-neutral-900 dark:text-white">₹1,84,250</h3>
              <p className="text-xs text-emerald-600 dark:text-emerald-500 font-bold mt-1.5 flex items-center gap-0.5">
                <ArrowUpRight className="w-3.5 h-3.5" /> +14.8% vs last week
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-950 p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Total Orders</span>
              <div className="w-8 h-8 bg-orange-50 dark:bg-orange-950/20 text-orange-600 rounded-lg flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-extrabold text-neutral-900 dark:text-white">412</h3>
              <p className="text-xs text-emerald-600 dark:text-emerald-500 font-bold mt-1.5 flex items-center gap-0.5">
                <ArrowUpRight className="w-3.5 h-3.5" /> +8.3% vs last week
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-950 p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">COGS Margin</span>
              <div className="w-8 h-8 bg-orange-50 dark:bg-orange-950/20 text-orange-600 rounded-lg flex items-center justify-center">
                <Percent className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-extrabold text-neutral-900 dark:text-white">28.4%</h3>
              <p className="text-xs text-emerald-600 dark:text-emerald-500 font-bold mt-1.5 flex items-center gap-0.5">
                <ArrowUpRight className="w-3.5 h-3.5" /> -1.2% Cost Saving
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-950 p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Net Profit</span>
              <div className="w-8 h-8 bg-orange-50 dark:bg-orange-950/20 text-orange-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-extrabold text-neutral-900 dark:text-white">₹1,31,900</h3>
              <p className="text-xs text-emerald-600 dark:text-emerald-500 font-bold mt-1.5 flex items-center gap-0.5">
                <ArrowUpRight className="w-3.5 h-3.5" /> +16.2% Profitability
              </p>
            </div>
          </div>
        </div>

        {/* Detailed Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Top Selling Items */}
          <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-sm col-span-2 space-y-4">
            <h3 className="font-extrabold text-neutral-900 dark:text-white text-lg">Top Margin Contributors</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Items that generated the most gross profit margin this week.</p>
            
            <div className="space-y-3.5 mt-4">
              <div className="flex items-center justify-between text-xs border-b border-neutral-100 dark:border-neutral-850 pb-3">
                <div>
                  <p className="font-bold text-neutral-900 dark:text-white">Margherita Pizza</p>
                  <p className="text-neutral-400">120 sold • COGS 18%</p>
                </div>
                <span className="font-extrabold text-neutral-950 dark:text-white">₹58,400 profit</span>
              </div>
              <div className="flex items-center justify-between text-xs border-b border-neutral-100 dark:border-neutral-850 pb-3">
                <div>
                  <p className="font-bold text-neutral-900 dark:text-white">Classic Cheeseburger</p>
                  <p className="text-neutral-400">155 sold • COGS 25%</p>
                </div>
                <span className="font-extrabold text-neutral-950 dark:text-white">₹46,200 profit</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-neutral-900 dark:text-white">Truffle Mushroom Pasta</p>
                  <p className="text-neutral-400">65 sold • COGS 22%</p>
                </div>
                <span className="font-extrabold text-neutral-950 dark:text-white">₹27,300 profit</span>
              </div>
            </div>
          </div>

          {/* Peak Hourly Traffic */}
          <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
            <div className="space-y-2">
              <h3 className="font-extrabold text-neutral-900 dark:text-white text-lg">Peak Service Hours</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Dine-in and ordering traffic distribution by hour.</p>
            </div>
            
            <div className="space-y-2.5 mt-6">
              <div>
                <div className="flex justify-between text-[11px] font-bold text-neutral-600 dark:text-neutral-400 mb-1">
                  <span>Lunch Rush (12:00 - 15:00)</span>
                  <span>75% Capacity</span>
                </div>
                <div className="w-full bg-neutral-100 dark:bg-neutral-900 h-2 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-orange-500 to-amber-500 h-full rounded-full" style={{ width: '75%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[11px] font-bold text-neutral-600 dark:text-neutral-400 mb-1">
                  <span>Dinner Peak (19:00 - 22:00)</span>
                  <span>95% Capacity</span>
                </div>
                <div className="w-full bg-neutral-100 dark:bg-neutral-900 h-2 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-orange-500 to-amber-500 h-full rounded-full" style={{ width: '95%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[11px] font-bold text-neutral-600 dark:text-neutral-400 mb-1">
                  <span>Late Night (22:00 - 00:00)</span>
                  <span>35% Capacity</span>
                </div>
                <div className="w-full bg-neutral-100 dark:bg-neutral-900 h-2 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-orange-500 to-amber-500 h-full rounded-full" style={{ width: '35%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </FeatureGate>
  );
}
