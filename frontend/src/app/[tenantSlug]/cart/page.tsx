'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { useCartStore } from '../../../store/useCartStore';
import { ArrowLeft, Minus, Plus, Trash2, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function CartPage() {
  const params = useParams();
  const tenantSlug = params?.tenantSlug as string;
  const { items, remarks, setRemarks, updateQuantity, removeItem, getTotalPrice } = useCartStore();
  const total = getTotalPrice();

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="w-32 h-32 mb-6 opacity-20">
          {/* placeholder for empty cart image */}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
        </div>
        <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
        <p className="text-neutral-500 mb-8 text-center">Looks like you haven't added anything to your cart yet.</p>
        <Link href={`/${tenantSlug}`} className="bg-orange-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-orange-700 transition-colors">
          Browse Menu
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 pb-32">
      <header className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center gap-4">
          <Link href={`/${tenantSlug}`} className="p-2 -ml-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-xl font-bold">Your Cart</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-6 space-y-6">
        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 p-4 divide-y divide-neutral-100 dark:divide-neutral-800">
          {items.map((item) => (
            <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex gap-4">
              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-bold text-lg leading-tight">{item.name}</h3>
                  <button onClick={() => removeItem(item.id)} className="text-neutral-400 hover:text-red-500 transition-colors">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
                
                {item.variant && (
                  <p className="text-sm text-neutral-500">{item.variant.name}</p>
                )}
                
                {item.addons.length > 0 && (
                  <p className="text-sm text-neutral-500">
                    Add-ons: {item.addons.map(a => a.name).join(', ')}
                  </p>
                )}
                
                <div className="mt-3 flex items-center justify-between">
                  <div className="font-bold text-lg">
                    ₹{(item.variant ? item.variant.price : item.price) + item.addons.reduce((sum, a) => sum + a.price, 0)}
                  </div>
                  
                  <div className="flex items-center gap-3 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg border border-neutral-200 dark:border-neutral-700">
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-8 h-8 flex items-center justify-center rounded bg-white dark:bg-neutral-700 shadow-sm"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="font-bold w-4 text-center">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-8 h-8 flex items-center justify-center rounded bg-white dark:bg-neutral-700 shadow-sm"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 p-4">
          <h3 className="font-bold mb-2">Order Remarks</h3>
          <textarea 
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Add any special instructions (e.g., make it spicy, allergy to peanuts...)"
            className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl p-3 resize-none h-24 text-sm focus:ring-2 focus:ring-orange-500 outline-none transition-all"
          ></textarea>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 p-4 space-y-3">
          <h3 className="font-bold mb-4">Bill Details</h3>
          <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
            <span>Item Total</span>
            <span>₹{total}</span>
          </div>
          <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
            <span>Delivery Fee</span>
            <span>₹40</span>
          </div>
          <div className="flex justify-between text-neutral-600 dark:text-neutral-400 pb-3 border-b border-neutral-100 dark:border-neutral-800">
            <span>Taxes</span>
            <span>₹{(total * 0.05).toFixed(0)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg pt-1">
            <span>To Pay</span>
            <span>₹{total + 40 + Math.round(total * 0.05)}</span>
          </div>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 p-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <div className="text-sm text-neutral-500 font-medium">TOTAL</div>
            <div className="font-bold text-2xl">₹{total + 40 + Math.round(total * 0.05)}</div>
          </div>
          <Link href={`/${tenantSlug}/checkout`} className="bg-orange-600 hover:bg-orange-700 text-white font-bold text-lg px-8 py-4 rounded-xl shadow-lg shadow-orange-600/30 transition-colors flex items-center gap-2">
            Proceed to Pay <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
