'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Loader2, RefreshCw, Printer, CheckCircle2, PlayCircle, ChefHat } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';

interface OrderItem {
  id: string;
  product: { name: string };
  quantity: number;
  price: number;
  variant?: string;
  addons?: { addonName: string; price: number }[];
}

interface Order {
  id: string;
  customerName: string;
  phone: string;
  address: string;
  orderType: 'DELIVERY' | 'TAKEAWAY' | 'DINE_IN';
  table?: { tableNumber: string };
  status: 'NEW' | 'ACCEPTED' | 'PREPARING' | 'READY' | 'SERVED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';
  remarks?: string;
  createdAt: string;
  items: OrderItem[];
}

export default function KitchenOrderTicketPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [restaurantName, setRestaurantName] = useState('Restaurant');
  const prevOrdersRef = useRef<Order[]>([]);
  
  // Audio setup for new order notification
  const playNotificationSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
      oscillator.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.5); // A4
      
      gainNode.gain.setValueAtTime(1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
      console.error('Audio playback failed', e);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchSettings();

    // Auto refresh every 20 seconds
    const intervalId = setInterval(fetchOrders, 20000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    // Check for new orders to play sound
    const newOrders = orders.filter(o => o.status === 'NEW');
    const prevNewOrders = prevOrdersRef.current.filter(o => o.status === 'NEW');
    
    // If there are more NEW orders than before, or a brand new order ID is found
    if (newOrders.length > 0) {
      const hasBrandNewOrder = newOrders.some(
        no => !prevNewOrders.find(po => po.id === no.id)
      );
      if (hasBrandNewOrder) {
        playNotificationSound();
      }
    }
    
    prevOrdersRef.current = orders;
  }, [orders]);

  const fetchSettings = async () => {
    try {
      const res = await apiClient.get('/api/settings');
      if (res.ok) {
        const data = await res.json();
        if (data.restaurantName) setRestaurantName(data.restaurantName);
      }
    } catch (e) {
      console.error('Failed to fetch settings', e);
    }
  };

  const fetchOrders = async () => {
    try {
      // Fetch only active kitchen orders directly from the server
      const res = await apiClient.get('/api/orders?status=KOT&limit=100');
      if (res.ok) {
        const data = await res.json();
        const allOrders: Order[] = Array.isArray(data) ? data : (data.orders || []);
        // Sort: Oldest first so kitchen prepares them in order
        allOrders.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        setOrders(allOrders);
      }
    } catch (error) {
      console.error('Failed to fetch orders', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      // Optimistic update
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus as any } : o));
      
      const res = await apiClient.patch(`/api/orders/${orderId}/status`, { status: newStatus });
      if (!res.ok) {
        // Revert on failure
        fetchOrders();
      }
    } catch (error) {
      console.error('Failed to update status', error);
      fetchOrders();
    }
  };

  const handlePrintKOT = (order: Order) => {
    const printWindow = document.createElement('iframe');
    printWindow.style.position = 'absolute';
    printWindow.style.top = '-10000px';
    document.body.appendChild(printWindow);
    
    const content = `
      <html>
        <head>
          <title>KOT - ${order.id}</title>
          <style>
            @media print {
              @page { margin: 0; }
              body { margin: 1cm; }
            }
            body { font-family: 'Courier New', Courier, monospace; padding: 10px; max-width: 300px; margin: 0 auto; color: black; background: white; }
            .text-center { text-align: center; }
            .bold { font-weight: bold; }
            .border-bottom { border-bottom: 2px dashed black; padding-bottom: 10px; margin-bottom: 10px; }
            .text-xl { font-size: 24px; }
            .text-lg { font-size: 18px; }
            .text-sm { font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th { text-align: left; border-bottom: 1px solid black; padding-bottom: 5px; }
            td { padding: 8px 0; vertical-align: top; }
            .qty { width: 40px; font-weight: bold; font-size: 18px; text-align: center;}
            .item-name { font-size: 16px; font-weight: bold; }
            .variant { font-size: 12px; font-weight: normal; font-style: italic; display: block; }
            .addon { font-size: 12px; font-weight: normal; margin-left: 10px; display: block; }
            .remarks { margin-top: 15px; padding: 10px; border: 1px solid black; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="text-center bold text-xl border-bottom">
            KOT
          </div>
          <div class="border-bottom">
            <div class="text-sm">Order: <span class="bold text-lg">${order.id.slice(0, 8).toUpperCase()}</span></div>
            <div class="text-sm">Time: ${new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
            <div class="text-sm">Type: <span class="bold">${order.orderType.replace('_', ' ')}</span></div>
            ${order.table ? `<div class="text-sm text-center" style="margin-top: 10px; padding: 5px; border: 1px solid black; font-size: 20px; font-weight: bold;">TABLE ${order.table.tableNumber}</div>` : ''}
          </div>
          
          <table>
            <thead>
              <tr>
                <th class="qty">Qty</th>
                <th>Item</th>
              </tr>
            </thead>
            <tbody>
              ${order.items.map(item => `
                <tr>
                  <td class="qty">${item.quantity}</td>
                  <td>
                    <span class="item-name">${item.product?.name || 'Item'}</span>
                    ${item.variant ? `<span class="variant">- ${item.variant}</span>` : ''}
                    ${item.addons && item.addons.length > 0 ? item.addons.map(a => `<span class="addon">+ ${a.addonName}</span>`).join('') : ''}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          ${order.remarks ? `
            <div class="remarks">
              NOTES:<br/>
              ${order.remarks}
            </div>
          ` : ''}
          
          <div class="text-center text-sm" style="margin-top: 30px;">
            End of Ticket
          </div>
        </body>
      </html>
    `;
    
    printWindow.contentDocument?.write(content);
    printWindow.contentDocument?.close();
    
    setTimeout(() => {
      printWindow.contentWindow?.focus();
      printWindow.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(printWindow);
      }, 500);
    }, 250);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NEW': 
      case 'ACCEPTED': return 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800';
      case 'PREPARING': return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800';
      case 'READY': return 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800';
      default: return 'bg-neutral-50 border-neutral-200 dark:bg-neutral-900/20 dark:border-neutral-800';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'NEW': return <span className="px-1.5 py-0.5 bg-blue-500 text-white text-[9px] font-bold rounded uppercase animate-pulse">New Order</span>;
      case 'ACCEPTED': return <span className="px-1.5 py-0.5 bg-blue-400 text-white text-[9px] font-bold rounded uppercase">Accepted</span>;
      case 'PREPARING': return <span className="px-1.5 py-0.5 bg-yellow-500 text-white text-[9px] font-bold rounded uppercase">Preparing</span>;
      case 'READY': return <span className="px-1.5 py-0.5 bg-emerald-500 text-white text-[9px] font-bold rounded uppercase">Ready</span>;
      default: return null;
    }
  };

  const sortOrdersByPriority = (list: Order[]) => {
    return [...list].sort((a, b) => {
      const priorityA = a.status === 'NEW' ? 0 : a.status === 'ACCEPTED' ? 1 : a.status === 'PREPARING' ? 2 : 3;
      const priorityB = b.status === 'NEW' ? 0 : b.status === 'ACCEPTED' ? 1 : b.status === 'PREPARING' ? 2 : 3;
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  };

  const dineInOrders = sortOrdersByPriority(orders.filter(o => o.orderType === 'DINE_IN'));
  const takeawayOrders = sortOrdersByPriority(orders.filter(o => o.orderType === 'TAKEAWAY'));
  const deliveryOrders = sortOrdersByPriority(orders.filter(o => o.orderType === 'DELIVERY'));

  const renderOrderCard = (order: Order) => (
    <div 
      key={order.id} 
      className={`flex flex-col bg-white dark:bg-neutral-900 rounded-xl shadow-sm border-2 overflow-hidden transition-all duration-300 shrink-0 ${getStatusColor(order.status)}`}
    >
      {/* Header */}
      <div className="p-2 border-b border-inherit flex items-center justify-between bg-white/50 dark:bg-black/20">
        <div className="flex flex-col min-w-0 flex-1 pr-2">
          <span className="font-bold text-xs truncate text-neutral-900 dark:text-white" title={order.customerName}>
            {order.customerName}
          </span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="font-mono text-[9px] text-neutral-400 font-medium">#{order.id.slice(0, 4).toUpperCase()}</span>
            <span className="text-[9px] text-neutral-500 font-medium">{new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {getStatusBadge(order.status)}
          <span className="text-[9px] font-bold px-1.5 py-0.5 bg-neutral-200 dark:bg-neutral-800 rounded text-neutral-700 dark:text-neutral-300">
            {order.orderType.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Table Info if Dine In */}
      {order.orderType === 'DINE_IN' && order.table && (
        <div className="bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-400 font-black text-center py-1 text-xs border-b border-inherit">
          TABLE {order.table.tableNumber}
        </div>
      )}

      {/* Items */}
      <div className="p-3 flex-1 overflow-y-auto max-h-[300px]">
        <table className="w-full text-xs">
          <tbody>
            {order.items.map(item => (
              <tr key={item.id} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0">
                <td className="py-1.5 align-top w-6">
                  <span className="font-bold text-xs bg-neutral-100 dark:bg-neutral-800 w-6 h-6 flex items-center justify-center rounded">
                    {item.quantity}
                  </span>
                </td>
                <td className="py-1.5 pl-2">
                  <div className="font-bold text-xs leading-tight mb-0.5 text-neutral-900 dark:text-neutral-100">{item.product?.name || 'Unknown Item'}</div>
                  {item.variant && <div className="text-[10px] text-neutral-500 font-medium italic">- {item.variant}</div>}
                  {item.addons && item.addons.map((a, i) => (
                    <div key={i} className="text-[10px] text-neutral-500 font-medium ml-2">+ {a.addonName}</div>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {order.remarks && (
          <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-lg">
            <div className="text-[9px] font-black text-red-600 dark:text-red-400 uppercase tracking-wider mb-1">Kitchen Note</div>
            <div className="text-xs font-bold text-red-800 dark:text-red-300">{order.remarks}</div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-2 bg-neutral-50 dark:bg-neutral-950 border-t border-inherit flex gap-1.5">
        <button
          onClick={() => handlePrintKOT(order)}
          className="p-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors text-neutral-600 dark:text-neutral-300"
          title="Print KOT"
        >
          <Printer className="w-4 h-4" />
        </button>
        
        {(order.status === 'NEW' || order.status === 'ACCEPTED') && (
          <button
            onClick={() => updateOrderStatus(order.id, 'PREPARING')}
            className="flex-1 flex items-center justify-center gap-1.5 bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-1.5 rounded-lg transition-colors text-xs"
          >
            <PlayCircle className="w-4 h-4" />
            Start Preparing
          </button>
        )}
        
        {order.status === 'PREPARING' && (
          <button
            onClick={() => updateOrderStatus(order.id, 'READY')}
            className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-1.5 rounded-lg transition-colors text-xs"
          >
            <CheckCircle2 className="w-4 h-4" />
            Mark as Ready
          </button>
        )}

        {order.status === 'READY' && (
          <div className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-bold py-1.5 rounded-lg text-xs">
            <CheckCircle2 className="w-4 h-4" />
            Food is Ready
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-100px)]">
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg text-orange-600 dark:text-orange-500">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Kitchen Display System</h2>
            <p className="text-sm text-neutral-500">Manage live orders and print Kitchen Tickets</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-neutral-500 bg-white dark:bg-neutral-900 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            Auto-refreshing
          </div>
          <button 
            onClick={() => { fetchOrders(); playNotificationSound(); }}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-neutral-100/50 dark:bg-neutral-950/50 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
        {isLoading && orders.length === 0 ? (
          <div className="h-full flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-orange-500" /></div>
        ) : orders.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-neutral-500 space-y-4">
            <ChefHat className="w-16 h-16 opacity-20" />
            <p className="text-lg font-medium">No active kitchen orders</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full min-h-0">
            {/* Dine-In Column */}
            <div className="flex flex-col bg-neutral-50 dark:bg-neutral-900/30 rounded-xl p-4 border border-neutral-200 dark:border-neutral-800 h-full min-h-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                  <h3 className="font-bold text-neutral-800 dark:text-neutral-200">Dine-In</h3>
                </div>
                <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 font-bold text-xs rounded-full">
                  {dineInOrders.length}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-4 pr-1 mt-4">
                {dineInOrders.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-neutral-400 dark:text-neutral-500 py-12 text-center">
                    <p className="text-sm font-medium">No active dine-in orders</p>
                  </div>
                ) : (
                  dineInOrders.map(order => renderOrderCard(order))
                )}
              </div>
            </div>

            {/* Takeaway Column */}
            <div className="flex flex-col bg-neutral-50 dark:bg-neutral-900/30 rounded-xl p-4 border border-neutral-200 dark:border-neutral-800 h-full min-h-0 animate-in fade-in slide-in-from-bottom-2 duration-300 delay-75">
              <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <h3 className="font-bold text-neutral-800 dark:text-neutral-200">Takeaway</h3>
                </div>
                <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 font-bold text-xs rounded-full">
                  {takeawayOrders.length}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-4 pr-1 mt-4">
                {takeawayOrders.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-neutral-400 dark:text-neutral-500 py-12 text-center">
                    <p className="text-sm font-medium">No active takeaway orders</p>
                  </div>
                ) : (
                  takeawayOrders.map(order => renderOrderCard(order))
                )}
              </div>
            </div>

            {/* Delivery Column */}
            <div className="flex flex-col bg-neutral-50 dark:bg-neutral-900/30 rounded-xl p-4 border border-neutral-200 dark:border-neutral-800 h-full min-h-0 animate-in fade-in slide-in-from-bottom-2 duration-300 delay-150">
              <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <h3 className="font-bold text-neutral-800 dark:text-neutral-200">Delivery</h3>
                </div>
                <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400 font-bold text-xs rounded-full">
                  {deliveryOrders.length}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-4 pr-1 mt-4">
                {deliveryOrders.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-neutral-400 dark:text-neutral-500 py-12 text-center">
                    <p className="text-sm font-medium">No active delivery orders</p>
                  </div>
                ) : (
                  deliveryOrders.map(order => renderOrderCard(order))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
