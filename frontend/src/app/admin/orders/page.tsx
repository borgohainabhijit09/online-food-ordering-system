'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, RefreshCw, Printer, Eye, X } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';

interface OrderItem {
  id: string;
  product: { name: string };
  quantity: number;
  price: number;
  variant?: string;
}

interface Order {
  id: string;
  customerName: string;
  phone: string;
  address: string;
  orderType: 'DELIVERY' | 'TAKEAWAY' | 'DINE_IN';
  table?: { tableNumber: string };
  total: number;
  status: 'NEW' | 'ACCEPTED' | 'PREPARING' | 'READY' | 'SERVED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';
  remarks?: string;
  createdAt: string;
  items: OrderItem[];
  customerType?: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [restaurantName, setRestaurantName] = useState('Restaurant');
  const [tenantSlug, setTenantSlug] = useState('demo-restaurant');
  const [prepTimeModalOrder, setPrepTimeModalOrder] = useState<Order | null>(null);
  const [customPrepTime, setCustomPrepTime] = useState('');

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  useEffect(() => {
    fetchOrders();
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await apiClient.get('/api/settings');
      if (res.ok) {
        const data = await res.json();
        if (data.restaurantName) setRestaurantName(data.restaurantName);
        if (data.tenantSlug) setTenantSlug(data.tenantSlug);
      }
    } catch (e) {
      console.error('Failed to fetch settings', e);
    }
  };

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/api/orders?limit=50');
      if (res.ok) {
        const data = await res.json();
        // Handle both paginated { orders: [] } and legacy [] response
        setOrders(Array.isArray(data) ? data : (data.orders || []));
      }
    } catch (error) {
      console.error('Failed to fetch orders', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string, prepTimeMinutes?: number) => {
    try {
      const payload: any = { status: newStatus };
      if (prepTimeMinutes !== undefined) {
        payload.prepTimeMinutes = prepTimeMinutes;
      }
      const res = await apiClient.patch(`/api/orders/${orderId}/status`, payload);
      if (res.ok) {
        const updatedOrder = await res.json();
        // Update local state to reflect change immediately
        setOrders(orders.map(o => o.id === orderId ? { ...o, ...updatedOrder } : o));
      }
    } catch (error) {
      console.error('Failed to update status', error);
    }
  };

  const handleShareWhatsApp = (order: Order) => {
    const itemsText = order.items.map(item => 
      `• ${item.quantity}x ${item.product?.name || 'Item'}${item.variant ? ` (${item.variant})` : ''} - ₹${item.price * item.quantity}`
    ).join('\n');

    const trackingLink = `${window.location.origin}/${tenantSlug}/track/${order.id}`;

    const message = `*Bill Details from ${restaurantName}*
---------------------------------------
*Order ID:* #${order.id.slice(0, 8).toUpperCase()}
*Customer:* ${order.customerName}
*Type:* ${order.orderType.replace('_', ' ')}
${order.table ? `*Table:* ${order.table.tableNumber}\n` : ''}---------------------------------------
*Items:*
${itemsText}
---------------------------------------
*TOTAL BILL: ₹${order.total}*
---------------------------------------
Thank you for ordering with us!
Track your order live here:
${trackingLink}`;

    const cleanPhone = order.phone.replace(/\D/g, '');
    const finalPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

    const whatsappUrl = `https://wa.me/${finalPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handlePrintBill = (order: Order) => {
    const printWindow = document.createElement('iframe');
    printWindow.style.position = 'absolute';
    printWindow.style.top = '-10000px';
    document.body.appendChild(printWindow);
    
    const content = `
      <html>
        <head>
          <title>Bill - ${order.id}</title>
          <style>
            @media print {
              @page { margin: 0; }
              body { margin: 1cm; }
            }
            body { font-family: 'Courier New', Courier, monospace; padding: 20px; max-width: 350px; margin: 0 auto; color: black; background: white; }
            .text-center { text-align: center; }
            .flex { display: flex; justify-content: space-between; }
            .bold { font-weight: bold; }
            .border-bottom { border-bottom: 1px dashed black; padding-bottom: 10px; margin-bottom: 10px; }
            .border-top { border-top: 1px dashed black; padding-top: 10px; margin-top: 10px; }
            .text-sm { font-size: 12px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
            td { padding: 4px 0; }
            .text-right { text-align: right; }
          </style>
        </head>
        <body>
          <div class="text-center bold" style="font-size: 20px; margin-bottom: 5px;">${restaurantName}</div>
          <div class="text-center text-sm border-bottom">
            Receipt / Bill<br/>
            Order ID: ${order.id.slice(0, 8).toUpperCase()}<br/>
            Date: ${new Date(order.createdAt).toLocaleString()}
          </div>
          
          <div class="text-sm border-bottom">
            Customer: ${order.customerName}<br/>
            Phone: ${order.phone}<br/>
            Type: ${order.orderType.replace('_', ' ')}
            ${order.table ? `<br/>Table: ${order.table.tableNumber}` : ''}
            ${order.address && order.orderType === 'DELIVERY' ? `<br/>Address: ${order.address}` : ''}
          </div>

          <table>
            ${order.items.map(item => `
              <tr>
                <td style="font-size:13px">${item.quantity}x ${item.product?.name || 'Item'} ${item.variant ? `(${item.variant})` : ''}</td>
                <td class="text-right" style="font-size:13px">₹${item.price * item.quantity}</td>
              </tr>
            `).join('')}
          </table>

          <div class="flex bold border-top" style="font-size: 16px;">
            <span>TOTAL</span>
            <span>₹${order.total}</span>
          </div>
          
          <div class="text-center text-sm border-top" style="margin-top: 20px;">
            Thank you for your visit!
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
      case 'NEW': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'ACCEPTED': return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400';
      case 'PREPARING': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'READY': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      case 'SERVED': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'OUT_FOR_DELIVERY': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      case 'DELIVERED': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'CANCELLED': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-neutral-100 text-neutral-700 dark:bg-neutral-900/30 dark:text-neutral-400';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Orders Management</h2>
        <button 
          onClick={fetchOrders}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm p-4 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs font-medium text-neutral-500 mb-1">Status</label>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="NEW">New</option>
            <option value="ACCEPTED">Accepted</option>
            <option value="PREPARING">Preparing</option>
            <option value="READY">Ready</option>
            <option value="SERVED">Served</option>
            <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-500 mb-1">Order Type</label>
          <select 
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
          >
            <option value="ALL">All Types</option>
            <option value="DELIVERY">Delivery</option>
            <option value="TAKEAWAY">Takeaway</option>
            <option value="DINE_IN">Dine In</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-500 mb-1">Start Date</label>
          <input 
            type="date" 
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-500 mb-1">End Date</label>
          <input 
            type="date" 
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
          />
        </div>
        {(startDate || endDate || statusFilter !== 'ALL' || typeFilter !== 'ALL') && (
          <button 
            onClick={() => { setStartDate(''); setEndDate(''); setStatusFilter('ALL'); setTypeFilter('ALL'); }}
            className="px-4 py-2 text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
          >
            Clear Filters
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm overflow-hidden">
        {isLoading && orders.length === 0 ? (
          <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-neutral-500">No orders received yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap min-w-[800px]">
              <thead className="bg-neutral-50 dark:bg-neutral-950 text-neutral-600 dark:text-neutral-400">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Order ID / Time</th>
                  <th className="px-4 py-2.5 font-medium">Customer Details</th>
                  <th className="px-4 py-2.5 font-medium">Details</th>
                  <th className="px-4 py-2.5 font-medium">Total</th>
                  <th className="px-4 py-2.5 font-medium">Status & Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {orders
                  .filter(order => {
                    if (statusFilter !== 'ALL' && order.status !== statusFilter) return false;
                    if (typeFilter !== 'ALL' && order.orderType !== typeFilter) return false;
                    
                    if (startDate || endDate) {
                      const orderDate = new Date(order.createdAt);
                      orderDate.setHours(0, 0, 0, 0);
                      
                      if (startDate) {
                        const start = new Date(startDate);
                        start.setHours(0, 0, 0, 0);
                        if (orderDate < start) return false;
                      }
                      
                      if (endDate) {
                        const end = new Date(endDate);
                        end.setHours(23, 59, 59, 999);
                        if (orderDate > end) return false;
                      }
                    }
                    return true;
                  })
                  .map(order => (
                  <tr key={order.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                    <td className="px-4 py-2.5">
                      <div className="font-mono text-xs text-neutral-500 mb-1">{order.id.slice(0,8).toUpperCase()}</div>
                      <div className="font-medium whitespace-nowrap">{new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                      <div className="text-xs text-neutral-500">{new Date(order.createdAt).toLocaleDateString()}</div>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="font-medium flex items-center gap-2">
                        {order.customerName}
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 font-bold uppercase">
                          {order.orderType.replace('_', ' ')}
                        </span>
                        {order.customerType && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                            order.customerType === 'REPEAT + VIP' ? 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-400' :
                            order.customerType === 'VIP' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                            order.customerType === 'REPEAT' || order.customerType === 'RETURNING' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                            'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                          }`}>
                            {order.customerType === 'RETURNING' ? 'REPEAT' : order.customerType}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-neutral-500 mb-1">{order.phone}</div>
                      {order.orderType === 'DELIVERY' && (
                        <div className="text-xs text-neutral-500 max-w-xs truncate" title={order.address}>{order.address}</div>
                      )}
                      {order.orderType === 'DINE_IN' && order.table && (
                        <div className="text-xs text-blue-600 font-bold">Table {order.table.tableNumber}</div>
                      )}
                      {order.remarks && (
                        <div className="mt-2 text-xs bg-orange-50 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300 p-2 rounded border border-orange-100 dark:border-orange-800/30">
                          <strong>Remarks:</strong> {order.remarks}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <button 
                        onClick={() => setSelectedOrder(order)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-600 hover:bg-orange-100 dark:bg-orange-900/20 dark:text-orange-400 dark:hover:bg-orange-900/40 rounded-lg transition-colors text-xs font-bold"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View Items
                      </button>
                    </td>
                    <td className="px-4 py-2.5 font-bold text-lg">
                      ₹{order.total}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex flex-col gap-2 items-start">
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                          <button 
                            onClick={() => handlePrintBill(order)}
                            title="Print / Download Bill"
                            className="p-1.5 text-neutral-500 hover:text-orange-600 bg-neutral-100 hover:bg-orange-50 rounded transition-colors"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleShareWhatsApp(order)}
                            title="Share Bill via WhatsApp"
                            className="p-1.5 text-neutral-500 hover:text-green-600 bg-neutral-100 hover:bg-green-50 rounded transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="w-4 h-4" viewBox="0 0 16 16"><path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.949h.004c4.368 0 7.927-3.558 7.93-7.926a7.86 7.86 0 0 0-2.33-5.596ZM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.69-4.98c-.202-.1-1.194-.588-1.378-.654-.183-.066-.317-.1-.45.1-.132.2-.513.649-.629.782-.116.133-.232.148-.43.05-.197-.1-.833-.306-1.585-.975-.586-.522-.981-1.168-1.096-1.365-.116-.197-.012-.303.088-.403.09-.09.198-.232.298-.348.1-.116.133-.197.198-.33.065-.132.033-.248-.016-.347-.049-.1-.45-1.082-.616-1.482-.162-.389-.327-.336-.45-.336-.116-.003-.248-.003-.38-.003-.132 0-.347.05-.529.25-.183.2-.699.68-6.99 1.66c0 .98.71 1.927.81 2.062.1.133 1.396 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.194-.488 1.362-1.06.168-.573.168-1.064.118-1.164-.05-.1-.183-.15-3.69-.25Z"/></svg>
                          </button>
                        </div>
                        {order.status === 'NEW' && (
                          <div className="flex gap-1.5 mt-1">
                            <button
                              onClick={() => setPrepTimeModalOrder(order)}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-xs transition-colors shadow-sm"
                            >
                              Accept & Prepare
                            </button>
                            <button
                              onClick={() => { if(confirm('Are you sure you want to reject this order?')) handleStatusChange(order.id, 'CANCELLED') }}
                              className="px-2 py-1 bg-red-100 text-red-600 hover:bg-red-200 font-bold rounded text-xs transition-colors"
                            >
                              Reject
                            </button>
                          </div>
                        )}

                        {order.status === 'PREPARING' && (
                          <div className="mt-1">
                            {order.orderType === 'DINE_IN' && (
                              <button onClick={() => handleStatusChange(order.id, 'SERVED')} className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded text-xs transition-colors shadow-sm">
                                Mark Served
                              </button>
                            )}
                            {order.orderType === 'TAKEAWAY' && (
                              <button onClick={() => handleStatusChange(order.id, 'READY')} className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded text-xs transition-colors shadow-sm">
                                Ready for Pickup
                              </button>
                            )}
                            {order.orderType === 'DELIVERY' && (
                              <button onClick={() => handleStatusChange(order.id, 'READY')} className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded text-xs transition-colors shadow-sm">
                                Ready for Rider
                              </button>
                            )}
                          </div>
                        )}

                        {order.status === 'READY' && (
                          <div className="mt-1">
                            {order.orderType === 'TAKEAWAY' && (
                              <button onClick={() => handleStatusChange(order.id, 'DELIVERED')} className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded text-xs transition-colors shadow-sm">
                                Handed Over
                              </button>
                            )}
                            {order.orderType === 'DELIVERY' && (
                              <button onClick={() => handleStatusChange(order.id, 'OUT_FOR_DELIVERY')} className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded text-xs transition-colors shadow-sm">
                                Out for Delivery
                              </button>
                            )}
                          </div>
                        )}

                        {order.status === 'OUT_FOR_DELIVERY' && (
                          <div className="mt-1">
                            <button onClick={() => handleStatusChange(order.id, 'DELIVERED')} className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-xs transition-colors shadow-sm">
                              Mark Delivered
                            </button>
                          </div>
                        )}

                        {['ACCEPTED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY'].includes(order.status) && (
                          <button onClick={() => { if(confirm('Are you sure you want to cancel this order?')) handleStatusChange(order.id, 'CANCELLED') }} className="text-[10px] text-red-500 hover:underline mt-1.5 block font-medium">
                            Cancel Order
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-neutral-200 dark:border-neutral-800 animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
              <h3 className="text-lg font-bold">Order Details</h3>
              <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
               <div className="flex justify-between items-start mb-6">
                 <div>
                   <div className="text-sm text-neutral-500">Order ID</div>
                   <div className="font-mono font-bold">{selectedOrder.id.slice(0,8).toUpperCase()}</div>
                 </div>
                 <div className="text-right">
                   <div className="text-sm text-neutral-500">Order Time</div>
                   <div className="font-bold">{new Date(selectedOrder.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                 </div>
               </div>
               
               <h4 className="font-bold mb-3 text-sm text-neutral-500 uppercase tracking-wider">Ordered Items</h4>
               <ul className="space-y-3 mb-6">
                 {selectedOrder.items.map(item => (
                   <li key={item.id} className="flex justify-between items-start text-sm border-b border-neutral-100 dark:border-neutral-800 pb-3">
                     <div>
                       <div className="flex items-center gap-2">
                         <span className="font-bold bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded text-xs">{item.quantity}x</span> 
                         <span className="font-medium">{item.product?.name || 'Item'}</span>
                       </div>
                       {item.variant && <div className="text-xs text-neutral-500 mt-1 pl-8">Variant: {item.variant}</div>}
                     </div>
                     <div className="font-bold whitespace-nowrap">₹{item.price * item.quantity}</div>
                   </li>
                 ))}
               </ul>

               {selectedOrder.remarks && (
                 <div className="mb-6 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-100 dark:border-orange-800/30 text-sm">
                   <strong className="text-orange-800 dark:text-orange-400 block mb-1">Customer Remarks:</strong>
                   <span className="text-orange-700 dark:text-orange-300">{selectedOrder.remarks}</span>
                 </div>
               )}

               <div className="flex justify-between items-center font-black text-xl pt-4 border-t border-neutral-200 dark:border-neutral-700">
                 <span>Total Amount</span>
                 <span className="text-orange-600">₹{selectedOrder.total}</span>
               </div>
            </div>
            <div className="p-4 bg-neutral-50 dark:bg-neutral-950 border-t border-neutral-100 dark:border-neutral-800 flex justify-end gap-3">
              <button 
                onClick={() => handleShareWhatsApp(selectedOrder)}
                className="px-4 py-2 flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-bold text-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="w-4 h-4" viewBox="0 0 16 16"><path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.949h.004c4.368 0 7.927-3.558 7.93-7.926a7.86 7.86 0 0 0-2.33-5.596ZM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.69-4.98c-.202-.1-1.194-.588-1.378-.654-.183-.066-.317-.1-.45.1-.132.2-.513.649-.629.782-.116.133-.232.148-.43.05-.197-.1-.833-.306-1.585-.975-.586-.522-.981-1.168-1.096-1.365-.116-.197-.012-.303.088-.403.09-.09.198-.232.298-.348.1-.116.133-.197.198-.33.065-.132.033-.248-.016-.347-.049-.1-.45-1.082-.616-1.482-.162-.389-.327-.336-.45-.336-.116-.003-.248-.003-.38-.003-.132 0-.347.05-.529.25-.183.2-.699.68-6.99 1.66c0 .98.71 1.927.81 2.062.1.133 1.396 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.194-.488 1.362-1.06.168-.573.168-1.064.118-1.164-.05-.1-.183-.15-3.69-.25Z"/></svg> Share Bill
              </button>
              <button 
                onClick={() => handlePrintBill(selectedOrder)}
                className="px-4 py-2 flex items-center gap-2 bg-neutral-200 dark:bg-neutral-800 rounded-lg hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors font-bold text-sm"
              >
                <Printer className="w-4 h-4" /> Print Bill
              </button>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-bold text-sm"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Prep Time Modal */}
      {prepTimeModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden border border-neutral-200 dark:border-neutral-800 animate-in zoom-in duration-200">
            <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
              <h3 className="text-lg font-bold">Accept Order & Set Prep Time</h3>
              <button 
                onClick={() => setPrepTimeModalOrder(null)} 
                className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-neutral-500">
                Choose the estimated preparation time for this order. A countdown will be shown to the customer.
              </p>
              <div className="grid grid-cols-3 gap-2">
                {[15, 30, 45].map((mins) => (
                  <button
                    key={mins}
                    onClick={() => {
                      handleStatusChange(prepTimeModalOrder.id, 'PREPARING', mins);
                      setPrepTimeModalOrder(null);
                    }}
                    className="py-2.5 px-2 bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/30 dark:hover:bg-orange-900/50 text-orange-600 dark:text-orange-400 font-bold rounded-xl border border-orange-200 dark:border-orange-900/50 transition-colors text-xs"
                  >
                    {mins} mins
                  </button>
                ))}
              </div>
              <div className="border-t border-neutral-100 dark:border-neutral-800 pt-4 space-y-2">
                <label className="block text-xs font-bold text-neutral-500 uppercase">Custom Time (minutes)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={customPrepTime}
                    onChange={(e) => setCustomPrepTime(e.target.value)}
                    placeholder="Enter minutes..."
                    className="flex-1 px-3 py-2 bg-neutral-50 dark:bg-neutral-955 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none text-xs focus:border-orange-500"
                  />
                  <button
                    onClick={() => {
                      const mins = parseInt(customPrepTime);
                      if (mins > 0) {
                        handleStatusChange(prepTimeModalOrder.id, 'PREPARING', mins);
                        setPrepTimeModalOrder(null);
                        setCustomPrepTime('');
                      }
                    }}
                    disabled={!customPrepTime}
                    className="px-4 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors shrink-0"
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
