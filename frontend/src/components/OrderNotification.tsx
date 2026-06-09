'use client';

import React, { useEffect, useRef, useState } from 'react';
import { apiClient } from '@/lib/apiClient';

export function OrderNotification() {
  const [showToast, setShowToast] = useState(false);
  const lastOrderDateRef = useRef<Date | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Create audio element for notification sound
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    
    // Initial fetch to get the baseline latest order date
    const initializeBaseline = async () => {
      try {
        const res = await apiClient.get('/api/orders');
        if (res.ok) {
          const orders = await res.json();
          if (orders.length > 0) {
            // Assume the first one is the newest (sorted by createdAt desc)
            lastOrderDateRef.current = new Date(orders[0].createdAt);
          } else {
            lastOrderDateRef.current = new Date();
          }
        }
      } catch (err) {
        console.error('Failed to initialize order notification baseline', err);
      }
    };

    initializeBaseline();

    const intervalId = setInterval(async () => {
      try {
        const res = await apiClient.get('/api/orders');
        if (res.ok) {
          const orders = await res.json();
          if (orders.length > 0) {
            const latestOrderDate = new Date(orders[0].createdAt);
            
            if (lastOrderDateRef.current && latestOrderDate > lastOrderDateRef.current) {
              // New order detected!
              if (audioRef.current) {
                audioRef.current.play().catch(e => console.log('Audio play blocked by browser', e));
              }
              setShowToast(true);
              setTimeout(() => setShowToast(false), 5000);
            }
            
            // Update baseline
            lastOrderDateRef.current = latestOrderDate;
          }
        }
      } catch (err) {
        console.error('Failed to check for new orders', err);
      }
    }, 15000); // check every 15 seconds

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
