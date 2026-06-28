'use client';

import React, { useState, useEffect } from 'react';
import { IndianRupee, ShoppingBag, CalendarDays, Calendar, Loader2, Cake } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';

const COLORS = ['#ea580c', '#10b981', '#3b82f6'];

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [topItemsPeriod, setTopItemsPeriod] = useState<'1m' | '6m' | 'all'>('all');
  const [ordersByTypePeriod, setOrdersByTypePeriod] = useState<'1m' | '6m' | 'all'>('all');

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
          value={`₹${Number(stats?.revenueToday || 0).toFixed(2)}`} 
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
      {/* Trend Graphs & Pie Chart */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-neutral-950 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6 shadow-sm">
            <h3 className="text-lg font-bold mb-6">Order Trends (Last 6 Months)</h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
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
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
              <h3 className="text-lg font-bold">Orders by Type</h3>
              <div className="flex gap-2">
                <button onClick={() => setOrdersByTypePeriod('1m')} className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${ordersByTypePeriod === '1m' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800'}`}>1 Month</button>
                <button onClick={() => setOrdersByTypePeriod('6m')} className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${ordersByTypePeriod === '6m' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800'}`}>6 Months</button>
                <button onClick={() => setOrdersByTypePeriod('all')} className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${ordersByTypePeriod === 'all' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800'}`}>All Time</button>
              </div>
            </div>
            <div className="h-72 w-full flex items-center justify-center">
              {stats.ordersByType?.[ordersByTypePeriod] && stats.ordersByType[ordersByTypePeriod].some((d: any) => d.value > 0) ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                  <PieChart>
                    <Pie
                      data={stats.ordersByType[ordersByTypePeriod]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {stats.ordersByType[ordersByTypePeriod].map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1f2937', color: '#fff', borderRadius: '8px', border: 'none' }}
                      itemStyle={{ color: '#fff' }}
                      formatter={(value: any, name: any, props: any) => [`${value} Orders (₹${props.payload.revenue.toLocaleString()})`, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-neutral-500">No data available</div>
              )}
            </div>
            <div className="flex justify-center flex-wrap gap-4 mt-4">
              {stats.ordersByType?.[ordersByTypePeriod]?.map((entry: any, index: number) => (
                <div key={entry.name} className="flex flex-col items-center text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                    <span className="text-neutral-600 dark:text-neutral-400 font-medium">{entry.name}</span>
                  </div>
                  <span className="text-xs text-neutral-500 mt-1">{entry.value} (₹{entry.revenue.toLocaleString()})</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Revenue Graph & Top Selling Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {stats?.trendData && stats.trendData.length > 0 && (
          <div className="bg-white dark:bg-neutral-950 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6 shadow-sm">
              <h3 className="text-lg font-bold mb-6">Revenue Trends (Last 6 Months)</h3>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                  <LineChart data={stats.trendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val}`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1f2937', color: '#fff', borderRadius: '8px', border: 'none' }}
                      itemStyle={{ color: '#fff' }}
                      cursor={{ stroke: '#e5e7eb', strokeWidth: 1, strokeDasharray: '5 5' }}
                      formatter={(value: any) => [`₹${Number(value).toFixed(2)}`, 'Revenue']}
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
        )}

        {stats?.topProducts && (
          <div className="bg-white dark:bg-neutral-950 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
              <h3 className="text-lg font-bold">Highest Sold Items</h3>
              <div className="flex gap-2">
                <button onClick={() => setTopItemsPeriod('1m')} className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${topItemsPeriod === '1m' ? 'bg-orange-600 text-white border-orange-600' : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800'}`}>1 Month</button>
                <button onClick={() => setTopItemsPeriod('6m')} className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${topItemsPeriod === '6m' ? 'bg-orange-600 text-white border-orange-600' : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800'}`}>6 Months</button>
                <button onClick={() => setTopItemsPeriod('all')} className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${topItemsPeriod === 'all' ? 'bg-orange-600 text-white border-orange-600' : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800'}`}>All Time</button>
              </div>
            </div>
            <div className="h-[300px]">
              {stats.topProducts[topItemsPeriod]?.length === 0 ? (
                <div className="h-full flex items-center justify-center text-neutral-500">No data available for this period.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                  <BarChart data={stats.topProducts[topItemsPeriod]} margin={{ top: 5, right: 20, bottom: 25, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickMargin={10} />
                    <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1f2937', color: '#fff', borderRadius: '8px', border: 'none' }}
                      itemStyle={{ color: '#fff' }}
                      cursor={{ fill: 'transparent' }}
                    />
                    <Bar dataKey="quantity" fill="#ea580c" radius={[4, 4, 0, 0]} name="Quantity Sold" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Recent Orders & Upcoming Birthdays */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                      <td className="py-3 text-sm">
                        <div className="flex items-center gap-2">
                          {order.customerName}
                          {order.customerType && (
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                              order.customerType === 'REPEAT + VIP' ? 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-400' :
                              order.customerType === 'VIP' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                              order.customerType === 'REPEAT' || order.customerType === 'RETURNING' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                              'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                            }`}>
                              {order.customerType === 'RETURNING' ? 'REPEAT' : order.customerType}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-700 dark:bg-neutral-900/30 dark:text-neutral-400">
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3 text-right font-medium text-sm">₹{Number(order.total || 0).toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-950 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
             <Cake className="w-5 h-5 text-pink-500" /> Upcoming Birthdays
             <span className="text-xs font-normal text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded-full">Next 3 Days</span>
          </h3>
          <div className="overflow-x-auto">
             <table className="w-full text-left border-collapse">
                <thead>
                   <tr className="border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 text-sm">
                      <th className="pb-3 font-medium">Customer</th>
                      <th className="pb-3 font-medium">Phone</th>
                      <th className="pb-3 font-medium text-right">Date</th>
                   </tr>
                </thead>
                <tbody>
                   {stats?.upcomingBirthdays?.length === 0 ? (
                      <tr><td colSpan={3} className="py-8 text-center text-neutral-500">No upcoming birthdays.</td></tr>
                   ) : (
                      stats?.upcomingBirthdays?.map((c: any) => (
                         <tr key={c.id} className="border-b border-neutral-100 dark:border-neutral-900 last:border-0">
                            <td className="py-3 font-medium text-sm">{c.name}</td>
                            <td className="py-3 text-sm">{c.phone}</td>
                            <td className="py-3 text-sm text-pink-600 font-bold text-right">
                               {new Date(c.dob).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </td>
                         </tr>
                      ))
                   )}
                </tbody>
             </table>
          </div>
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
