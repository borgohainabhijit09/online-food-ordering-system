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
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [restaurantName, setRestaurantName] = useState('Restaurant');

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
      }
    } catch (e) {
      console.error('Failed to fetch settings', e);
    }
  };

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/api/orders');
      if (res.ok) {
        setOrders(await res.json());
      }
    } catch (error) {
      console.error('Failed to fetch orders', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const res = await apiClient.patch(`/api/orders/${orderId}/status`, { status: newStatus });
      if (res.ok) {
        // Update local state to reflect change immediately
        setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus as any } : o));
      }
    } catch (error) {
      console.error('Failed to update status', error);
    }
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
                        </div>
                        <select 
                          className="text-xs border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded p-1 outline-none"
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        >
                          <option value="NEW">New</option>
                          <option value="ACCEPTED">Accept</option>
                          <option value="PREPARING">Preparing</option>
                          <option value="READY">Ready</option>
                          <option value="SERVED">Served</option>
                          <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                          <option value="DELIVERED">Delivered</option>
                          <option value="CANCELLED">Cancel</option>
                        </select>
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
    </div>
  );
}
