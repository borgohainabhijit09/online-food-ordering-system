'use client';

import React, { useState, useEffect } from 'react';
import { Users, Gift, Loader2, Calendar, ShoppingBag, Phone, Search } from 'lucide-react';
import { apiClient } from '../../../lib/apiClient';

interface Customer {
  id: string;
  name: string;
  phone: string;
  dob: string | null;
  createdAt: string;
  totalOrders: number;
  lifetimeSpend: number;
  lastOrderDate: string | null;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/api/customers');
      if (res.ok) {
        setCustomers(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Calculate upcoming birthdays
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const thirtyDaysFromNow = new Date(today);
  thirtyDaysFromNow.setDate(today.getDate() + 30);

  const upcomingBirthdays = customers.filter(c => {
    if (!c.dob) return false;
    const dob = new Date(c.dob);
    const nextBirthday = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
    
    // If birthday already passed this year, look at next year
    if (nextBirthday < today) {
      nextBirthday.setFullYear(today.getFullYear() + 1);
    }

    return nextBirthday >= today && nextBirthday <= thirtyDaysFromNow;
  }).sort((a, b) => {
    const dobA = new Date(a.dob!);
    const dobB = new Date(b.dob!);
    const nextA = new Date(today.getFullYear(), dobA.getMonth(), dobA.getDate());
    const nextB = new Date(today.getFullYear(), dobB.getMonth(), dobB.getDate());
    if (nextA < today) nextA.setFullYear(today.getFullYear() + 1);
    if (nextB < today) nextB.setFullYear(today.getFullYear() + 1);
    return nextA.getTime() - nextB.getTime();
  });

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone.includes(searchTerm)
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-orange-500" /> Customers
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">Manage your customer database and track birthdays.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        </div>
      ) : (
        <>
          {/* Upcoming Birthdays Widget */}
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 border border-orange-200 dark:border-orange-900/50 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-orange-800 dark:text-orange-400 mb-4 flex items-center gap-2">
              <Gift className="w-5 h-5" /> Upcoming Birthdays (Next 30 Days)
            </h2>
            {upcomingBirthdays.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingBirthdays.map(c => {
                  const dob = new Date(c.dob!);
                  return (
                    <div key={c.id} className="bg-white dark:bg-neutral-900 border border-orange-100 dark:border-orange-900/30 p-4 rounded-xl shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-bold text-neutral-900 dark:text-white">{c.name}</div>
                        <div className="bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-400 text-xs font-bold px-2 py-1 rounded">
                          {dob.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                      <div className="text-sm text-neutral-600 dark:text-neutral-400 flex items-center gap-1.5 mb-1">
                        <Phone className="w-3.5 h-3.5" /> {c.phone}
                      </div>
                      <div className="mt-3">
                        <a 
                          href={`https://wa.me/91${c.phone}?text=Hi ${c.name}! Your birthday is coming up! Celebrate with us and use code BDAY20 for 20% off your entire order! 🎂`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-bold text-white bg-green-500 hover:bg-green-600 px-3 py-1.5 rounded-lg inline-flex items-center gap-1 transition-colors"
                        >
                          Send WhatsApp Offer
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-orange-700/70 dark:text-orange-500/70">No upcoming birthdays in the next 30 days.</p>
            )}
          </div>

          {/* Customer Table */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden">
            <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
              <h2 className="font-bold">All Customers ({customers.length})</h2>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input 
                  type="text" 
                  placeholder="Search by name or phone..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 w-64"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-neutral-50 dark:bg-neutral-950/50 text-neutral-500 dark:text-neutral-400 font-medium">
                  <tr>
                    <th className="px-4 py-2.5">Customer</th>
                    <th className="px-4 py-2.5">Phone</th>
                    <th className="px-4 py-2.5">Birthday</th>
                    <th className="px-4 py-2.5">Total Orders</th>
                    <th className="px-4 py-2.5">Lifetime Spend</th>
                    <th className="px-4 py-2.5">Last Order</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                  {filteredCustomers.length > 0 ? (
                    filteredCustomers.map((customer) => (
                      <tr key={customer.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                        <td className="px-4 py-2.5 font-medium text-neutral-900 dark:text-white">
                          {customer.name}
                        </td>
                        <td className="px-4 py-2.5 text-neutral-600 dark:text-neutral-400">
                          {customer.phone}
                        </td>
                        <td className="px-4 py-2.5 text-neutral-600 dark:text-neutral-400">
                          {customer.dob ? new Date(customer.dob).toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) : '-'}
                        </td>
                        <td className="px-4 py-2.5 text-neutral-600 dark:text-neutral-400">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800 rounded-full font-medium text-xs">
                            <ShoppingBag className="w-3.5 h-3.5 text-neutral-500" />
                            {customer.totalOrders}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-neutral-900 dark:text-white font-medium">
                          ₹{customer.lifetimeSpend.toLocaleString()}
                        </td>
                        <td className="px-4 py-2.5 text-neutral-600 dark:text-neutral-400 text-xs">
                          {customer.lastOrderDate ? new Date(customer.lastOrderDate).toLocaleDateString() : '-'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-neutral-500">
                        No customers found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
