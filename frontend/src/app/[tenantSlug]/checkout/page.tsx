'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useCartStore } from '../../../store/useCartStore';
import { apiClient } from '../../../lib/apiClient';
import { useLocation } from '../../../hooks/useLocation';
import { ArrowLeft, MapPin, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';


// Dummy fallback coordinates
const FALLBACK_LAT = 17.385044;
const FALLBACK_LNG = 78.486671;
const FALLBACK_RADIUS_KM = 5;
const RESTAURANT_WHATSAPP = '919876543210'; // Replace with real number

export default function CheckoutPage() {
  const router = useRouter();
  const params = useParams();
  const tenantSlug = params?.tenantSlug as string;
  const { items, remarks, getTotalPrice, clearCart, appliedCoupon, applyCoupon, removeCoupon, orderType, tableId, tableNumber } = useCartStore();
  const { location, error: locError, loading: locLoading, requestLocation, calculateDistance } = useLocation();
  
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    dob: '',
    address: '',
    landmark: '',
    notes: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const [distanceError, setDistanceError] = useState<string | null>(null);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [settings, setSettings] = useState<any>(null);
  const [isFetchingCustomer, setIsFetchingCustomer] = useState(false);
  
  const [tables, setTables] = useState<any[]>([]);
  const [selectedTableId, setSelectedTableId] = useState<string>(tableId || '');

  useEffect(() => {
    if (orderType === 'DINE_IN') {
      apiClient.get('/api/tables')
        .then(res => res.json())
        .then(data => {
          setTables(data);
          if (tableNumber) {
            const matched = data.find((t: any) => String(t.tableNumber) === String(tableNumber));
            if (matched) {
              setSelectedTableId(matched.id);
            }
          }
        })
        .catch(console.error);
    }
  }, [orderType, tableNumber, tableId]);

  const handlePhoneBlur = async () => {
    if (formData.phone.length >= 10) {
      setIsFetchingCustomer(true);
      try {
        const res = await apiClient.get(`/api/customers/public/${formData.phone}`);
        if (res.ok) {
          const data = await res.json();
          setFormData(prev => ({
            ...prev,
            name: prev.name || data.name || '',
            dob: prev.dob || (data.dob ? new Date(data.dob).toISOString().split('T')[0] : ''),
            address: prev.address || data.address || ''
          }));
        }
      } catch (err) {
        // Silently fail if customer not found
      } finally {
        setIsFetchingCustomer(false);
      }
    }
  };

  // Coupon State
  useEffect(() => {
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

  const handlePlaceOrder = async () => {
    if (orderType === 'DELIVERY' && (!formData.address || formData.address.length < 5)) {
      alert("Please provide a complete delivery address.");
      return;
    }
    if (orderType === 'DINE_IN' && !selectedTableId) {
      alert("Please select your table number.");
      return;
    }

    if (orderType === 'DELIVERY') {
      if (!location) {
        alert('Please provide your location to verify delivery availability.');
        return;
      }
      
      if (distanceError) {
        alert(distanceError);
        return;
      }
    }

    setIsPlacingOrder(true);
    try {
      const subtotal = appliedCoupon ? appliedCoupon.finalAmount : getTotalPrice();
      const deliveryFee = (settings?.hasDeliveryCharge && orderType === 'DELIVERY') ? (settings.deliveryChargeAmount || 0) : 0;
      const total = subtotal + deliveryFee;
      
      const orderPayload = {
        customerName: formData.name,
        phone: formData.phone,
        dob: formData.dob ? new Date(formData.dob).toISOString() : undefined,
        address: orderType === 'DELIVERY' ? formData.address + (formData.landmark ? `, ${formData.landmark}` : '') : '',
        latitude: orderType === 'DELIVERY' && location ? location.lat : undefined,
        longitude: orderType === 'DELIVERY' && location ? location.lng : undefined,
        orderType: orderType || 'DELIVERY',
        tableId: orderType === 'DINE_IN' ? selectedTableId : undefined,
        total: total,
        items: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.variant ? item.variant.price : item.price,
          variant: item.variant?.name,
          addons: item.addons.map(addon => ({
            addonName: addon.name,
            price: addon.price
          }))
        })),
        remarks: remarks || formData.notes,
        couponCode: appliedCoupon?.code
      };

      const response = await apiClient.post('/api/orders', orderPayload);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to place order');
      }

      const createdOrder = data;
      localStorage.setItem('activeOrderId', createdOrder.id);
      
      let message = `*NEW ${orderType === 'DINE_IN' ? 'DINE-IN ' : orderType === 'TAKEAWAY' ? 'TAKEAWAY ' : 'DELIVERY '}ORDER*\n\n`;
      
      if (orderType === 'DINE_IN') {
        message += `*Table:* ${tableNumber}\n`;
      }
      
      message += `*Customer Details*\n`;
      message += `Name: ${formData.name}\n`;
      message += `Phone: ${formData.phone}\n`;
      
      if (orderType === 'DELIVERY') {
        message += `Address: ${formData.address}, ${formData.landmark}\n`;
        message += `Location: https://maps.google.com/?q=${location?.lat},${location?.lng}\n`;
      }
      
      if (formData.notes) {
        message += `Notes: ${formData.notes}\n`;
      }
      if (remarks) {
        message += `*Order Remarks:* ${remarks}\n`;
      }
      message += `\n*Order Items*\n`;
      items.forEach(item => {
        message += `- ${item.quantity}x ${item.name}`;
        if (item.variant) message += ` (${item.variant.name})`;
        if (item.addons.length > 0) message += ` + ${item.addons.map(a => a.name).join(', ')}`;
        message += `\n`;
      });
      
      message += `\n*Total:* ₹${total}`;

      const targetNumber = settings?.whatsappNumber || RESTAURANT_WHATSAPP;
      const whatsappUrl = `https://wa.me/${targetNumber}?text=${encodeURIComponent(message)}`;
      
      clearCart();
      window.open(whatsappUrl, '_blank');
      router.push(`/${tenantSlug}/track/${createdOrder.id}`);
    } catch (error: any) {
      console.error("Failed to place order", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const subtotal = appliedCoupon ? appliedCoupon.finalAmount : getTotalPrice();
  const deliveryFee = (settings?.hasDeliveryCharge && orderType === 'DELIVERY') ? (settings.deliveryChargeAmount || 0) : 0;
  const displayTotal = subtotal + deliveryFee;

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 pb-32">
      <header className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center gap-4">
          <Link href={`/${tenantSlug}/cart`} className="p-2 -ml-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-xl font-bold">Checkout</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-6 space-y-6">
        {/* Location Section - Only for Delivery */}
        {orderType === 'DELIVERY' && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 p-6">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-orange-600" /> Delivery Location
            </h2>
            
            {!location ? (
              <button 
                onClick={requestLocation}
                disabled={locLoading}
                className="w-full flex items-center justify-center gap-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 py-3 rounded-xl font-medium transition-colors"
              >
                {locLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <MapPin className="w-5 h-5" />}
                Get Current Location
              </button>
            ) : (
              <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 p-4 rounded-xl flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-800 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-medium text-sm">Location captured successfully</p>
                  <p className="text-xs opacity-80">{location.lat.toFixed(4)}, {location.lng.toFixed(4)}</p>
                </div>
              </div>
            )}

            {locError && (
              <div className="mt-3 text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" /> {locError}
              </div>
            )}

            {distanceError && (
              <div className="mt-4 bg-red-50 dark:bg-red-900/20 text-red-600 p-4 rounded-xl flex gap-3 text-sm font-medium">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                {distanceError}
              </div>
            )}
          </div>
        )}

        {/* Details Form */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 p-6">
          <h2 className="font-bold text-lg mb-4">Personal Details</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1 flex justify-between">
                Phone Number
                {isFetchingCustomer && <span className="text-xs text-orange-500 animate-pulse">Looking up details...</span>}
              </label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange} onBlur={handlePhoneBlur} className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all" placeholder="9876543210" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Full Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all" placeholder="John Doe" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Date of Birth (For Birthday Surprises! 🎉)</label>
              <input type="date" name="dob" value={formData.dob} onChange={handleChange} className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all text-neutral-500 dark:text-neutral-400" />
            </div>
            {orderType === 'DELIVERY' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Delivery Address</label>
                  <textarea name="address" value={formData.address} onChange={handleChange} className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all resize-none h-24" placeholder="Flat No, Building, Street"></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Landmark (Optional)</label>
                  <input type="text" name="landmark" value={formData.landmark} onChange={handleChange} className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all" placeholder="Near Apollo Hospital" />
                </div>
              </>
            )}
            {orderType === 'DINE_IN' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Table Number <span className="text-red-500">*</span></label>
                  <select 
                    value={selectedTableId} 
                    onChange={(e) => setSelectedTableId(e.target.value)}
                    className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                  >
                    <option value="" disabled>Select your table</option>
                    {tables.map(t => (
                      <option key={t.id} value={t.id}>{t.tableName ? `${t.tableName} (Table ${t.tableNumber})` : `Table ${t.tableNumber}`}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Special Instructions (Optional)</label>
                  <input type="text" name="notes" value={formData.notes} onChange={handleChange} className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all" placeholder="Any allergy or preparation requests?" />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Bill Details */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 p-6 space-y-3">
          <h3 className="font-bold mb-4">Bill Details</h3>
          <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
            <span>Item Total</span>
            <span>₹{getTotalPrice()}</span>
          </div>
          {appliedCoupon && (
            <div className="flex justify-between text-emerald-600 dark:text-emerald-500 font-medium">
              <span>Item Discount</span>
              <span>-₹{appliedCoupon.discountAmount}</span>
            </div>
          )}
          {orderType === 'DELIVERY' && (
            settings?.hasDeliveryCharge && settings.deliveryChargeAmount > 0 ? (
              <div className="flex justify-between text-neutral-600 dark:text-neutral-400 pb-3 border-b border-neutral-100 dark:border-neutral-800">
                <span>Delivery Fee</span>
                <span>₹{settings.deliveryChargeAmount}</span>
              </div>
            ) : (
              <div className="flex justify-between text-neutral-600 dark:text-neutral-400 pb-3 border-b border-neutral-100 dark:border-neutral-800">
                <span>Delivery Fee</span>
                <span className="text-emerald-600 dark:text-emerald-500 font-medium">Free</span>
              </div>
            )
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
            <div className="font-bold text-2xl">₹{displayTotal}</div>
          </div>
          <button 
            onClick={handlePlaceOrder}
            disabled={isPlacingOrder || !formData.name || !formData.phone || (orderType === 'DELIVERY' && (!location || !!distanceError || !formData.address))}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-neutral-300 disabled:dark:bg-neutral-800 disabled:text-neutral-500 text-white font-bold text-lg py-4 rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2"
          >
            {isPlacingOrder ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
            ) : (
              'Place Order & Track'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
