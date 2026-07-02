'use client';

import React, { useEffect, useState } from 'react';
import { HeartPulse, Search, Filter } from 'lucide-react';

interface HealthData {
  id: string;
  restaurantName: string;
  slug: string;
  healthScore: number;
  status: string;
  ordersLast30: number;
  revenueLast30: number;
  customers: number;
  subscriptionStatus: string;
  isActive: boolean;
}

export default function HealthDashboard() {
  const [data, setData] = useState<HealthData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('superAdminToken');
      const res = await fetch(`/api/super-admin/bi/health`, {
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

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Excellent': return 'bg-emerald-100 text-emerald-700';
      case 'Healthy': return 'bg-blue-100 text-blue-700';
      case 'Needs Attention': return 'bg-orange-100 text-orange-700';
      case 'Critical': return 'bg-red-100 text-red-700';
      default: return 'bg-neutral-100 text-neutral-700';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const filteredData = data.filter(item => {
    const matchesSearch = item.restaurantName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <HeartPulse className="w-8 h-8 text-rose-500" />
            Restaurant Health
          </h1>
          <p className="text-neutral-500">Monitor engagement and identify at-risk restaurants.</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input 
              type="text" 
              placeholder="Search restaurants..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black text-neutral-900"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-neutral-400" />
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-neutral-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black text-neutral-900"
            >
              <option value="ALL">All Health Statuses</option>
              <option value="Excellent">Excellent (90-100)</option>
              <option value="Healthy">Healthy (70-89)</option>
              <option value="Needs Attention">Needs Attention (40-69)</option>
              <option value="Critical">Critical (0-39)</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 font-medium">
              <tr>
                <th className="px-6 py-4">Restaurant</th>
                <th className="px-6 py-4 text-center">Score</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Orders (30d)</th>
                <th className="px-6 py-4 text-right">Revenue (30d)</th>
                <th className="px-6 py-4 text-right">Customers</th>
                <th className="px-6 py-4 text-center">Sub Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-neutral-500">
                    No restaurants match your filters.
                  </td>
                </tr>
              ) : (
                filteredData.map(tenant => (
                  <tr key={tenant.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-neutral-900">{tenant.restaurantName}</div>
                      <div className="text-xs text-neutral-500">/{tenant.slug}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`font-bold text-xl ${getScoreColor(tenant.healthScore)}`}>{tenant.healthScore}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(tenant.status)}`}>
                        {tenant.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-neutral-900">
                      {tenant.ordersLast30}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-neutral-900">
                      ₹{tenant.revenueLast30.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-neutral-900">
                      {tenant.customers}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 rounded-md text-xs font-medium border ${tenant.subscriptionStatus === 'ACTIVE' ? 'border-emerald-200 text-emerald-700 bg-emerald-50' : 'border-neutral-200 text-neutral-700 bg-neutral-50'}`}>
                        {tenant.subscriptionStatus}
                      </span>
                    </td>
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

