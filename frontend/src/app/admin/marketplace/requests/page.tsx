'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, Package, Inbox } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';

interface RequestItem {
  id: string;
  productId: string;
  quantity: number;
  notes: string;
  status: 'PENDING' | 'PROCESSING' | 'FULFILLED' | 'CANCELLED';
  createdAt: string;
  product: {
    title: string;
    price: number;
    type: string;
  };
}

export default function TenantMarketplaceRequests() {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await apiClient.get('/api/marketplace/requests');
      if (res.ok) {
        setRequests(await res.json());
      }
    } catch (error) {
      console.error('Failed to fetch requests', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'PENDING': return { text: 'Request Received', class: 'bg-yellow-50 text-yellow-700 border-yellow-200' };
      case 'PROCESSING': return { text: 'In Progress', class: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'FULFILLED': return { text: 'Completed', class: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'CANCELLED': return { text: 'Cancelled', class: 'bg-red-50 text-red-700 border-red-200' };
      default: return { text: status, class: 'bg-gray-50 text-gray-700 border-gray-200' };
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>;
  }

  return (
    <div className="space-y-6">
      {requests.length === 0 ? (
        <div className="text-center py-24 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl">
          <Inbox className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-neutral-900 dark:text-white">No purchase requests yet</h3>
          <p className="text-neutral-500 dark:text-neutral-400 mt-2">Head over to the Storefront to browse available products and services.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {requests.map(req => {
            const statusDisplay = getStatusDisplay(req.status);
            return (
              <div key={req.id} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 flex flex-col hover:shadow-sm transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusDisplay.class}`}>
                    {statusDisplay.text}
                  </span>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    {new Date(req.createdAt).toLocaleDateString()}
                  </span>
                </div>
                
                <h4 className="font-bold text-lg text-neutral-900 dark:text-white mb-1">
                  {req.product.title}
                </h4>
                
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                  <div className="text-sm text-neutral-500 dark:text-neutral-400">
                    Qty: <span className="font-medium text-neutral-900 dark:text-white">{req.quantity}</span>
                  </div>
                  <div className="font-bold text-lg text-neutral-900 dark:text-white">
                    ₹{(req.product.price * req.quantity).toFixed(2)}
                  </div>
                </div>

                {req.notes && (
                  <div className="mt-4 bg-neutral-50 dark:bg-neutral-950 p-3 rounded-lg border border-neutral-100 dark:border-neutral-800">
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium mb-1">Your notes:</p>
                    <p className="text-sm text-neutral-700 dark:text-neutral-300 italic">"{req.notes}"</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
