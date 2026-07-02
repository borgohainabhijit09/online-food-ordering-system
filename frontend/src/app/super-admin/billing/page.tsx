'use client';

import React, { useEffect, useState } from 'react';
import { Search, Receipt, CheckCircle2, Clock, XCircle, CreditCard } from 'lucide-react';

export default function SuperAdminBilling() {
  const [billingRecords, setBillingRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchBillingRecords();
  }, []);

  const fetchBillingRecords = async () => {
    try {
      const token = localStorage.getItem('superAdminToken') || localStorage.getItem('superAdminToken');
      const res = await fetch(`/api/super-admin/billing`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setBillingRecords(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = billingRecords.filter(b => 
    b.tenant?.businessName.toLowerCase().includes(search.toLowerCase()) || 
    b.tenant?.slug.toLowerCase().includes(search.toLowerCase()) ||
    b.id.toLowerCase().includes(search.toLowerCase())
  );

  const totalCollected = billingRecords.filter(b => b.status === 'COMPLETED').reduce((acc, curr) => acc + curr.amount, 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-bold uppercase"><CheckCircle2 className="w-3.5 h-3.5" /> Paid</span>;
      case 'PENDING': return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-600 text-xs font-bold uppercase"><Clock className="w-3.5 h-3.5" /> Pending</span>;
      case 'FAILED': return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-600 text-xs font-bold uppercase"><XCircle className="w-3.5 h-3.5" /> Failed</span>;
      default: return null;
    }
  };

  if (loading) {
    return <div className="p-8 flex justify-center"><div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-neutral-700 text-3xl font-bold mb-2">Automated Billing</h1>
          <p className="text-neutral-500">Track all automated invoices and payment statuses from tenants.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-wider">Total Revenue</h3>
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <p className="text-3xl font-black text-neutral-900">₹{Number(totalCollected || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-wider">Total Invoices</h3>
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Receipt className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="text-3xl font-black text-neutral-900">{billingRecords.length}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
        <div className="p-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50">
          <h2 className="font-bold text-neutral-700">Billing History</h2>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search invoices..."
              className="pl-9 pr-4 py-1.5 text-sm bg-white border border-neutral-200 rounded-lg outline-none focus:border-black transition-colors"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <table className="w-full text-left text-sm">
          <thead className="bg-white border-b border-neutral-100 text-neutral-400 text-xs uppercase tracking-wider">
            <tr>
              <th className="font-bold p-4">Invoice ID</th>
              <th className="font-bold p-4">Restaurant</th>
              <th className="font-bold p-4">Billing Period</th>
              <th className="font-bold p-4">Amount</th>
              <th className="font-bold p-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {filtered.map(b => {
              const startDate = new Date(b.date);
              const endDate = new Date(startDate);
              endDate.setMonth(endDate.getMonth() + 1);
              return (
              <tr key={b.id} className="hover:bg-neutral-50 transition-colors">
                <td className="p-4 text-neutral-500 font-mono text-xs">{b.id.substring(0, 13)}...</td>
                <td className="p-4">
                  <span className="font-bold text-neutral-800 block">{b.tenant?.businessName}</span>
                  <span className="text-xs text-neutral-400">{b.tenant?.slug}</span>
                </td>
                <td className="p-4 text-neutral-600">
                  <div className="text-sm font-medium">{startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}</div>
                  <div className="text-xs text-neutral-400">Generated: {startDate.toLocaleDateString()}</div>
                </td>
                <td className="p-4 font-bold text-neutral-800">
                  ₹{b.amount}
                </td>
                <td className="p-4">
                  {getStatusBadge(b.status)}
                </td>
              </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-neutral-500">
                  No billing records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

