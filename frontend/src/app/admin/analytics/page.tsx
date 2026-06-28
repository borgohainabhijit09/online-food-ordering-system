'use client';

import React, { useState, useEffect } from 'react';
import FeatureGate from '../../../components/FeatureGate';
import { apiClient } from '../../../lib/apiClient';
import { BarChart3, TrendingUp, DollarSign, ShoppingBag, Percent, ArrowUpRight, Calendar, Loader2, Users, Star, AlertTriangle, HelpCircle, XOctagon } from 'lucide-react';

export default function AnalyticsPage() {
  const [range, setRange] = useState('7d');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get(`/api/analytics?range=${range}`);
        if (res.ok) {
          setData(await res.json());
        }
      } catch (err) {
        console.error('Failed to fetch analytics', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [range]);

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
        {loading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          </div>
        ) : data ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-neutral-950 p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Gross Revenue</span>
              <div className="w-8 h-8 bg-orange-50 dark:bg-orange-950/20 text-orange-600 rounded-lg flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-extrabold text-neutral-900 dark:text-white">₹{data.grossRevenue?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</h3>
              <p className={`text-xs font-bold mt-1.5 flex items-center gap-0.5 ${data.revenueTrend >= 0 ? 'text-emerald-600 dark:text-emerald-500' : 'text-red-500'}`}>
                <ArrowUpRight className="w-3.5 h-3.5" /> {data.revenueTrend >= 0 ? '+' : ''}{data.revenueTrend}% vs prev
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
              <h3 className="text-2xl font-extrabold text-neutral-900 dark:text-white">{data.totalOrders}</h3>
              <p className={`text-xs font-bold mt-1.5 flex items-center gap-0.5 ${data.ordersTrend >= 0 ? 'text-emerald-600 dark:text-emerald-500' : 'text-red-500'}`}>
                <ArrowUpRight className="w-3.5 h-3.5" /> {data.ordersTrend >= 0 ? '+' : ''}{data.ordersTrend}% vs prev
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
              <h3 className="text-2xl font-extrabold text-neutral-900 dark:text-white">{data.cogsMargin}%</h3>
              <p className={`text-xs font-bold mt-1.5 flex items-center gap-0.5 ${data.cogsTrend <= 0 ? 'text-emerald-600 dark:text-emerald-500' : 'text-red-500'}`}>
                <ArrowUpRight className="w-3.5 h-3.5" /> {data.cogsTrend <= 0 ? '' : '+'}{data.cogsTrend}% Cost Trend
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
              <h3 className="text-2xl font-extrabold text-neutral-900 dark:text-white">₹{data.netProfit?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</h3>
              <p className={`text-xs font-bold mt-1.5 flex items-center gap-0.5 ${data.profitTrend >= 0 ? 'text-emerald-600 dark:text-emerald-500' : 'text-red-500'}`}>
                <ArrowUpRight className="w-3.5 h-3.5" /> {data.profitTrend >= 0 ? '+' : ''}{data.profitTrend}% Profitability
              </p>
            </div>
          </div>
        </div>
        ) : null}

        {/* Detailed Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Top Selling Items */}
          <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-sm col-span-2 space-y-4">
            <h3 className="font-extrabold text-neutral-900 dark:text-white text-lg">Top Margin Contributors</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Items that generated the most gross profit margin this period.</p>
            
            <div className="space-y-3.5 mt-4">
              {data?.topMarginItems && data.topMarginItems.length > 0 ? (
                data.topMarginItems.map((item: any, idx: number) => (
                  <div key={idx} className={`flex items-center justify-between text-xs ${idx < data.topMarginItems.length - 1 ? 'border-b border-neutral-100 dark:border-neutral-850 pb-3' : ''}`}>
                    <div>
                      <p className="font-bold text-neutral-900 dark:text-white">{item.name}</p>
                      <p className="text-neutral-400">{item.quantity} sold • COGS {item.cogsPercentage}%</p>
                    </div>
                    <span className="font-extrabold text-neutral-950 dark:text-white">₹{item.profit.toLocaleString('en-IN', { maximumFractionDigits: 2 })} profit</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-neutral-500">No data available for this period.</p>
              )}
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
                  <span>{data?.peakHours?.lunch || 0}% Capacity</span>
                </div>
                <div className="w-full bg-neutral-100 dark:bg-neutral-900 h-2 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-orange-500 to-amber-500 h-full rounded-full transition-all duration-1000" style={{ width: `${data?.peakHours?.lunch || 0}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[11px] font-bold text-neutral-600 dark:text-neutral-400 mb-1">
                  <span>Dinner Peak (19:00 - 22:00)</span>
                  <span>{data?.peakHours?.dinner || 0}% Capacity</span>
                </div>
                <div className="w-full bg-neutral-100 dark:bg-neutral-900 h-2 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-orange-500 to-amber-500 h-full rounded-full transition-all duration-1000" style={{ width: `${data?.peakHours?.dinner || 0}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[11px] font-bold text-neutral-600 dark:text-neutral-400 mb-1">
                  <span>Late Night (22:00 - 00:00)</span>
                  <span>{data?.peakHours?.late || 0}% Capacity</span>
                </div>
                <div className="w-full bg-neutral-100 dark:bg-neutral-900 h-2 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-orange-500 to-amber-500 h-full rounded-full transition-all duration-1000" style={{ width: `${data?.peakHours?.late || 0}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Retention & Menu Engineering */}
        {data && data.customerRetention && data.menuMatrix ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            
            {/* Customer Retention */}
            <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-50 dark:bg-blue-950/30 text-blue-600 rounded-lg flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                  <h3 className="font-extrabold text-neutral-900 dark:text-white text-lg">Customer Retention</h3>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">Revenue split between VIP, repeat, and new customers.</p>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-end gap-2">
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">VIP</p>
                    <p className="text-lg font-extrabold text-purple-500">₹{(data.customerRetention.vipCustomerRevenue || 0).toLocaleString('en-IN')}</p>
                    <p className="text-xs text-neutral-500 font-medium">
                      {(data.customerRetention.vipCustomerRevenue || 0) + data.customerRetention.returningCustomerRevenue + data.customerRetention.newCustomerRevenue > 0 
                        ? Math.round(((data.customerRetention.vipCustomerRevenue || 0) / ((data.customerRetention.vipCustomerRevenue || 0) + data.customerRetention.returningCustomerRevenue + data.customerRetention.newCustomerRevenue)) * 100) 
                        : 0}% • {data.customerRetention.vipCustomerOrders || 0} ords
                    </p>
                  </div>
                  <div className="flex-1 text-center border-x border-neutral-100 dark:border-neutral-800">
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Repeat</p>
                    <p className="text-lg font-extrabold text-blue-600">₹{(data.customerRetention.returningCustomerRevenue || 0).toLocaleString('en-IN')}</p>
                    <p className="text-xs text-neutral-500 font-medium">
                      {(data.customerRetention.vipCustomerRevenue || 0) + data.customerRetention.returningCustomerRevenue + data.customerRetention.newCustomerRevenue > 0 
                        ? Math.round(((data.customerRetention.returningCustomerRevenue || 0) / ((data.customerRetention.vipCustomerRevenue || 0) + data.customerRetention.returningCustomerRevenue + data.customerRetention.newCustomerRevenue)) * 100) 
                        : 0}% • {data.customerRetention.returningCustomerOrders || 0} ords
                    </p>
                  </div>
                  <div className="flex-1 text-right">
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">New</p>
                    <p className="text-lg font-extrabold text-emerald-500">₹{(data.customerRetention.newCustomerRevenue || 0).toLocaleString('en-IN')}</p>
                    <p className="text-xs text-neutral-500 font-medium">
                      {(data.customerRetention.vipCustomerRevenue || 0) + data.customerRetention.returningCustomerRevenue + data.customerRetention.newCustomerRevenue > 0 
                        ? Math.round(((data.customerRetention.newCustomerRevenue || 0) / ((data.customerRetention.vipCustomerRevenue || 0) + data.customerRetention.returningCustomerRevenue + data.customerRetention.newCustomerRevenue)) * 100) 
                        : 0}% • {data.customerRetention.newCustomerOrders || 0} ords
                    </p>
                  </div>
                </div>

                {/* Progress bar visual */}
                <div className="w-full h-3 flex rounded-full overflow-hidden">
                  <div 
                    className="bg-purple-500 transition-all duration-1000" 
                    style={{ width: `${((data.customerRetention.vipCustomerRevenue || 0) / (((data.customerRetention.vipCustomerRevenue || 0) + (data.customerRetention.returningCustomerRevenue || 0) + (data.customerRetention.newCustomerRevenue || 0)) || 1)) * 100}%` }}
                  ></div>
                  <div 
                    className="bg-blue-600 transition-all duration-1000" 
                    style={{ width: `${((data.customerRetention.returningCustomerRevenue || 0) / (((data.customerRetention.vipCustomerRevenue || 0) + (data.customerRetention.returningCustomerRevenue || 0) + (data.customerRetention.newCustomerRevenue || 0)) || 1)) * 100}%` }}
                  ></div>
                  <div 
                    className="bg-emerald-500 transition-all duration-1000" 
                    style={{ width: `${((data.customerRetention.newCustomerRevenue || 0) / (((data.customerRetention.vipCustomerRevenue || 0) + (data.customerRetention.returningCustomerRevenue || 0) + (data.customerRetention.newCustomerRevenue || 0)) || 1)) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Menu Engineering Matrix */}
            <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-sm">
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-amber-50 dark:bg-amber-950/30 text-amber-500 rounded-lg flex items-center justify-center">
                    <Star className="w-4 h-4" />
                  </div>
                  <h3 className="font-extrabold text-neutral-900 dark:text-white text-lg">Menu Engineering</h3>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">Menu item classification based on popularity and profitability.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Stars */}
                <div className="bg-orange-50/50 dark:bg-orange-950/10 p-3 rounded-2xl border border-orange-100 dark:border-orange-900/30">
                  <h4 className="text-xs font-bold text-orange-600 dark:text-orange-500 flex items-center gap-1.5 mb-2">
                    <Star className="w-3.5 h-3.5" /> Stars
                  </h4>
                  <p className="text-[10px] text-neutral-500 leading-tight mb-2">High Profit, High Volume. Promote these!</p>
                  <ul className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 space-y-1">
                    {data.menuMatrix.stars.slice(0, 2).map((s: any, i: number) => (
                      <li key={i} className="truncate">• {s.name}</li>
                    ))}
                    {data.menuMatrix.stars.length === 0 && <li className="text-neutral-400">None this period</li>}
                  </ul>
                </div>

                {/* Plowhorses */}
                <div className="bg-blue-50/50 dark:bg-blue-950/10 p-3 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                  <h4 className="text-xs font-bold text-blue-600 dark:text-blue-500 flex items-center gap-1.5 mb-2">
                    <TrendingUp className="w-3.5 h-3.5" /> Plowhorses
                  </h4>
                  <p className="text-[10px] text-neutral-500 leading-tight mb-2">Low Profit, High Volume. Raise price slightly.</p>
                  <ul className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 space-y-1">
                    {data.menuMatrix.plowhorses.slice(0, 2).map((p: any, i: number) => (
                      <li key={i} className="truncate">• {p.name}</li>
                    ))}
                    {data.menuMatrix.plowhorses.length === 0 && <li className="text-neutral-400">None this period</li>}
                  </ul>
                </div>

                {/* Puzzles */}
                <div className="bg-purple-50/50 dark:bg-purple-950/10 p-3 rounded-2xl border border-purple-100 dark:border-purple-900/30">
                  <h4 className="text-xs font-bold text-purple-600 dark:text-purple-500 flex items-center gap-1.5 mb-2">
                    <HelpCircle className="w-3.5 h-3.5" /> Puzzles
                  </h4>
                  <p className="text-[10px] text-neutral-500 leading-tight mb-2">High Profit, Low Volume. Needs better placement.</p>
                  <ul className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 space-y-1">
                    {data.menuMatrix.puzzles.slice(0, 2).map((p: any, i: number) => (
                      <li key={i} className="truncate">• {p.name}</li>
                    ))}
                    {data.menuMatrix.puzzles.length === 0 && <li className="text-neutral-400">None this period</li>}
                  </ul>
                </div>

                {/* Dogs */}
                <div className="bg-red-50/50 dark:bg-red-950/10 p-3 rounded-2xl border border-red-100 dark:border-red-900/30">
                  <h4 className="text-xs font-bold text-red-600 dark:text-red-500 flex items-center gap-1.5 mb-2">
                    <XOctagon className="w-3.5 h-3.5" /> Dogs
                  </h4>
                  <p className="text-[10px] text-neutral-500 leading-tight mb-2">Low Profit, Low Volume. Consider removing.</p>
                  <ul className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 space-y-1">
                    {data.menuMatrix.dogs.slice(0, 2).map((d: any, i: number) => (
                      <li key={i} className="truncate">• {d.name}</li>
                    ))}
                    {data.menuMatrix.dogs.length === 0 && <li className="text-neutral-400">None this period</li>}
                  </ul>
                </div>
              </div>
            </div>
            
          </div>
        ) : null}
        
      </div>
    </FeatureGate>
  );
}
