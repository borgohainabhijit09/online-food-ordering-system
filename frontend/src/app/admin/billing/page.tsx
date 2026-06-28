'use client';

import React, { useState, useEffect } from 'react';
import { Receipt, CreditCard, DollarSign, Download, Plus, X } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Invoice {
  id: string;
  date: string;
  amount: number;
  type: string;
  method: string;
  status: string;
}

interface BillingSummary {
  cashTotal: number;
  digitalTotal: number;
  totalInvoices: number;
  invoices: Invoice[];
}

export default function BillingPage() {
  const [summary, setSummary] = useState<BillingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actualCash, setActualCash] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      const res = await apiClient.get('/api/billing/summary');
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
      } else {
        console.error('Failed to fetch billing summary', await res.text());
      }
    } catch (error) {
      console.error('Failed to fetch billing summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEndOfDay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (actualCash === '') return;

    setSubmitting(true);
    try {
      await apiClient.post('/api/billing/closure', { actualCash: Number(actualCash), notes });
      alert('Cash Register Closure saved successfully!');
      setIsModalOpen(false);
      setActualCash('');
      setNotes('');
    } catch (error) {
      console.error('Failed to save closure:', error);
      alert('Failed to save closure.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadInvoice = async (id: string) => {
    try {
      const res = await apiClient.get(`/api/orders/${id}`);
      if (!res.ok) {
        alert('Failed to fetch order details');
        return;
      }
      const order = await res.json();
      
      const doc = new jsPDF();
      doc.setFontSize(20);
      doc.text('Tax Invoice', 105, 20, { align: 'center' });
      
      doc.setFontSize(10);
      doc.text(`Invoice ID: ${order.id}`, 14, 30);
      doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 14, 35);
      doc.text(`Customer Name: ${order.customerName}`, 14, 40);
      doc.text(`Phone: ${order.phone}`, 14, 45);
      doc.text(`Payment Mode: ${order.paymentMethod || 'COD'}`, 14, 50);

      const tableData = order.items.map((item: any) => [
        item.productName || item.productId,
        item.quantity,
        `Rs ${item.price.toFixed(2)}`,
        `Rs ${(item.quantity * item.price).toFixed(2)}`
      ]);

      autoTable(doc, {
        startY: 60,
        head: [['Item', 'Qty', 'Unit Price', 'Total']],
        body: tableData,
      });

      const finalY = (doc as any).lastAutoTable.finalY || 60;
      doc.setFontSize(12);
      doc.text(`Grand Total: Rs ${order.total.toFixed(2)}`, 14, finalY + 10);
      
      doc.save(`invoice_${id.substring(0,8)}.pdf`);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Failed to generate PDF');
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-6 flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  const { cashTotal = 0, digitalTotal = 0, totalInvoices = 0, invoices = [] } = summary || {};
  const expectedCash = cashTotal;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight flex items-center gap-2">
            <Receipt className="w-8 h-8 text-orange-500" /> Sales & Billing
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">Invoices, payment logs, and daily cashier records.</p>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> End of Day Closure
        </button>
      </div>

      {/* Small stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-neutral-950 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 bg-orange-50 dark:bg-orange-950/20 text-orange-600 rounded-xl flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Cash Register (Today)</p>
            <p className="text-lg font-extrabold text-neutral-900 dark:text-white mt-0.5">₹{cashTotal.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-950 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 bg-orange-50 dark:bg-orange-950/20 text-orange-600 rounded-xl flex items-center justify-center">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Digital Terminals (Today)</p>
            <p className="text-lg font-extrabold text-neutral-900 dark:text-white mt-0.5">₹{digitalTotal.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-950 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 bg-orange-50 dark:bg-orange-950/20 text-orange-600 rounded-xl flex items-center justify-center">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Daily Invoices</p>
            <p className="text-lg font-extrabold text-neutral-900 dark:text-white mt-0.5">{totalInvoices} Bills</p>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-neutral-100 dark:border-neutral-800">
          <h3 className="font-extrabold text-neutral-900 dark:text-white text-base">Recent Bills Generated</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 dark:bg-neutral-900/30 border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Invoice ID</th>
                <th className="px-6 py-3.5">Date</th>
                <th className="px-6 py-3.5">Order Type</th>
                <th className="px-6 py-3.5">Payment Mode</th>
                <th className="px-6 py-3.5">Amount</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-850">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-neutral-500">
                    No bills generated today.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/10 transition-colors">
                    <td className="px-6 py-4 font-bold text-neutral-900 dark:text-white">
                      {inv.id.substring(0, 8).toUpperCase()}
                    </td>
                    <td className="px-6 py-4 text-neutral-500">{inv.date}</td>
                    <td className="px-6 py-4 text-neutral-700 dark:text-neutral-300 font-medium">
                      <span className="bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded-md">{inv.type}</span>
                    </td>
                    <td className="px-6 py-4 text-neutral-700 dark:text-neutral-300 font-semibold">
                      {inv.method}
                    </td>
                    <td className="px-6 py-4 font-extrabold text-neutral-950 dark:text-white">₹{inv.amount.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleDownloadInvoice(inv.id)}
                        className="inline-flex items-center gap-1 text-orange-600 hover:text-orange-500 font-bold"
                      >
                        <Download className="w-3.5 h-3.5" /> PDF
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* End of Day Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 w-full max-w-md shadow-2xl relative border border-neutral-200 dark:border-neutral-800">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-extrabold text-neutral-900 dark:text-white mb-2">End of Day Cash Closure</h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">Count your physical cash drawer and reconcile with the system expected total.</p>
            
            <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-100 dark:border-orange-900/50 rounded-xl p-4 mb-6">
              <p className="text-xs text-orange-600/80 dark:text-orange-500 font-bold uppercase tracking-wider mb-1">System Expected Cash</p>
              <p className="text-3xl font-extrabold text-orange-600 dark:text-orange-500">₹{expectedCash.toLocaleString()}</p>
            </div>

            <form onSubmit={handleEndOfDay} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wide mb-1.5">
                  Actual Cash Counted
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-neutral-500 font-bold">₹</span>
                  <input 
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={actualCash}
                    onChange={(e) => setActualCash(e.target.value ? Number(e.target.value) : '')}
                    className="w-full pl-8 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all font-bold"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {actualCash !== '' && Number(actualCash) !== expectedCash && (
                <div className={`p-3 rounded-xl border ${Number(actualCash) > expectedCash ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                  <p className="text-sm font-bold flex justify-between">
                    Discrepancy:
                    <span>
                      {Number(actualCash) > expectedCash ? '+' : ''}{(Number(actualCash) - expectedCash).toLocaleString()}
                    </span>
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wide mb-1.5">
                  Notes / Explanation (Optional)
                </label>
                <textarea 
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  placeholder="E.g. Given ₹50 change to..."
                />
              </div>

              <div className="pt-2">
                <button 
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-900 font-extrabold rounded-xl transition-all disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Submit Closure'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
