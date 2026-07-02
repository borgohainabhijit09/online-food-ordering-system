'use client';

import React, { useEffect, useState } from 'react';
import { TrendingUp, BarChart2, IndianRupee } from 'lucide-react';

interface TenantPerformance {
  id: string;
  businessName: string;
  slug: string;
  totalOrders: number;
  totalRevenue: number;
  source: {
    delivery: number;
    takeaway: number;
    dineIn: number;
  };
}

export default function SuperAdminPerformance() {
  const [performance, setPerformance] = useState<TenantPerformance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPerformance();
  }, []);

  const fetchPerformance = async () => {
    try {
      const token = localStorage.getItem('superAdminToken');
      const res = await fetch(`/api/super-admin/performance`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setPerformance(data);
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

  const globalRevenue = performance.reduce((sum, p) => sum + p.totalRevenue, 0);
  const globalOrders = performance.reduce((sum, p) => sum + p.totalOrders, 0);

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Restaurant Performance</h1>
        <p className="text-neutral-500">Compare revenue, orders, and fulfillment sources across all active tenants.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200 flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <IndianRupee className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm text-neutral-500 font-medium">Global Revenue</div>
            <div className="text-2xl font-bold text-neutral-900">₹{globalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <BarChart2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm text-neutral-500 font-medium">Global Orders</div>
            <div className="text-2xl font-bold text-neutral-900">{globalOrders.toLocaleString()}</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 border-b border-neutral-200 font-medium text-neutral-600">
              <tr>
                <th className="px-6 py-4">Restaurant</th>
                <th className="px-6 py-4 text-right">Total Orders</th>
                <th className="px-6 py-4 text-right">Revenue</th>
                <th className="px-6 py-4 text-center">Order Sources (Del / Pick / Dine)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {performance.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-neutral-500">
                    No performance data available.
                  </td>
                </tr>
              ) : (
                performance.map((tenant) => {
                  const total = tenant.totalOrders || 1; // avoid division by zero
                  const delPct = Math.round((tenant.source.delivery / total) * 100);
                  const tkPct = Math.round((tenant.source.takeaway / total) * 100);
                  const diPct = Math.round((tenant.source.dineIn / total) * 100);
                  
                  return (
                    <tr key={tenant.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-neutral-900">{tenant.businessName}</div>
                        <div className="text-xs text-neutral-500">/{tenant.slug}</div>
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-neutral-900">
                        {tenant.totalOrders.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-emerald-600">
                        ₹{tenant.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col items-center gap-1.5">
                          <div className="flex w-48 h-2 rounded-full overflow-hidden bg-neutral-100">
                            <div className="bg-orange-500" style={{ width: `${delPct}%` }} title={`Delivery: ${tenant.source.delivery}`}></div>
                            <div className="bg-blue-500" style={{ width: `${tkPct}%` }} title={`Takeaway: ${tenant.source.takeaway}`}></div>
                            <div className="bg-purple-500" style={{ width: `${diPct}%` }} title={`Dine-In: ${tenant.source.dineIn}`}></div>
                          </div>
                          <div className="text-xs text-neutral-500 flex gap-2">
                            <span className="text-orange-600 font-medium">{tenant.source.delivery}</span> / 
                            <span className="text-blue-600 font-medium">{tenant.source.takeaway}</span> / 
                            <span className="text-purple-600 font-medium">{tenant.source.dineIn}</span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

