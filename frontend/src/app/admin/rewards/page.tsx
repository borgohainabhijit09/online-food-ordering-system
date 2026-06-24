'use client';

import React, { useState } from 'react';
import FeatureGate from '../../../components/FeatureGate';
import { Award, Gift, ShieldAlert, Star, Users, ToggleLeft, ToggleRight } from 'lucide-react';

export default function RewardsPage() {
  const [isActive, setIsActive] = useState(true);
  const [pointsPerRupee, setPointsPerRupee] = useState('1');

  return (
    <FeatureGate
      feature="REWARDS"
      featureName="Rewards Program"
      featureDescription="Engage your customers with points, reward campaigns, tiers (VIP/Elite), and birthday discount codes. Automatically boost repeat orders and customer retention."
      requiredPlan="Growth"
    >
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-5">
          <div>
            <h1 className="text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight flex items-center gap-2">
              <Award className="w-8 h-8 text-orange-500" /> Rewards Program
            </h1>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">Configure customer loyalty points and unlock rewards tiers.</p>
          </div>
          
          <button 
            onClick={() => setIsActive(!isActive)}
            className="inline-flex items-center gap-2"
          >
            {isActive ? (
              <span className="flex items-center gap-2 text-emerald-600 dark:text-emerald-500 font-extrabold text-sm">
                Active <ToggleRight className="w-9 h-9" />
              </span>
            ) : (
              <span className="flex items-center gap-2 text-neutral-400 font-extrabold text-sm">
                Disabled <ToggleLeft className="w-9 h-9" />
              </span>
            )}
          </button>
        </div>

        {/* Configurations grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1 */}
          <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 p-6 rounded-3xl shadow-sm flex flex-col justify-between">
            <div className="space-y-2">
              <div className="w-10 h-10 bg-orange-50 dark:bg-orange-950/20 text-orange-600 rounded-xl flex items-center justify-center">
                <Star className="w-5 h-5" />
              </div>
              <h4 className="font-extrabold text-neutral-900 dark:text-white mt-4">Point Accrual</h4>
              <p className="text-xs text-neutral-400">Specify how many points are awarded per rupee spent.</p>
            </div>
            
            <div className="mt-6 flex items-center gap-2">
              <input 
                type="number"
                value={pointsPerRupee}
                onChange={(e) => setPointsPerRupee(e.target.value)}
                className="w-20 px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none text-xs font-bold text-center"
              />
              <span className="text-xs text-neutral-500">Points / ₹1.00</span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 p-6 rounded-3xl shadow-sm flex flex-col justify-between">
            <div className="space-y-2">
              <div className="w-10 h-10 bg-orange-50 dark:bg-orange-950/20 text-orange-600 rounded-xl flex items-center justify-center">
                <Gift className="w-5 h-5" />
              </div>
              <h4 className="font-extrabold text-neutral-900 dark:text-white mt-4">Free Drink Threshold</h4>
              <p className="text-xs text-neutral-400">Points required for customer to redeem a free beverage.</p>
            </div>
            
            <div className="mt-6 font-bold text-neutral-900 dark:text-neutral-100 text-sm">
              500 points
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 p-6 rounded-3xl shadow-sm flex flex-col justify-between">
            <div className="space-y-2">
              <div className="w-10 h-10 bg-orange-50 dark:bg-orange-950/20 text-orange-600 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <h4 className="font-extrabold text-neutral-900 dark:text-white mt-4">Enrolled Members</h4>
              <p className="text-xs text-neutral-400">Total active customers in the loyalty program.</p>
            </div>
            
            <div className="mt-6 font-extrabold text-neutral-900 dark:text-neutral-100 text-2xl">
              1,240 <span className="text-xs text-emerald-600 font-bold ml-1.5">+18% this month</span>
            </div>
          </div>
        </div>

      </div>
    </FeatureGate>
  );
}
