'use client';

import React, { useEffect, useRef, useState } from 'react';
import { apiClient } from '@/lib/apiClient';

export function OrderNotification() {
  const [showToast, setShowToast] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const getTokenPayload = () => {
      const token = localStorage.getItem('activeSessionToken') || localStorage.getItem('adminToken');
      if (!token) return null;
      try {
        return JSON.parse(atob(token.split('.')[1]));
      } catch (e) {
        return null;
      }
    };

    const payload = getTokenPayload();
    if (!payload || !payload.tenantId) {
      // Do not poll if there's no active tenant context
      return;
    }

    // Create audio element for notification sound
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    
    // Track the last known count so we can detect increases
    let lastCount = -1;

    const checkForNewOrders = async () => {
      try {
        const res = await apiClient.get('/api/orders/new-count');
        if (res.ok) {
          const data = await res.json();
          const currentCount = data.count ?? 0;

          if (lastCount !== -1 && currentCount > lastCount) {
            // New order(s) arrived!
            if (audioRef.current) {
              audioRef.current.play().catch(e => console.log('Audio play blocked by browser', e));
            }
            setShowToast(true);
            setTimeout(() => setShowToast(false), 5000);
          }

          lastCount = currentCount;
        }
      } catch (err) {
        // Silent fail — notification is non-critical
      }
    };

    // Initialize baseline immediately
    checkForNewOrders();

    // Then poll every 20 seconds (was fetching full orders list every 15s before)
    const intervalId = setInterval(checkForNewOrders, 20000);

    return () => clearInterval(intervalId);
  }, []);

  if (!showToast) return null;

  return (
    <div className="fixed top-20 right-4 z-50 animate-in slide-in-from-right-8 fade-in duration-300">
      <div className="bg-emerald-600 text-white px-6 py-4 rounded-xl shadow-xl flex items-center gap-3 border border-emerald-500">
        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
        </div>
        <div>
          <h4 className="font-bold">New Order Arrived!</h4>
          <p className="text-sm text-emerald-100">Check the orders panel.</p>
        </div>
      </div>
    </div>
  );
}
