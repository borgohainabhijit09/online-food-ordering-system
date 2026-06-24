'use client';

import React, { useState, useEffect, useRef } from 'react';
import { apiClient } from '../../../lib/apiClient';
import { Plus, Edit2, Trash2, QrCode, Download, Printer, X, Loader2, Bell, FileText, CheckCircle2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import FeatureGate from '../../../components/FeatureGate';

export default function AdminTables() {
  const [tables, setTables] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ id: '', tableNumber: '', tableName: '', capacity: 4 });
  const [qrModalTable, setQrModalTable] = useState<any>(null);
  const [activeOrderModal, setActiveOrderModal] = useState<any>(null);
  const [fetchingOrder, setFetchingOrder] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const qrRef = useRef<SVGSVGElement>(null);

  const fetchData = async () => {
    try {
      const [tableRes, eventRes] = await Promise.all([
        apiClient.get('/api/tables'),
        apiClient.get('/api/tables/events')
      ]);
      if (tableRes.ok) setTables(await tableRes.json());
      if (eventRes.ok) setEvents(await eventRes.json());
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000); // Poll every 15s for new events/occupancy
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isEdit = !!formData.id;
      const res = isEdit
        ? await apiClient.patch(`/api/tables/${formData.id}`, formData)
        : await apiClient.post('/api/tables', formData);

      if (res.ok) {
        setIsModalOpen(false);
        fetchData();
      } else {
        const error = await res.json();
        alert(error.message);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this table?')) return;
    try {
      const res = await apiClient.delete(`/api/tables/${id}`);
      if (res.ok) fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const handleResolveEvent = async (id: string) => {
    try {
      const res = await apiClient.patch(`/api/tables/events/${id}/resolve`, {});
      if (res.ok) fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const downloadQR = () => {
    if (!qrRef.current) return;
    const svgData = new XMLSerializer().serializeToString(qrRef.current);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `table-${qrModalTable.tableNumber}-qr.png`;
      downloadLink.href = `${pngFile}`;
      downloadLink.click();
    };
    img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
  };

  const printQR = () => {
    if (!qrRef.current) return;
    const svgData = new XMLSerializer().serializeToString(qrRef.current);
    const windowContent = '<!DOCTYPE html><html><head><title>Print QR</title></head><body>' + svgData + '</body></html>';
    const printWin = window.open('', '', 'width=800,height=600');
    if (printWin) {
      printWin.document.open();
      printWin.document.write(windowContent);
      printWin.document.close();
      printWin.focus();
      printWin.print();
      printWin.close();
    }
  };

  const openForm = (table?: any) => {
    if (table) {
      setFormData(table);
    } else {
      setFormData({ id: '', tableNumber: '', tableName: '', capacity: 4 });
    }
    setIsModalOpen(true);
  };

  const getTableUrl = (tableNumber: string) => {
    if (typeof window === 'undefined') return '';
    const baseUrl = window.location.origin;
    
    // We can extract the tenantSlug from the JWT token stored in localStorage/sessionStorage
    let tenantSlug = 'demo';
    try {
      const token = sessionStorage.getItem('impersonatedToken') || localStorage.getItem('adminToken');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.tenantSlug) tenantSlug = payload.tenantSlug;
      }
    } catch (e) {}

    return `${baseUrl}/${tenantSlug}?table=${encodeURIComponent(tableNumber)}`;
  };

  const handleTableClick = async (table: any) => {
    if (table.status === 'OCCUPIED') {
      setFetchingOrder(table.id);
      try {
        const res = await apiClient.get(`/api/orders?tableId=${table.id}&status=ACTIVE`);
        if (res.ok) {
          const orders = await res.json();
          if (orders.length > 0) {
            const orderRes = await apiClient.get(`/api/orders/${orders[0].id}`);
            if (orderRes.ok) {
              setActiveOrderModal({ table, order: await orderRes.json() });
            }
          } else {
            if (window.confirm(`No active order found for Table ${table.tableNumber}. Would you like to mark it as AVAILABLE?`)) {
              const patchRes = await apiClient.patch(`/api/tables/${table.id}`, { status: 'AVAILABLE' });
              if (patchRes.ok) fetchData();
            }
          }
        }
      } catch (error) {
        console.error(error);
      } finally {
        setFetchingOrder(null);
      }
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setIsUpdatingStatus(true);
    try {
      const res = await apiClient.patch(`/api/orders/${orderId}/status`, { status: newStatus });
      if (res.ok) {
        setActiveOrderModal({ ...activeOrderModal, order: { ...activeOrderModal.order, status: newStatus } });
      }
    } catch (error) {
      console.error('Failed to update status', error);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin" /></div>;

  return (
    <FeatureGate feature="RESERVATIONS" featureName="Reservations" requiredPlan="Growth">
      <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Table Management</h1>
        <button onClick={() => openForm()} className="bg-orange-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-orange-700">
          <Plus className="w-4 h-4" /> Add Table
        </button>
      </div>

      {events.length > 0 && (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 shadow-sm border border-red-200 dark:border-red-900/30">
          <h2 className="text-lg font-bold text-red-600 dark:text-red-500 mb-4 flex items-center gap-2"><Bell className="w-5 h-5" /> Active Requests</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map(event => (
              <div key={event.id} className="bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50 p-4 rounded-xl flex justify-between items-center transition-all hover:shadow-md">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${event.type === 'CALL_WAITER' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-500' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-500'}`}>
                    {event.type === 'CALL_WAITER' ? <Bell className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="font-bold">Table {event.table?.tableNumber}</div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                      {event.type === 'CALL_WAITER' ? 'Requested Waiter' : 'Requested Bill'}
                    </div>
                  </div>
                </div>
                <button onClick={() => handleResolveEvent(event.id)} className="p-2 text-emerald-600 dark:text-emerald-500 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded-full transition-colors" title="Mark Resolved">
                  <CheckCircle2 className="w-6 h-6" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        <div className="p-6 border-b border-neutral-200 dark:border-neutral-800">
          <h2 className="text-lg font-bold">Dine-In Dashboard</h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Live view of table occupancy.</p>
        </div>
        <div className="p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {tables.map((table) => (
            <div 
              key={table.id} 
              onClick={() => handleTableClick(table)}
              className={`aspect-square rounded-2xl border-2 flex flex-col items-center justify-center p-4 relative group transition-all ${table.status === 'OCCUPIED' ? 'cursor-pointer hover:scale-105' : ''} ${
                table.status === 'OCCUPIED' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-700 dark:text-blue-400 shadow-md shadow-blue-500/10' :
                table.status === 'RESERVED' ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-500 text-orange-700 dark:text-orange-400 shadow-md shadow-orange-500/10' :
                'bg-neutral-50 dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:border-neutral-300 dark:hover:border-neutral-700 hover:shadow-sm'
              }`}
            >
              <div className="text-3xl font-black mb-1">
                {fetchingOrder === table.id ? <Loader2 className="w-8 h-8 animate-spin" /> : table.tableNumber}
              </div>
              <div className="text-xs font-bold uppercase tracking-wider">{table.status}</div>
              <div className="text-[10px] opacity-70 mt-1">Cap: {table.capacity}</div>
              
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white dark:bg-neutral-800 shadow-sm p-1 rounded-lg border border-neutral-100 dark:border-neutral-700" onClick={(e) => e.stopPropagation()}>
                <button onClick={() => setQrModalTable(table)} className="p-1 hover:text-orange-600 dark:hover:text-orange-500 transition-colors"><QrCode className="w-4 h-4" /></button>
                <button onClick={() => openForm(table)} className="p-1 hover:text-blue-600 dark:hover:text-blue-500 transition-colors"><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(table.id)} className="p-1 hover:text-red-600 dark:hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl max-w-md w-full p-6 shadow-xl border border-neutral-200 dark:border-neutral-800">
            <h2 className="text-xl font-bold mb-4">{formData.id ? 'Edit Table' : 'Add Table'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-neutral-700 dark:text-neutral-300">Table Number</label>
                <input required type="text" value={formData.tableNumber} onChange={e => setFormData({...formData, tableNumber: e.target.value})} className="w-full border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 p-3 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-neutral-700 dark:text-neutral-300">Table Name (Optional)</label>
                <input type="text" value={formData.tableName} onChange={e => setFormData({...formData, tableName: e.target.value})} className="w-full border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 p-3 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all" placeholder="e.g. Patio 1" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-neutral-700 dark:text-neutral-300">Capacity</label>
                <input required type="number" min="1" value={formData.capacity} onChange={e => setFormData({...formData, capacity: parseInt(e.target.value)})} className="w-full border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 p-3 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all" />
              </div>
              <div className="flex gap-3 justify-end mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-xl transition-colors font-medium">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl transition-colors font-medium shadow-sm">Save Table</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {qrModalTable && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl max-w-md w-full p-6 text-center relative shadow-xl border border-neutral-200 dark:border-neutral-800">
            <button onClick={() => setQrModalTable(null)} className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"><X className="w-5 h-5" /></button>
            <h2 className="text-xl font-bold mb-2">Table {qrModalTable.tableNumber} QR Code</h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">Customers can scan this code to order from their table.</p>
            
            <div className="flex justify-center bg-white p-4 border border-neutral-200 dark:border-neutral-700 rounded-xl inline-block mx-auto mb-6 shadow-sm">
              <QRCodeSVG 
                ref={qrRef}
                value={getTableUrl(qrModalTable.tableNumber)} 
                size={200}
                level="H"
                includeMargin={true}
              />
            </div>

            <div className="flex gap-3 justify-center">
              <button onClick={downloadQR} className="flex flex-1 justify-center items-center gap-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 px-4 py-2 rounded-xl font-medium transition-colors"><Download className="w-4 h-4" /> Download</button>
              <button onClick={printQR} className="flex flex-1 justify-center items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-xl font-medium transition-colors shadow-sm"><Printer className="w-4 h-4" /> Print</button>
            </div>
          </div>
        </div>
      )}

      {activeOrderModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl max-w-lg w-full p-6 shadow-xl border border-neutral-200 dark:border-neutral-800 relative max-h-[90vh] flex flex-col">
            <button onClick={() => setActiveOrderModal(null)} className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"><X className="w-5 h-5" /></button>
            
            <div className="mb-4">
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Table {activeOrderModal.table.tableNumber} Order</h2>
              <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                <select
                  disabled={isUpdatingStatus}
                  className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-medium rounded py-1 px-2 outline-none focus:ring-1 focus:ring-orange-500"
                  value={activeOrderModal.order.status}
                  onChange={(e) => handleStatusChange(activeOrderModal.order.id, e.target.value)}
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
                &bull;
                <span>{new Date(activeOrderModal.order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto mb-6 pr-2">
              <h3 className="font-bold text-neutral-900 dark:text-white mb-3">Items</h3>
              <div className="space-y-4">
                {activeOrderModal.order.items.map((item: any) => (
                  <div key={item.id} className="flex justify-between items-start text-sm">
                    <div>
                      <div className="font-medium text-neutral-900 dark:text-white">{item.quantity}x {item.productName}</div>
                      {item.variant && <div className="text-neutral-500 dark:text-neutral-400 ml-4 text-xs">Var: {item.variant}</div>}
                      {item.addons?.map((addon: any) => (
                        <div key={addon.id} className="text-neutral-500 dark:text-neutral-400 ml-4 text-xs">+ {addon.addonName}</div>
                      ))}
                    </div>
                    <div className="font-medium">₹{item.price * item.quantity}</div>
                  </div>
                ))}
              </div>
              
              {activeOrderModal.order.remarks && (
                <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-900/20 text-orange-800 dark:text-orange-300 text-sm rounded-xl border border-orange-100 dark:border-orange-800/30">
                  <span className="font-bold">Instructions:</span> {activeOrderModal.order.remarks}
                </div>
              )}
            </div>

            <div className="border-t border-neutral-200 dark:border-neutral-800 pt-4 shrink-0">
              <div className="flex justify-between font-bold text-lg text-neutral-900 dark:text-white mb-4">
                <span>Total Bill</span>
                <span>₹{activeOrderModal.order.total}</span>
              </div>
              <div className="flex gap-3">
                <button onClick={() => window.open(`/admin/orders`, '_blank')} className="flex-1 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 px-4 py-3 rounded-xl font-bold transition-colors">View in Orders</button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </FeatureGate>
  );
}
