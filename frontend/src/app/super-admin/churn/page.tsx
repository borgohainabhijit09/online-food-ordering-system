'use client';

import React, { useEffect, useState } from 'react';
import { AlertTriangle, AlertCircle, Calendar, MessageSquare, PhoneCall, HeartPulse } from 'lucide-react';

interface ChurnData {
  id: string;
  restaurantName: string;
  slug: string;
  riskScore: number;
  riskLevel: string;
  lastLoginAt: string | null;
  reasons: string[];
  actions: string[];
  subscriptionExpiry: string | null;
}

export default function ChurnDashboard() {
  const [data, setData] = useState<ChurnData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('superAdminToken');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/super-admin/bi/churn`, {
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

  const getRiskColor = (level: string) => {
    switch(level) {
      case 'CRITICAL': return 'bg-red-100 text-red-700 border-red-200';
      case 'HIGH': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'LOW': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-neutral-100 text-neutral-700 border-neutral-200';
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3 text-neutral-900">
            <AlertTriangle className="w-8 h-8 text-orange-500" />
            Churn Prediction
          </h1>
          <p className="text-neutral-500">Proactively identify and save at-risk accounts before they cancel.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200 flex flex-col">
          <div className="text-sm font-medium text-neutral-500 mb-1">Critical Risk</div>
          <div className="text-3xl font-bold text-red-600">{data.filter(d => d.riskLevel === 'CRITICAL').length}</div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200 flex flex-col">
          <div className="text-sm font-medium text-neutral-500 mb-1">High Risk</div>
          <div className="text-3xl font-bold text-orange-600">{data.filter(d => d.riskLevel === 'HIGH').length}</div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200 flex flex-col">
          <div className="text-sm font-medium text-neutral-500 mb-1">Medium Risk</div>
          <div className="text-3xl font-bold text-yellow-600">{data.filter(d => d.riskLevel === 'MEDIUM').length}</div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200 flex flex-col">
          <div className="text-sm font-medium text-neutral-500 mb-1">Total At-Risk</div>
          <div className="text-3xl font-bold text-neutral-900">{data.length}</div>
        </div>
      </div>

      <div className="space-y-6">
        {data.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-neutral-200 shadow-sm">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <HeartPulse className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-neutral-900 mb-2">Looking Good!</h3>
            <p className="text-neutral-500">No active restaurants are currently at risk of churning.</p>
          </div>
        ) : (
          data.map(tenant => (
            <div key={tenant.id} className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
              <div className="p-6 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between border-b border-neutral-100">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-xl font-bold text-neutral-900">{tenant.restaurantName}</h2>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getRiskColor(tenant.riskLevel)}`}>
                      {tenant.riskLevel} RISK
                    </span>
                  </div>
                  <p className="text-sm text-neutral-500">/{tenant.slug} • Risk Score: <span className="font-bold text-neutral-900">{tenant.riskScore}/100</span></p>
                </div>
                
                <div className="flex gap-3 w-full md:w-auto">
                  <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl font-medium text-sm transition-colors">
                    <MessageSquare className="w-4 h-4" /> Message
                  </button>
                  <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-black hover:bg-neutral-800 text-white rounded-xl font-medium text-sm transition-colors">
                    <PhoneCall className="w-4 h-4" /> Call Owner
                  </button>
                </div>
              </div>
              
              <div className="p-6 bg-neutral-50 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-sm font-bold text-neutral-900 mb-4 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-orange-500" />
                    Risk Factors
                  </h4>
                  <ul className="space-y-3">
                    {tenant.reasons.map((reason, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-sm text-neutral-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5 shrink-0"></span>
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="text-sm font-bold text-neutral-900 mb-4 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-500" />
                    Recommended Actions
                  </h4>
                  <ul className="space-y-3">
                    {tenant.actions.map((action, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-sm text-neutral-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0"></span>
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

