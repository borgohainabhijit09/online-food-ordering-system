'use client';

import React from 'react';
import FeatureGate from '../../../components/FeatureGate';
import { Receipt, CreditCard, DollarSign, Download, ArrowUpRight } from 'lucide-react';

const mockInvoices = [
  { id: 'INV-1093', date: '2026-06-23', amount: 1540, type: 'Dine-In', method: 'UPI', status: 'PAID' },
  { id: 'INV-1092', date: '2026-06-23', amount: 890, type: 'Takeaway', method: 'Cash', status: 'PAID' },
  { id: 'INV-1091', date: '2026-06-23', amount: 2450, type: 'Delivery', method: 'Card', status: 'PAID' },
  { id: 'INV-1090', date: '2026-06-22', amount: 1200, type: 'Dine-In', method: 'UPI', status: 'PAID' }
];

export default function BillingPage() {
  return (
    <FeatureGate
      feature="BILLING"
      featureName="Sales & Billing"
      featureDescription="Manage customer bills, invoices, receipts, tax registers, and POS terminal configurations. Sync physical and digital transactions smoothly."
      requiredPlan="Growth"
    >
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-5">
          <div>
            <h1 className="text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight flex items-center gap-2">
              <Receipt className="w-8 h-8 text-orange-500" /> Sales & Billing
            </h1>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">Invoices, payment logs, and daily cashier records.</p>
          </div>
          
          <button className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors shadow-sm">
            Configure POS Gateway
          </button>
        </div>

        {/* Small stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-neutral-950 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 bg-orange-50 dark:bg-orange-950/20 text-orange-600 rounded-xl flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Cash Register</p>
              <p className="text-lg font-extrabold text-neutral-900 dark:text-white mt-0.5">₹24,580</p>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-950 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 bg-orange-50 dark:bg-orange-950/20 text-orange-600 rounded-xl flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Digital Terminals</p>
              <p className="text-lg font-extrabold text-neutral-900 dark:text-white mt-0.5">₹1,18,400</p>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-950 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 bg-orange-50 dark:bg-orange-950/20 text-orange-600 rounded-xl flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Daily Invoices</p>
              <p className="text-lg font-extrabold text-neutral-900 dark:text-white mt-0.5">38 Bills</p>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-3xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-neutral-100 dark:border-neutral-800">
            <h3 className="font-extrabold text-neutral-900 dark:text-white text-base">Recent Bills Generated</h3>
          </div>
          
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
              {mockInvoices.map((inv, idx) => (
                <tr key={idx} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/10 transition-colors">
                  <td className="px-6 py-4 font-bold text-neutral-900 dark:text-white">{inv.id}</td>
                  <td className="px-6 py-4 text-neutral-500">{inv.date}</td>
                  <td className="px-6 py-4 text-neutral-700 dark:text-neutral-300 font-medium">{inv.type}</td>
                  <td className="px-6 py-4 text-neutral-700 dark:text-neutral-300 font-semibold">{inv.method}</td>
                  <td className="px-6 py-4 font-extrabold text-neutral-950 dark:text-white">₹{inv.amount}</td>
                  <td className="px-6 py-4 text-right">
                    <button className="inline-flex items-center gap-1 text-orange-600 hover:text-orange-500 font-bold">
                      <Download className="w-3.5 h-3.5" /> PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </FeatureGate>
  );
}
