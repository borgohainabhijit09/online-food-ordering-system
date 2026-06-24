'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ClipboardList, 
  CheckCircle2, 
  ChefHat, 
  Bike, 
  Home, 
  AlertCircle, 
  ChevronLeft,
  Loader2,
  Phone,
  MapPin
} from 'lucide-react';
import { apiClient } from '../../../../lib/apiClient';
import Link from 'next/link';

type OrderStatus = 'NEW' | 'ACCEPTED' | 'PREPARING' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';

const STAGES = [
  { id: 'NEW', label: 'Order Placed', icon: ClipboardList, desc: 'We have received your order' },
  { id: 'ACCEPTED', label: 'Order Accepted', icon: CheckCircle2, desc: 'Restaurant confirmed your order' },
  { id: 'PREPARING', label: 'Preparing', icon: ChefHat, desc: 'Your food is being prepared' },
  { id: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', icon: Bike, desc: 'Order is on the way' },
  { id: 'DELIVERED', label: 'Delivered', icon: Home, desc: 'Enjoy your meal!' }
];

export default function TrackOrderPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeLeftString, setTimeLeftString] = useState<string>('');
  const [isDelayed, setIsDelayed] = useState<boolean>(false);

  const fetchOrder = async () => {
    try {
      const res = await apiClient.get(`/api/orders/${orderId}`);
      if (!res.ok) {
        throw new Error('Order not found');
      }
      const data = await res.json();
      setOrder(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
    
    // Poll every 10 seconds
    const intervalId = setInterval(fetchOrder, 10000);
    
    return () => clearInterval(intervalId);
  }, [orderId]);

  useEffect(() => {
    if (order?.status !== 'PREPARING') {
      setTimeLeftString('');
      setIsDelayed(false);
      return;
    }

    const updateTimer = () => {
      const estimatedTime = order.estimatedCompletionTime 
        ? new Date(order.estimatedCompletionTime).getTime() 
        : new Date(order.createdAt).getTime() + 15 * 60 * 1000;
        
      const now = Date.now();
      const diffMs = estimatedTime - now;

      if (diffMs > 0) {
        setIsDelayed(false);
        const diffSecs = Math.floor(diffMs / 1000);
        const mins = Math.floor(diffSecs / 60);
        const secs = diffSecs % 60;
        setTimeLeftString(`${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);
      } else {
        setIsDelayed(true);
        const elapsedSecs = Math.floor(Math.abs(diffMs) / 1000);
        const mins = Math.floor(elapsedSecs / 60);
        const secs = elapsedSecs % 60;
        setTimeLeftString(`${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);
      }
    };

    updateTimer();
    const intervalId = setInterval(updateTimer, 1000);

    return () => clearInterval(intervalId);
  }, [order?.status, order?.estimatedCompletionTime, order?.createdAt]);

  const handleClearOrder = () => {
    localStorage.removeItem('activeOrderId');
    router.push(`/${params.tenantSlug}`);
  };

  if (loading && !order) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col items-center justify-center p-4 text-center">
        <Loader2 className="w-10 h-10 animate-spin text-orange-500 mb-4" />
        <h2 className="text-xl font-bold">Finding your order...</h2>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col items-center justify-center p-4 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold mb-2">Oops!</h2>
        <p className="text-neutral-500 mb-6">{error || 'Could not load order details'}</p>
        <Link href={`/${params.tenantSlug}`} className="px-6 py-3 bg-orange-600 text-white font-bold rounded-xl shadow-lg hover:bg-orange-700 transition-colors">
          Return to Menu
        </Link>
      </div>
    );
  }

  const currentStageIndex = STAGES.findIndex(s => s.id === order.status);
  const isCancelled = order.status === 'CANCELLED';
  const isComplete = order.status === 'DELIVERED';

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 pb-24">
      <header className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/${params.tenantSlug}`} className="p-2 -ml-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
              <ChevronLeft className="w-6 h-6" />
            </Link>
            <h1 className="text-xl font-bold">Track Order</h1>
          </div>
          <div className="text-sm font-medium text-neutral-500">
            #{order.id.slice(-6).toUpperCase()}
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-6 space-y-6">
        
        {/* Countdown Card */}
        {order.status === 'PREPARING' && timeLeftString && (
          <div className={`rounded-2xl border p-6 flex flex-col items-center justify-center text-center shadow-sm transition-all duration-300 ${
            isDelayed 
              ? 'border-red-500 bg-red-50/40 dark:bg-red-950/10 text-red-600 dark:text-red-400 blink-red-border' 
              : 'border-orange-200 bg-orange-50/30 dark:border-neutral-800 dark:bg-neutral-900 text-orange-600 dark:text-orange-500'
          }`}>
            <style>{`
              @keyframes blinkRed {
                0%, 100% { border-color: rgba(239, 68, 68, 1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
                50% { border-color: rgba(239, 68, 68, 0.2); box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.1); }
              }
              .blink-red-border {
                animation: blinkRed 1.5s infinite;
              }
            `}</style>
            <ChefHat className={`w-8 h-8 mb-2 ${isDelayed ? 'text-red-500' : 'text-orange-500'}`} />
            <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              {isDelayed ? 'Preparation Delayed' : 'Estimated Preparation Time'}
            </div>
            <div className="text-4xl font-extrabold mt-1 font-mono tracking-wider">
              {isDelayed ? `Delayed by ${timeLeftString}` : timeLeftString}
            </div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
              {isDelayed 
                ? 'Our kitchen is running slightly behind schedule. Apologies for the wait!' 
                : 'Chef is preparing your delicious meal!'
              }
            </div>
          </div>
        )}

        {/* Status Card */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 p-6">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">
              {isCancelled ? 'Order Cancelled' : STAGES[Math.max(0, currentStageIndex)]?.label}
            </h2>
            <p className="text-neutral-500 text-sm">
              {isCancelled ? 'Unfortunately, this order was cancelled.' : STAGES[Math.max(0, currentStageIndex)]?.desc}
            </p>
          </div>

          {!isCancelled && (
            <div className="relative pl-6 space-y-8">
              {STAGES.map((stage, index) => {
                const isActive = index === currentStageIndex;
                const isPast = index < currentStageIndex;
                const Icon = stage.icon;

                return (
                  <div key={stage.id} className="relative z-10 flex items-start gap-4">
                    {/* Vertical Line */}
                    {index !== STAGES.length - 1 && (
                      <div 
                        className={`absolute left-[11px] top-8 bottom-[-32px] w-[2px] ${
                          isPast ? 'bg-orange-500' : 'bg-neutral-200 dark:bg-neutral-800'
                        }`} 
                      />
                    )}
                    
                    <div 
                      className={`relative w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 border-2 ${
                        isActive 
                          ? 'bg-orange-500 border-orange-500 ring-4 ring-orange-500/20' 
                          : isPast 
                            ? 'bg-orange-500 border-orange-500' 
                            : 'bg-white dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700'
                      }`}
                    >
                      {isPast ? (
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      ) : (
                        <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-white animate-pulse' : 'bg-neutral-300 dark:bg-neutral-700'}`} />
                      )}
                    </div>
                    
                    <div className={`${isActive ? 'opacity-100' : isPast ? 'opacity-75' : 'opacity-40'}`}>
                      <div className="flex items-center gap-2">
                        <Icon className={`w-5 h-5 ${isActive ? 'text-orange-500' : ''}`} />
                        <h3 className={`font-bold ${isActive ? 'text-orange-600 dark:text-orange-500' : ''}`}>{stage.label}</h3>
                      </div>
                      <p className="text-sm text-neutral-500 mt-1">{stage.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Order Summary */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 p-6">
          <h3 className="font-bold text-lg mb-4">Order Summary</h3>
          <div className="space-y-3 mb-4">
            {order.items.map((item: any) => (
              <div key={item.id} className="flex justify-between items-start">
                <div className="flex gap-3">
                  <div className="bg-neutral-100 dark:bg-neutral-800 rounded flex items-center justify-center w-6 h-6 text-xs font-bold shrink-0">
                    {item.quantity}x
                  </div>
                  <div>
                    <div className="font-medium text-sm">{item.productName || `Product #${item.productId.slice(-4).toUpperCase()}`}</div>
                    {item.variant && <div className="text-xs text-neutral-500">{item.variant}</div>}
                    {item.addons?.length > 0 && (
                      <div className="text-xs text-neutral-500">
                        + {item.addons.map((a: any) => a.addonName).join(', ')}
                      </div>
                    )}
                  </div>
                </div>
                <div className="font-medium text-sm whitespace-nowrap">
                  ₹{item.price * item.quantity}
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-neutral-200 dark:border-neutral-800 pt-4 flex justify-between font-bold text-lg">
            <span>Total Paid</span>
            <span>₹{order.total}</span>
          </div>
        </div>

        {/* Delivery Details */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 p-6">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-orange-500" /> Delivery Details
          </h3>
          <div className="text-sm space-y-2 text-neutral-600 dark:text-neutral-400">
            <p><strong className="text-neutral-900 dark:text-white">Name:</strong> {order.customerName}</p>
            <p><strong className="text-neutral-900 dark:text-white">Phone:</strong> {order.phone}</p>
            <p><strong className="text-neutral-900 dark:text-white">Address:</strong> {order.address}</p>
          </div>
        </div>

      </main>

      {/* Action Bar */}
      {(isComplete || isCancelled) && (
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 p-4 z-40">
          <div className="max-w-2xl mx-auto">
            <button 
              onClick={handleClearOrder}
              className="w-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 font-bold text-lg py-4 rounded-xl shadow-lg transition-all"
            >
              Order Another Meal
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
