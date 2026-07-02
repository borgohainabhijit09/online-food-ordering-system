'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Receipt, CheckCircle2, Clock, AlertCircle, CreditCard } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function AdminBilling() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState<string | null>(null);
  const { tenantId } = useAuth();

  useEffect(() => {
    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const fetchInvoices = async () => {
    try {
      const token = localStorage.getItem('adminToken') || sessionStorage.getItem('impersonatedToken');
      const res = await fetch(\\/api/subscription/invoices\, {
        headers: {
          'Authorization': \Bearer \\
        }
      });
      if (res.ok) {
        const data = await res.json();
        setInvoices(data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handlePay = async (invoice: any) => {
    setPayingId(invoice.id);
    try {
      const token = localStorage.getItem('adminToken') || sessionStorage.getItem('impersonatedToken');
      // 1. Generate Razorpay order for this invoice
      const resOrder = await fetch(\\/api/subscription/invoices/\/pay\, {
        method: 'POST',
        headers: {
          'Authorization': \Bearer \\,
          'Content-Type': 'application/json'
        }
      });

      if (!resOrder.ok) {
        toast.error('Failed to initiate payment.');
        setPayingId(null);
        return;
      }

      const orderData = await resOrder.json();

      // 2. Open Razorpay Checkout
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'RestoBuddy',
        description: \Payment for Invoice #\\,
        order_id: orderData.orderId,
        handler: async function (response: any) {
          try {
            // 3. Verify Payment
            const resVerify = await fetch(\\/api/subscription/verify-payment\, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': \Bearer \\
              },
              body: JSON.stringify({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature
              })
            });

            if (resVerify.ok) {
              toast.success('Payment successful! Your subscription is now active.');
              await fetchInvoices();
            } else {
              toast.error('Payment verification failed. Please contact support.');
            }
          } catch (e) {
            console.error(e);
            toast.error('Payment verification error.');
          } finally {
            setPayingId(null);
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        toast.error(\Payment failed: \\);
        setPayingId(null);
      });
      rzp.open();

    } catch (err) {
      console.error(err);
      toast.error('Network error during payment.');
      setPayingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200"><CheckCircle2 className="w-3.5 h-3.5" /> PAID</span>;
      case 'PENDING':
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200"><Clock className="w-3.5 h-3.5" /> PENDING</span>;
      case 'FAILED':
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-red-50 text-red-700 text-xs font-bold border border-red-200"><AlertCircle className="w-3.5 h-3.5" /> FAILED</span>;
      default:
        return <span className="inline-flex items-center px-2 py-1 rounded-md bg-neutral-100 text-neutral-600 text-xs font-bold">{status}</span>;
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight">Subscription Billing</h1>
          <p className="text-neutral-500 mt-1">Manage your platform subscription payments and invoices.</p>
        </div>
        <div className="p-3 bg-blue-50 text-blue-700 rounded-xl border border-blue-100 flex items-center gap-3">
          <div className="bg-white p-2 rounded-lg shadow-sm">
            <Receipt className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-blue-500">Current Status</div>
            <div className="font-semibold text-sm">Review your billing history below</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-neutral-400">Loading invoices...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 uppercase tracking-wider">
                <tr>
                  <th className="font-semibold px-6 py-4">Invoice ID</th>
                  <th className="font-semibold px-6 py-4">Billing Period</th>
                  <th className="font-semibold px-6 py-4">Plan</th>
                  <th className="font-semibold px-6 py-4">Amount</th>
                  <th className="font-semibold px-6 py-4">Status</th>
                  <th className="font-semibold px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {invoices.map(inv => {
                  const startDate = new Date(inv.date);
                  const endDate = new Date(startDate);
                  endDate.setMonth(endDate.getMonth() + 1);
                  return (
                    <tr key={inv.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-neutral-500">
                        {inv.id.substring(0, 13)}...
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-neutral-800">{startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}</div>
                        <div className="text-xs text-neutral-400">Generated: {startDate.toLocaleDateString()}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-neutral-100 text-neutral-700">
                          {inv.plan?.name || 'Custom Plan'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-neutral-900 text-lg">
                        ?{inv.amount}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(inv.status)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {inv.status === 'PENDING' && (
                          <button
                            onClick={() => handlePay(inv)}
                            disabled={payingId === inv.id}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold rounded-xl transition-all shadow-sm hover:shadow-md disabled:opacity-50"
                          >
                            <CreditCard className="w-4 h-4" />
                            {payingId === inv.id ? 'Processing...' : 'Pay Now'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {invoices.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-neutral-500">
                      <Receipt className="w-12 h-12 text-neutral-200 mx-auto mb-3" />
                      <p>No invoices found for your account.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
