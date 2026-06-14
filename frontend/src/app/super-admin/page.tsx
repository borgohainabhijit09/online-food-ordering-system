'use client';

import React, { useEffect, useState } from 'react';
import { Users, TrendingUp, AlertCircle, CreditCard } from 'lucide-react';

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState({
    totalTenants: 0,
    mrr: 0,
    pastDueCount: 0,
    activeSubsCount: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('superAdminToken');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/super-admin/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
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

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Platform Overview</h1>
        <p className="text-neutral-500">Monitor your SaaS metrics and tenant health.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm text-neutral-500 font-medium">Total Businesses</div>
              <div className="text-2xl font-bold text-neutral-900">{stats.totalTenants}</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm text-neutral-500 font-medium">Monthly Revenue</div>
              <div className="text-2xl font-bold text-neutral-900">₹{Number(stats.mrr || 0).toFixed(2)}</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm text-neutral-500 font-medium">Active Subs</div>
              <div className="text-2xl font-bold text-neutral-900">{stats.activeSubsCount}</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-red-200">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm text-red-500 font-medium">Past Due</div>
              <div className="text-2xl font-bold text-red-600">{stats.pastDueCount}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-8 text-center">
        <h2 className="text-xl font-bold mb-2">Welcome to Super Admin</h2>
        <p className="text-neutral-500">Navigate to the Tenants tab to manage individual business subscriptions and billing.</p>
      </div>
    </div>
  );
}

