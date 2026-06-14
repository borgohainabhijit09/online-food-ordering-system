'use client';

import React, { useEffect, useState } from 'react';
import { IndianRupee, TrendingUp, Users, ShoppingBag, Store, AlertCircle, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

export default function CeoDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('superAdminToken');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/super-admin/bi/ceo`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 flex justify-center"><div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div></div>;
  }

  if (!data) return <div className="p-8">No data available</div>;

  const { revenueMetrics, subscriptionMetrics, orderMetrics, customerMetrics } = data;

  const revenueData = [
    { name: 'Jan', revenue: Math.round(revenueMetrics.mrr * 0.8) },
    { name: 'Feb', revenue: Math.round(revenueMetrics.mrr * 0.85) },
    { name: 'Mar', revenue: Math.round(revenueMetrics.mrr * 0.9) },
    { name: 'Apr', revenue: Math.round(revenueMetrics.mrr * 0.95) },
    { name: 'May', revenue: Math.round(revenueMetrics.mrr * 0.98) },
    { name: 'Jun', revenue: revenueMetrics.mrr },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-bold mb-2">CEO Dashboard</h1>
        <p className="text-neutral-500">Platform overview, revenue generation, and global growth.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-neutral-500 font-medium">Monthly Recurring Rev</div>
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-bold text-neutral-900">₹{revenueMetrics.mrr.toLocaleString()}</div>
          <div className="text-sm text-emerald-600 font-medium mt-2 flex items-center gap-1">
            <TrendingUp className="w-4 h-4" /> +{revenueMetrics.revenueGrowth}% this month
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-neutral-500 font-medium">Annual Recurring Rev</div>
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-bold text-neutral-900">₹{revenueMetrics.arr.toLocaleString()}</div>
          <div className="text-sm text-neutral-500 font-medium mt-2">Projected ARR</div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-neutral-500 font-medium">Active Restaurants</div>
            <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
              <Store className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-bold text-neutral-900">{subscriptionMetrics.activeRestaurants}</div>
          <div className="text-sm text-neutral-500 font-medium mt-2">Out of {subscriptionMetrics.totalRestaurants} total signups</div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-neutral-500 font-medium">Global Orders</div>
            <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-bold text-neutral-900">{orderMetrics.totalOrders.toLocaleString()}</div>
          <div className="text-sm text-neutral-500 font-medium mt-2">{orderMetrics.ordersThisMonth} this month</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-neutral-200">
          <h2 className="text-lg font-bold mb-6 text-neutral-900">MRR Growth Trend</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dx={-10} tickFormatter={(value) => `₹${value}`} />
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200">
            <h2 className="text-lg font-bold mb-4 text-neutral-900">Platform GMV</h2>
            <div className="text-4xl font-bold text-neutral-900 mb-2">₹{orderMetrics.gmv.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className="text-sm text-neutral-500">Gross Merchandise Value processed through RestoBuddy across all tenants.</p>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200">
            <h2 className="text-lg font-bold mb-4 text-neutral-900">Customer Base</h2>
            <div className="flex items-center gap-4 mb-4">
              <Users className="w-10 h-10 text-blue-500" />
              <div>
                <div className="text-2xl font-bold text-neutral-900">{customerMetrics.totalCustomers.toLocaleString()}</div>
                <div className="text-sm text-neutral-500">Total Unique End-Customers</div>
              </div>
            </div>
            <div className="w-full bg-neutral-100 rounded-full h-2 mb-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${customerMetrics.returningCustomersPct}%` }}></div>
            </div>
            <div className="text-xs text-neutral-500 text-right">{customerMetrics.returningCustomersPct}% Returning Rate</div>
          </div>
        </div>
      </div>
    </div>
  );
}

