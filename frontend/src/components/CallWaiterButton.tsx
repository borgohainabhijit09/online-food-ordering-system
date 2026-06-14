import React, { useState } from 'react';
import { Bell, FileText, Loader2, CheckCircle2 } from 'lucide-react';
import { apiClient } from '../lib/apiClient';
import { useCartStore } from '../store/useCartStore';

export function CallWaiterButton({ tenantSlug }: { tenantSlug: string }) {
  const { orderType, tableNumber } = useCartStore();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [successAction, setSuccessAction] = useState<string | null>(null);

  if (orderType !== 'DINE_IN' || !tableNumber) return null;

  const handleAction = async (action: 'CALL_WAITER' | 'REQUEST_BILL') => {
    setLoadingAction(action);
    try {
      const endpoint = action === 'CALL_WAITER' ? '/api/tables/call-waiter' : '/api/tables/request-bill';
      const res = await apiClient.post(endpoint, { tableNumber }, tenantSlug);
      
      if (res.ok) {
        setSuccessAction(action);
        setTimeout(() => setSuccessAction(null), 3000);
      } else {
        const error = await res.json();
        alert(error.message || 'Action failed');
      }
    } catch (error) {
      console.error(error);
      alert('An error occurred. Please try again.');
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="fixed bottom-24 right-4 z-40 flex flex-col gap-3">
      <button 
        onClick={() => handleAction('CALL_WAITER')}
        disabled={!!loadingAction}
        className="w-14 h-14 bg-orange-600 text-white rounded-full shadow-lg shadow-orange-600/30 flex items-center justify-center hover:-translate-y-1 transition-all disabled:opacity-70 disabled:hover:translate-y-0 relative group"
        title="Call Waiter"
      >
        {loadingAction === 'CALL_WAITER' ? (
          <Loader2 className="w-6 h-6 animate-spin" />
        ) : successAction === 'CALL_WAITER' ? (
          <CheckCircle2 className="w-6 h-6" />
        ) : (
          <Bell className="w-6 h-6" />
        )}
        <span className="absolute right-full mr-3 bg-neutral-900 text-white text-xs font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          Call Waiter
        </span>
      </button>

      <button 
        onClick={() => handleAction('REQUEST_BILL')}
        disabled={!!loadingAction}
        className="w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg shadow-blue-600/30 flex items-center justify-center hover:-translate-y-1 transition-all disabled:opacity-70 disabled:hover:translate-y-0 relative group"
        title="Request Bill"
      >
        {loadingAction === 'REQUEST_BILL' ? (
          <Loader2 className="w-6 h-6 animate-spin" />
        ) : successAction === 'REQUEST_BILL' ? (
          <CheckCircle2 className="w-6 h-6" />
        ) : (
          <FileText className="w-6 h-6" />
        )}
        <span className="absolute right-full mr-3 bg-neutral-900 text-white text-xs font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          Request Bill
        </span>
      </button>
    </div>
  );
}
