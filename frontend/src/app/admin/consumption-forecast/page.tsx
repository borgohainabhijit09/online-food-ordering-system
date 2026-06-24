'use client';

import React, { useState } from 'react';
import FeatureGate from '../../../components/FeatureGate';
import { TrendingUp, Calendar, ArrowUpRight, ArrowDownRight, Layers } from 'lucide-react';

const mockForecast = [
  { ingredient: 'Burger Buns', currentStock: 120, predictedNeeded: 340, trend: 'up', pctChange: 15, unit: 'pcs' },
  { ingredient: 'Mozzarella Cheese', currentStock: 45, predictedNeeded: 110, trend: 'up', pctChange: 8, unit: 'kg' },
  { ingredient: 'Chicken Breast', currentStock: 60, predictedNeeded: 180, trend: 'down', pctChange: -4, unit: 'kg' },
  { ingredient: 'Tomatoes', currentStock: 80, predictedNeeded: 150, trend: 'up', pctChange: 22, unit: 'kg' },
  { ingredient: 'Pizza Dough Base', currentStock: 30, predictedNeeded: 95, trend: 'up', pctChange: 12, unit: 'pcs' }
];

export default function ConsumptionForecastPage() {
  const [daysFilter, setDaysFilter] = useState('7');

  return (
    <FeatureGate
      feature="CONSUMPTION_FORECAST"
      featureName="Consumption Forecast"
      featureDescription="Predict raw material consumption using order history, seasonality, and local event metrics. Buy exactly what you need and avoid overstocking."
    >
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-5">
          <div>
            <h1 className="text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight flex items-center gap-2">
              <TrendingUp className="w-8 h-8 text-orange-500" /> Consumption Forecast
            </h1>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">Predict inventory demand and raw material purchases for coming days.</p>
          </div>
          
          <div className="flex items-center gap-2 bg-neutral-100 dark:bg-neutral-900 p-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 text-xs font-semibold">
            <button 
              onClick={() => setDaysFilter('3')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${daysFilter === '3' ? 'bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white shadow-sm' : 'text-neutral-500'}`}
            >
              3 Days
            </button>
            <button 
              onClick={() => setDaysFilter('7')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${daysFilter === '7' ? 'bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white shadow-sm' : 'text-neutral-500'}`}
            >
              7 Days
            </button>
            <button 
              onClick={() => setDaysFilter('30')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${daysFilter === '30' ? 'bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white shadow-sm' : 'text-neutral-500'}`}
            >
              30 Days
            </button>
          </div>
        </div>

        {/* Hero Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-sm">
          <div className="space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-xs font-bold uppercase tracking-wider">
              <Calendar className="w-3.5 h-3.5" /> Next {daysFilter} Days Forecast
            </span>
            <h3 className="text-xl font-bold text-neutral-900 dark:text-white">Smart Purchase Recommendations</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Based on historical sales data from the same week in 2025, upcoming weekend weather (Sunny, 28°C), and local holiday indicators, we predict a **12% increase** in dine-in orders. We advise stocking up on cheese and dough ingredients.
            </p>
          </div>
          <div className="bg-neutral-50 dark:bg-neutral-900/50 rounded-2xl p-5 border border-neutral-100 dark:border-neutral-800/50 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Estimated Purchase Cost</p>
                <p className="text-2xl font-extrabold text-neutral-900 dark:text-white mt-1">₹14,250</p>
              </div>
              <span className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-500 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                <ArrowDownRight className="w-3 h-3" /> -4.2% Waste
              </span>
            </div>
            <p className="text-[10px] text-neutral-400 mt-4 leading-normal">
              Purchasing raw materials aligned with this forecast can reduce average food spoilage waste by an estimated 4% compared to static bulk buying.
            </p>
          </div>
        </div>

        {/* Forecast Table */}
        <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-3xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 dark:bg-neutral-900/30 border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Raw Material</th>
                <th className="px-6 py-4">Current Stock</th>
                <th className="px-6 py-4">Predicted Requirement</th>
                <th className="px-6 py-4">Trend Indicator</th>
                <th className="px-6 py-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-850">
              {mockForecast.map((item, idx) => {
                const deficit = item.predictedNeeded - item.currentStock;
                const isShort = deficit > 0;
                return (
                  <tr key={idx} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/10 transition-colors">
                    <td className="px-6 py-4 font-bold text-neutral-900 dark:text-white">
                      {item.ingredient}
                    </td>
                    <td className="px-6 py-4 text-neutral-600 dark:text-neutral-400 font-semibold">
                      {item.currentStock} {item.unit}
                    </td>
                    <td className="px-6 py-4 text-neutral-900 dark:text-neutral-100 font-bold">
                      {item.predictedNeeded} {item.unit}
                    </td>
                    <td className="px-6 py-4">
                      {item.trend === 'up' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-500 font-bold text-[11px]">
                          <ArrowUpRight className="w-3.5 h-3.5" /> +{item.pctChange}%
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-500 font-bold text-[11px]">
                          <ArrowDownRight className="w-3.5 h-3.5" /> {item.pctChange}%
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {isShort ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-500">
                          Reorder {deficit} {item.unit}
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-500">
                          Adequate Stock
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>
    </FeatureGate>
  );
}
