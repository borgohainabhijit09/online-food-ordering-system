'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, Calendar, ArrowUpRight, ArrowDownRight, Layers, Loader2 } from 'lucide-react';
import { apiClient } from '../../../lib/apiClient';

interface ForecastItem {
  id: string;
  ingredient: string;
  currentStock: number;
  predictedNeeded: number;
  trend: 'up' | 'down' | 'flat';
  pctChange: number;
  unit: string;
  costPerUnit: number;
}

export default function ConsumptionForecastPage() {
  const [daysFilter, setDaysFilter] = useState('7');
  const [forecast, setForecast] = useState<ForecastItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchForecast = async () => {
      setIsLoading(true);
      try {
        const data = await apiClient.fetch(`/api/inventory/forecast?days=${daysFilter}`);
        setForecast(data || []);
      } catch (error) {
        console.error('Error fetching forecast:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchForecast();
  }, [daysFilter]);

  const estimatedPurchaseCost = forecast.reduce((total, item) => {
    const deficit = Math.max(0, item.predictedNeeded - item.currentStock);
    return total + (deficit * item.costPerUnit);
  }, 0);

  return (
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
          {['3', '7', '30'].map(d => (
            <button 
              key={d}
              onClick={() => setDaysFilter(d)}
              className={`px-3 py-1.5 rounded-lg transition-colors ${daysFilter === d ? 'bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white shadow-sm' : 'text-neutral-500'}`}
            >
              {d} Days
            </button>
          ))}
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
            Based on historical sales data over the past 30 days and precise recipe formulations, we've projected the raw materials you need to fulfill expected demand.
          </p>
        </div>
        <div className="bg-neutral-50 dark:bg-neutral-900/50 rounded-2xl p-5 border border-neutral-100 dark:border-neutral-800/50 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Estimated Purchase Cost</p>
              <p className="text-2xl font-extrabold text-neutral-900 dark:text-white mt-1">₹{estimatedPurchaseCost.toLocaleString()}</p>
            </div>
            <span className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-500 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
              Data-Driven
            </span>
          </div>
          <p className="text-[10px] text-neutral-400 mt-4 leading-normal">
            Purchasing raw materials aligned with this forecast can significantly reduce food spoilage waste compared to static bulk buying.
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
              <th className="px-6 py-4">Trend (vs Prev 15d)</th>
              <th className="px-6 py-4 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-850">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-neutral-500">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-orange-500 mb-2" />
                  Generating forecast based on historical data...
                </td>
              </tr>
            ) : forecast.length > 0 ? (
              forecast.map((item, idx) => {
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
                      ) : item.trend === 'down' ? (
                        <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-500 font-bold text-[11px]">
                          <ArrowDownRight className="w-3.5 h-3.5" /> {item.pctChange}%
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-neutral-500 font-bold text-[11px]">
                          Flat
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
              })
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-neutral-500">
                  Not enough historical data to generate forecast.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
