'use client';

import React, { useState, useEffect } from 'react';
import { IndianRupee, ShoppingBag, CalendarDays, Calendar, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await apiClient.get('/api/dashboard/stats');
        if (res.ok) {
          setStats(await res.json());
        }
      } catch (error) {
        console.error('Failed to fetch dashboard stats', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (isLoading) {
    return <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Dashboard Overview</h2>
        <div className="text-sm text-neutral-500">Live Data</div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Revenue Today" 
          value={`₹${stats?.revenueToday || 0}`} 
          trend="" 
          isPositive={true}
          icon={<IndianRupee className="w-6 h-6 text-emerald-500" />} 
        />
        <StatCard 
          title="Orders Today" 
          value={stats?.ordersToday?.toString() || '0'} 
          trend="" 
          isPositive={true}
          icon={<ShoppingBag className="w-6 h-6 text-blue-500" />} 
        />
        <StatCard 
          title="Orders This Week" 
          value={stats?.ordersThisWeek?.toString() || '0'} 
          trend="" 
          isPositive={true}
          icon={<CalendarDays className="w-6 h-6 text-orange-500" />} 
        />
        <StatCard 
          title="Orders This Month" 
          value={stats?.ordersThisMonth?.toString() || '0'} 
          trend="" 
          isPositive={true}
          icon={<Calendar className="w-6 h-6 text-purple-500" />} 
        />
      </div>

      {/* Trend Graphs */}
      {stats?.trendData && stats.trendData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-neutral-950 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6 shadow-sm">
            <h3 className="text-lg font-bold mb-6">Order Trends (Last 6 Months)</h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.trendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', color: '#fff', borderRadius: '8px', border: 'none' }}
                    itemStyle={{ color: '#fff' }}
                    cursor={{ stroke: '#e5e7eb', strokeWidth: 1, strokeDasharray: '5 5' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="orders" 
                    stroke="#ea580c" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: '#ea580c', strokeWidth: 0 }} 
                    activeDot={{ r: 6, strokeWidth: 0 }}
                    animationDuration={1500}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-950 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6 shadow-sm">
            <h3 className="text-lg font-bold mb-6">Revenue Trends (Last 6 Months)</h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.trendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', color: '#fff', borderRadius: '8px', border: 'none' }}
                    itemStyle={{ color: '#fff' }}
                    cursor={{ stroke: '#e5e7eb', strokeWidth: 1, strokeDasharray: '5 5' }}
                    formatter={(value: any) => [`₹${value}`, 'Revenue']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#10b981" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }} 
                    activeDot={{ r: 6, strokeWidth: 0 }}
                    animationDuration={1500}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Recent Orders Table */}
      <div className="bg-white dark:bg-neutral-950 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
        <h3 className="text-lg font-bold mb-4">Recent Orders</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 text-sm">
                <th className="pb-3 font-medium">Order ID</th>
                <th className="pb-3 font-medium">Customer</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {stats?.recentOrders?.length === 0 ? (
                <tr><td colSpan={4} className="py-8 text-center text-neutral-500">No recent orders.</td></tr>
              ) : (
                stats?.recentOrders?.map((order: any) => (
                  <tr key={order.id} className="border-b border-neutral-100 dark:border-neutral-900 last:border-0">
                    <td className="py-3 font-medium text-xs font-mono">{order.id.slice(0,8).toUpperCase()}</td>
                    <td className="py-3">{order.customerName}</td>
                    <td className="py-3">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-700 dark:bg-neutral-900/30 dark:text-neutral-400">
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 text-right font-medium">₹{order.total}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, trend, isPositive, icon }: { title: string, value: string, trend: string, isPositive: boolean, icon: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-neutral-950 p-6 rounded-xl border border-neutral-200 dark:border-neutral-800 flex items-start justify-between shadow-sm">
      <div>
        <p className="text-sm font-medium text-neutral-500 mb-1">{title}</p>
        <h4 className="text-3xl font-bold">{value}</h4>
        {trend && (
          <div className={`text-sm mt-2 font-medium ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
            {trend}
          </div>
        )}
      </div>
      <div className="p-3 bg-neutral-50 dark:bg-neutral-900 rounded-lg">
        {icon}
      </div>
    </div>
  );
}
