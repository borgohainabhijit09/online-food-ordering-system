'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, Package, Clock, CheckCircle, XCircle } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';

interface RequestItem {
  id: string;
  tenantId: string;
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
  tenant: {
    businessName: string;
    email: string;
    phone: string;
  };
}

export default function MarketplaceRequestsPage() {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await apiClient.get('/api/super-admin/marketplace/requests');
      if (res.ok) {
        setRequests(await res.json());
      }
    } catch (error) {
      console.error('Failed to fetch requests', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    try {
      const res = await apiClient.patch(`/api/super-admin/marketplace/requests/${id}/status`, { status: newStatus });
      if (res.ok) {
        fetchRequests();
      }
    } catch (error) {
      console.error('Failed to update status', error);
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'PROCESSING': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'FULFILLED': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'CANCELLED': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-black" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-neutral-50 text-neutral-600 border-b border-neutral-200">
            <tr>
              <th className="px-6 py-4 font-semibold">Request ID</th>
              <th className="px-6 py-4 font-semibold">Restaurant</th>
              <th className="px-6 py-4 font-semibold">Item requested</th>
              <th className="px-6 py-4 font-semibold">Total Price</th>
              <th className="px-6 py-4 font-semibold text-center">Status</th>
              <th className="px-6 py-4 font-semibold text-right">Update Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {requests.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-neutral-500">No requests yet.</td></tr>
            ) : requests.map(req => (
              <tr key={req.id} className="hover:bg-neutral-50 transition-colors">
                <td className="px-6 py-4">
                  <span className="font-mono text-xs bg-neutral-100 px-2 py-1 rounded text-neutral-600">
                    #{req.id.split('-')[0]}
                  </span>
                  <div className="text-xs text-neutral-500 mt-1">{new Date(req.createdAt).toLocaleDateString()}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="font-medium text-black">{req.tenant.businessName}</div>
                  <div className="text-xs text-neutral-500">{req.tenant.email} • {req.tenant.phone}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="font-medium text-black">{req.product.title} <span className="text-neutral-500 font-normal">x {req.quantity}</span></div>
                  {req.notes && <div className="text-xs text-neutral-500 truncate max-w-xs mt-1 bg-yellow-50 px-2 py-1 rounded italic">Note: {req.notes}</div>}
                </td>
                <td className="px-6 py-4 font-medium text-black">
                  ₹{(req.product.price * req.quantity).toFixed(2)}
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(req.status)}`}>
                    {req.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {req.status === 'PENDING' && (
                      <>
                        <button onClick={() => updateStatus(req.id, 'PROCESSING')} disabled={updatingId === req.id} className="text-xs px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded font-medium disabled:opacity-50 transition-colors">Process</button>
                        <button onClick={() => updateStatus(req.id, 'CANCELLED')} disabled={updatingId === req.id} className="text-xs px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded font-medium disabled:opacity-50 transition-colors">Reject</button>
                      </>
                    )}
                    {req.status === 'PROCESSING' && (
                      <button onClick={() => updateStatus(req.id, 'FULFILLED')} disabled={updatingId === req.id} className="text-xs px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded font-medium disabled:opacity-50 transition-colors">Mark Fulfilled</button>
                    )}
                    {(req.status === 'FULFILLED' || req.status === 'CANCELLED') && (
                      <span className="text-xs text-neutral-400 italic">No further actions</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
