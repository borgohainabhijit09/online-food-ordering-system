'use client';

import React, { useEffect, useState } from 'react';
import { ListChecks, CheckCircle2, Circle } from 'lucide-react';

interface OnboardingTask {
  key: string;
  label: string;
  completed: boolean;
}

interface OnboardingData {
  id: string;
  restaurantName: string;
  slug: string;
  percentage: number;
  completedCount: number;
  totalCount: number;
  status: string;
  checklist: OnboardingTask[];
}

export default function OnboardingTracker() {
  const [data, setData] = useState<OnboardingData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('superAdminToken');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/super-admin/bi/onboarding`, {
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

  const getStatusBadge = (status: string) => {
    if (status === 'COMPLETED') return <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">COMPLETED</span>;
    if (status === 'IN_PROGRESS') return <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">IN PROGRESS</span>;
    return <span className="px-3 py-1 bg-neutral-200 text-neutral-600 rounded-full text-xs font-bold">NOT STARTED</span>;
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <ListChecks className="w-8 h-8 text-blue-500" />
          Onboarding Tracker
        </h1>
        <p className="text-neutral-500">Monitor the setup progress of newly registered restaurants.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {data.map(tenant => (
          <div key={tenant.id} className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200 flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-lg text-neutral-900">{tenant.restaurantName}</h3>
                <p className="text-sm text-neutral-500">/{tenant.slug}</p>
              </div>
              {getStatusBadge(tenant.status)}
            </div>

            <div className="mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-neutral-700">Progress</span>
                <span className="font-bold text-neutral-900">{tenant.completedCount}/{tenant.totalCount} ({tenant.percentage}%)</span>
              </div>
              <div className="w-full bg-neutral-100 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${tenant.percentage === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`} 
                  style={{ width: `${tenant.percentage}%` }}
                ></div>
              </div>
            </div>

            <div className="space-y-3 flex-1">
              {tenant.checklist.map(task => (
                <div key={task.key} className="flex items-center gap-3">
                  {task.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-neutral-300 shrink-0" />
                  )}
                  <span className={`text-sm ${task.completed ? 'text-neutral-900 font-medium' : 'text-neutral-500'}`}>
                    {task.label}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-neutral-100">
              <button className="w-full py-2.5 bg-neutral-900 text-white rounded-xl font-medium text-sm hover:bg-black transition-colors">
                Contact Owner
              </button>
            </div>
          </div>
        ))}
        {data.length === 0 && (
          <div className="col-span-full py-12 text-center text-neutral-500 border-2 border-dashed border-neutral-200 rounded-2xl">
            No restaurants found in the system.
          </div>
        )}
      </div>
    </div>
  );
}

