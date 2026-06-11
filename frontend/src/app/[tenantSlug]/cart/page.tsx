'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { useCartStore } from '../../../store/useCartStore';
import { ArrowLeft, Minus, Plus, Trash2, ChevronRight, Tag } from 'lucide-react';
import { apiClient } from '../../../lib/apiClient';
import Link from 'next/link';

export default function CartPage() {
  const params = useParams();
  const tenantSlug = params?.tenantSlug as string;
  const { items, remarks, setRemarks, updateQuantity, removeItem, getTotalPrice, appliedCoupon, applyCoupon, removeCoupon } = useCartStore();
  const total = getTotalPrice();

  const [couponInput, setCouponInput] = React.useState('');
  const [couponLoading, setCouponLoading] = React.useState(false);
  const [couponError, setCouponError] = React.useState<string | null>(null);
  const [availableCoupons, setAvailableCoupons] = React.useState<any[]>([]);
  const [settings, setSettings] = React.useState<any>(null);

  React.useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await apiClient.get('/api/settings');
        if (res.ok) {
          setSettings(await res.json());
        }
      } catch (error) {
        console.error('Failed to fetch settings', error);
      }
    };
    fetchSettings();
  }, []);

  React.useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const res = await apiClient.get('/api/coupons/public');
        if (res.ok) {
          setAvailableCoupons(await res.json());
        }
      } catch (error) {
        console.error('Failed to fetch coupons', error);
      }
    };
    fetchCoupons();
  }, []);

  const handleApplyCoupon = async (codeToApply?: string) => {
    const code = typeof codeToApply === 'string' ? codeToApply : couponInput;
    if (!code) return;
    
    // Check if it's a first order coupon locally if it's in the list
    const foundCoupon = availableCoupons.find(c => c.code === code);
    if (foundCoupon?.firstOrderOnly) {
      setCouponError("Please proceed to checkout to apply First Order coupons (requires phone verification).");
      return;
    }
    
    setCouponLoading(true);
    setCouponError(null);
    try {
      const res = await apiClient.post('/api/coupons/validate', {
        couponCode: code,
        phone: '', // Phone is collected at checkout
        cartTotal: getTotalPrice()
      });
      const data = await res.json();
      
      if (!res.ok || !data.valid) {
        if (data.message?.includes('Phone')) {
          setCouponError("Please proceed to checkout to apply this coupon (requires phone verification).");
        } else {
          setCouponError(data.message || 'Invalid coupon.');
        }
      } else {
        applyCoupon({
          code: data.coupon.code,
          type: data.coupon.type,
          discountAmount: data.discountAmount,
          finalAmount: data.finalAmount
        });
        if (!codeToApply) setCouponInput('');
      }
    } catch (err) {
      setCouponError('Error validating coupon.');
    } finally {
      setCouponLoading(false);
    }
  };

  const subtotal = appliedCoupon ? appliedCoupon.finalAmount : total;
  const deliveryFee = settings?.hasDeliveryCharge ? (settings.deliveryChargeAmount || 0) : 0;
  const displayTotal = subtotal + deliveryFee;

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

        {/* Coupons & Offers */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 p-6">
          <h2 className="font-bold text-lg mb-4">Coupons & Offers</h2>
          
          {appliedCoupon ? (
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-4 rounded-xl flex items-center justify-between">
              <div>
                <p className="font-bold text-emerald-700 dark:text-emerald-400">'{appliedCoupon.code}' applied</p>
                <p className="text-sm text-emerald-600 dark:text-emerald-500">You saved ₹{appliedCoupon.discountAmount}</p>
              </div>
              <button onClick={removeCoupon} className="text-sm font-medium text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300">
                Remove
              </button>
            </div>
          ) : (
            <div>
              <div className="flex gap-2 mb-4">
                <input 
                  type="text" 
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  placeholder="Enter Coupon Code" 
                  className="flex-1 px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none uppercase"
                />
                <button 
                  onClick={() => handleApplyCoupon()}
                  disabled={!couponInput || couponLoading}
                  className="px-6 py-3 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 font-bold rounded-xl disabled:opacity-50"
                >
                  {couponLoading ? '...' : 'Apply'}
                </button>
              </div>
              {couponError && <p className="text-red-500 text-sm mb-4">{couponError}</p>}
              
              {availableCoupons.length > 0 && (
                <div className="space-y-3 mt-6 pt-6 border-t border-neutral-100 dark:border-neutral-800">
                  <h3 className="font-medium text-sm text-neutral-500 dark:text-neutral-400 mb-2">AVAILABLE OFFERS</h3>
                  {availableCoupons.map((coupon) => (
                    <div key={coupon.id} className="border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 hover:border-orange-200 dark:hover:border-orange-800 transition-colors">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                        <div className="flex gap-3 w-full">
                          <div className="bg-orange-100 dark:bg-orange-900/30 p-2 rounded-lg text-orange-600 dark:text-orange-500 h-10 w-10 flex items-center justify-center shrink-0">
                            <Tag className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-bold border-2 border-orange-200 dark:border-orange-900/50 bg-orange-50 dark:bg-orange-900/10 text-orange-700 dark:text-orange-400 px-2 py-0.5 rounded text-sm inline-block mb-1">
                              {coupon.code}
                            </div>
                            <p className="font-bold text-neutral-900 dark:text-neutral-100">
                              {coupon.discountType === 'PERCENTAGE' 
                                ? `${coupon.discountValue}% OFF` 
                                : `Flat ₹${coupon.discountValue} OFF`}
                            </p>
                            <p className="text-sm text-neutral-500 mt-1 line-clamp-2">
                              {coupon.minOrderValue ? `Valid on orders above ₹${coupon.minOrderValue}. ` : 'Valid on all orders. '}
                              {coupon.maxDiscount ? `Maximum discount of ₹${coupon.maxDiscount}. ` : ''}
                              {coupon.firstOrderOnly ? 'Applicable on your first order only.' : ''}
                            </p>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleApplyCoupon(coupon.code)}
                          disabled={couponLoading}
                          className="text-orange-600 dark:text-orange-500 font-bold text-sm bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/40 px-4 py-2.5 rounded-lg transition-colors shrink-0 w-full sm:w-auto mt-2 sm:mt-0"
                        >
                          APPLY
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 p-4 space-y-3">
          <h3 className="font-bold mb-4">Bill Details</h3>
          <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
            <span>Item Total</span>
            <span>₹{total}</span>
          </div>
          {appliedCoupon && (
            <div className="flex justify-between text-emerald-600 dark:text-emerald-500 font-medium">
              <span>Item Discount</span>
              <span>-₹{appliedCoupon.discountAmount}</span>
            </div>
          )}
          {settings?.hasDeliveryCharge && settings.deliveryChargeAmount > 0 ? (
            <div className="flex justify-between text-neutral-600 dark:text-neutral-400 pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <span>Delivery Fee</span>
              <span>₹{settings.deliveryChargeAmount}</span>
            </div>
          ) : (
            <div className="flex justify-between text-neutral-600 dark:text-neutral-400 pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <span>Delivery Fee</span>
              <span className="text-emerald-600 dark:text-emerald-500 font-medium">Free</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-lg pt-1">
            <span>To Pay</span>
            <span>₹{displayTotal}</span>
          </div>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 p-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <div className="text-sm text-neutral-500 font-medium">TOTAL</div>
            <div className="font-bold text-xl sm:text-2xl">₹{displayTotal}</div>
          </div>
          <Link href={`/${tenantSlug}/checkout`} className="bg-orange-600 hover:bg-orange-700 text-white font-bold text-base sm:text-lg px-6 py-3 sm:px-8 sm:py-4 rounded-xl shadow-lg shadow-orange-600/30 transition-colors flex items-center gap-1 sm:gap-2">
            Proceed to Pay <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
