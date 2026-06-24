'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useCartStore } from '../../../store/useCartStore';
import { apiClient } from '../../../lib/apiClient';
import { useLocation } from '../../../hooks/useLocation';
import { ArrowLeft, MapPin, Loader2, AlertCircle, CreditCard, Banknote, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

const FALLBACK_LAT = 17.385044;
const FALLBACK_LNG = 78.486671;
const FALLBACK_RADIUS_KM = 5;
const RESTAURANT_WHATSAPP = '919876543210';

type PaymentMethod = 'COD' | 'ONLINE';

declare global {
  interface Window {
    Razorpay: any;
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (document.getElementById('razorpay-script')) { resolve(true); return; }
    const script = document.createElement('script');
    script.id = 'razorpay-script';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function CheckoutPage() {
  const router = useRouter();
  const params = useParams();
  const tenantSlug = params?.tenantSlug as string;
  const { items, remarks, getTotalPrice, clearCart, appliedCoupon, orderType, tableId, tableNumber } = useCartStore();
  const { location, error: locError, loading: locLoading, requestLocation } = useLocation();

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const [formData, setFormData] = useState({ name: '', phone: '', dob: '', address: '', landmark: '', notes: '' });
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const [isExistingDob, setIsExistingDob] = useState(false);
  const [distanceError, setDistanceError] = useState<string | null>(null);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [settings, setSettings] = useState<any>(null);
  const [isFetchingCustomer, setIsFetchingCustomer] = useState(false);
  const [tables, setTables] = useState<any[]>([]);
  const [selectedTableId, setSelectedTableId] = useState<string>(tableId || '');

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('COD');
  const [onlinePaymentsAvailable, setOnlinePaymentsAvailable] = useState(false);
  const [paymentCheckDone, setPaymentCheckDone] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  useEffect(() => {
    if (orderType === 'DINE_IN') {
      apiClient.get('/api/tables').then(res => res.json()).then(data => {
        setTables(data);
        if (tableNumber) {
          const matched = data.find((t: any) => String(t.tableNumber) === String(tableNumber));
          if (matched) setSelectedTableId(matched.id);
        }
      }).catch(console.error);
    }
  }, [orderType, tableNumber, tableId]);

  const handlePhoneBlur = async () => {
    if (formData.phone.length >= 10) {
      setIsFetchingCustomer(true);
      try {
        const res = await apiClient.get(`/api/customers/public/${formData.phone}`);
        if (res.ok) {
          const data = await res.json();
          setFormData(prev => ({ ...prev, name: prev.name || data.name || '', dob: data.dob ? new Date(data.dob).toISOString().split('T')[0] : prev.dob, address: prev.address || data.address || '' }));
          setIsExistingDob(!!data.dob);
        } else { setIsExistingDob(false); }
      } catch { setIsExistingDob(false); }
      finally { setIsFetchingCustomer(false); }
    } else { setIsExistingDob(false); }
  };

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await apiClient.get('/api/settings');
        if (res.ok) setSettings(await res.json());
      } catch (error) { console.error('Failed to fetch settings', error); }
    };
    const checkPaymentStatus = async () => {
      try {
        const res = await apiClient.get('/api/payments/status');
        if (res.ok) {
          const data = await res.json();
          setOnlinePaymentsAvailable(data.enabled);
        }
      } catch { /* silently fail — COD only */ }
      finally { setPaymentCheckDone(true); }
    };
    fetchSettings();
    checkPaymentStatus();
  }, []);

  const subtotal = appliedCoupon ? appliedCoupon.finalAmount : getTotalPrice();
  const deliveryFee = (settings?.hasDeliveryCharge && orderType === 'DELIVERY') ? (settings.deliveryChargeAmount || 0) : 0;
  const displayTotal = subtotal + deliveryFee;
  const minDeliveryValue = settings?.minOrderValueForDelivery || 0;
  const isBelowMinDelivery = orderType === 'DELIVERY' && minDeliveryValue > 0 && subtotal < minDeliveryValue;

  const buildOrderPayload = (extraFields?: object) => ({
    customerName: formData.name,
    phone: formData.phone,
    dob: formData.dob ? new Date(formData.dob).toISOString() : undefined,
    address: orderType === 'DELIVERY' ? formData.address + (formData.landmark ? `, ${formData.landmark}` : '') : '',
    latitude: orderType === 'DELIVERY' && location ? location.lat : undefined,
    longitude: orderType === 'DELIVERY' && location ? location.lng : undefined,
    orderType: orderType || 'DELIVERY',
    tableId: orderType === 'DINE_IN' ? selectedTableId : undefined,
    total: displayTotal,
    items: items.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
      price: item.variant ? item.variant.price : item.price,
      variant: item.variant?.name,
      addons: item.addons.map(addon => ({ addonName: addon.name, price: addon.price }))
    })),
    remarks: remarks || formData.notes,
    couponCode: appliedCoupon?.code,
    ...extraFields
  });

  const sendWhatsAppNotification = (createdOrder: any) => {
    let message = `*NEW ${orderType === 'DINE_IN' ? 'DINE-IN ' : orderType === 'TAKEAWAY' ? 'TAKEAWAY ' : 'DELIVERY '}ORDER*\n\n`;
    if (orderType === 'DINE_IN') message += `*Table:* ${tableNumber}\n`;
    message += `*Customer Details*\nName: ${formData.name}\nPhone: ${formData.phone}\n`;
    if (orderType === 'DELIVERY') message += `Address: ${formData.address}, ${formData.landmark}\nLocation: https://maps.google.com/?q=${location?.lat},${location?.lng}\n`;
    if (formData.notes) message += `Notes: ${formData.notes}\n`;
    if (remarks) message += `*Order Remarks:* ${remarks}\n`;
    message += `\n*Order Items*\n`;
    items.forEach(item => {
      message += `- ${item.quantity}x ${item.name}`;
      if (item.variant) message += ` (${item.variant.name})`;
      if (item.addons.length > 0) message += ` + ${item.addons.map((a: any) => a.name).join(', ')}`;
      message += `\n`;
    });
    message += `\n*Total:* ₹${displayTotal}`;
    message += `\n*Payment:* ${paymentMethod === 'ONLINE' ? '✅ PAID ONLINE' : 'Cash on Delivery'}`;
    const targetNumber = settings?.whatsappNumber || RESTAURANT_WHATSAPP;
    setTimeout(() => { window.location.href = `https://wa.me/${targetNumber}?text=${encodeURIComponent(message)}`; }, 500);
  };

  const handleCODOrder = async () => {
    setIsPlacingOrder(true);
    try {
      const response = await apiClient.post('/api/orders', buildOrderPayload({ paymentMethod: 'COD', paymentStatus: 'PENDING' }));
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to place order');
      localStorage.setItem('activeOrderId', data.id);
      clearCart();
      router.push(`/${tenantSlug}/track/${data.id}`);
      sendWhatsAppNotification(data);
    } catch (error: any) {
      console.error('Failed to place order', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handleOnlinePayment = async () => {
    setIsPlacingOrder(true);
    setCheckoutError(null);
    try {
      // Step 1: Load Razorpay SDK
      console.log('[Payment] Loading Razorpay SDK...');
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        setCheckoutError('Failed to load Razorpay. Please check your internet connection.');
        setIsPlacingOrder(false);
        return;
      }
      console.log('[Payment] SDK loaded ✅');

      // Step 2: Create Razorpay order on backend
      console.log('[Payment] Creating Razorpay order for amount:', displayTotal);
      const orderRes = await apiClient.post('/api/payments/create-order', { amount: displayTotal });
      const orderData = await orderRes.json();
      console.log('[Payment] Create order response:', orderRes.status, orderData);
      if (!orderRes.ok) {
        setCheckoutError(orderData.message || 'Failed to create payment order. Please try again.');
        setIsPlacingOrder(false);
        return;
      }

      const { razorpayOrderId, amount, currency, keyId } = orderData;
      console.log('[Payment] Razorpay order created:', razorpayOrderId);

      // Step 3: Create RestoBuddy order first (pending payment)
      console.log('[Payment] Creating RestoBuddy order...');
      const restoRes = await apiClient.post('/api/orders', buildOrderPayload({
        paymentMethod: 'ONLINE',
        paymentStatus: 'PENDING',
        razorpayOrderId
      }));
      const restoOrder = await restoRes.json();
      console.log('[Payment] RestoBuddy order response:', restoRes.status, restoOrder);
      if (!restoRes.ok) {
        setCheckoutError(restoOrder.message || 'Failed to create order. Please try again.');
        setIsPlacingOrder(false);
        return;
      }

      // Step 4: Open Razorpay checkout modal
      console.log('[Payment] Opening Razorpay modal...');
      const options = {
        key: keyId,
        amount,
        currency,
        name: settings?.restaurantName || 'Restaurant',
        description: `Order #${restoOrder.id?.slice(-6)}`,
        image: settings?.logoUrl || undefined,
        order_id: razorpayOrderId,
        handler: async (response: any) => {
          try {
            console.log('[Payment] Payment success, verifying...');
            // Step 5: Verify payment signature on backend
            const verifyRes = await apiClient.post('/api/payments/verify', {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              restoOrderId: restoOrder.id
            });
            const verifyData = await verifyRes.json();
            console.log('[Payment] Verify response:', verifyRes.status, verifyData);

            if (!verifyRes.ok) {
              setCheckoutError('Payment verification failed. Please contact the restaurant.');
              setIsPlacingOrder(false);
              return;
            }

            // Step 6: Success — redirect
            console.log('[Payment] ✅ Payment verified! Redirecting...');
            localStorage.setItem('activeOrderId', restoOrder.id);
            clearCart();
            router.push(`/${tenantSlug}/track/${restoOrder.id}`);
            sendWhatsAppNotification(restoOrder);
          } catch (err) {
            console.error('[Payment] Verification error:', err);
            setCheckoutError('Payment verification error. Please contact the restaurant.');
            setIsPlacingOrder(false);
          }
        },
        prefill: {
          name: formData.name,
          contact: formData.phone,
        },
        theme: { color: '#ea580c' },
        modal: {
          ondismiss: () => {
            console.log('[Payment] Modal dismissed by user');
            setIsPlacingOrder(false);
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', (response: any) => {
        console.error('[Payment] Payment failed:', response.error);
        setCheckoutError(`Payment failed: ${response.error.description}`);
        setIsPlacingOrder(false);
      });
      razorpay.open();
    } catch (error: any) {
      console.error('[Payment] Unexpected error:', error);
      setCheckoutError(error.message || 'Something went wrong. Please try again.');
      setIsPlacingOrder(false);
    }
  };

  const handlePlaceOrder = async () => {
    setCheckoutError(null);
    if (!formData.name || !formData.phone) {
      setCheckoutError('Please fill in your name and phone number.');
      return;
    }
    if (orderType === 'DELIVERY' && (!formData.address || formData.address.length < 5)) {
      setCheckoutError('Please provide a complete delivery address.');
      return;
    }
    if (orderType === 'DINE_IN' && !selectedTableId) {
      setCheckoutError('Please select your table number.');
      return;
    }
    if (orderType === 'DELIVERY' && !location) {
      setCheckoutError('Please capture your location first.');
      return;
    }
    if (orderType === 'DELIVERY' && distanceError) {
      setCheckoutError(distanceError);
      return;
    }

    if (paymentMethod === 'ONLINE') {
      await handleOnlinePayment();
    } else {
      await handleCODOrder();
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 pb-36">
      <header className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center gap-4">
          <Link href={`/${tenantSlug}/cart`} className="p-2 -ml-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-xl font-bold">Checkout</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-6 space-y-6">

        {/* Location — Delivery only */}
        {orderType === 'DELIVERY' && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 p-6">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-orange-600" /> Delivery Location
            </h2>
            {!location ? (
              <button onClick={requestLocation} disabled={locLoading} className="w-full flex items-center justify-center gap-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 py-3 rounded-xl font-medium transition-colors">
                {locLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <MapPin className="w-5 h-5" />}
                Get Current Location
              </button>
            ) : (
              <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 p-4 rounded-xl flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-800 flex items-center justify-center flex-shrink-0"><MapPin className="w-4 h-4" /></div>
                <div>
                  <p className="font-medium text-sm">Location captured successfully</p>
                  <p className="text-xs opacity-80">{location.lat.toFixed(4)}, {location.lng.toFixed(4)}</p>
                </div>
              </div>
            )}
            {locError && <div className="mt-3 text-sm text-red-500 flex items-center gap-1"><AlertCircle className="w-4 h-4" /> {locError}</div>}
            {distanceError && <div className="mt-4 bg-red-50 dark:bg-red-900/20 text-red-600 p-4 rounded-xl flex gap-3 text-sm font-medium"><AlertCircle className="w-5 h-5 flex-shrink-0" />{distanceError}</div>}
          </div>
        )}

        {/* Details Form */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 p-6">
          <h2 className="font-bold text-lg mb-4">Personal Details</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1 flex justify-between">
                Phone Number {isFetchingCustomer && <span className="text-xs text-orange-500 animate-pulse">Looking up details...</span>}
              </label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange} onBlur={handlePhoneBlur} className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all" placeholder="9876543210" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Full Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all" placeholder="John Doe" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Date of Birth (For Birthday Surprises! 🎉)</label>
              <input type="date" name="dob" value={formData.dob} onChange={handleChange} disabled={isExistingDob} className={`w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all text-neutral-500 dark:text-neutral-400 ${isExistingDob ? 'opacity-60 cursor-not-allowed bg-neutral-200 dark:bg-neutral-900' : ''}`} />
            </div>
            {orderType === 'DELIVERY' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Delivery Address</label>
                  <textarea name="address" value={formData.address} onChange={handleChange} className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all resize-none h-24" placeholder="Flat No, Building, Street" />
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
                  <select value={selectedTableId} onChange={(e) => setSelectedTableId(e.target.value)} className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all">
                    <option value="" disabled>Select your table</option>
                    {tables.map(t => <option key={t.id} value={t.id}>{t.tableName ? `${t.tableName} (Table ${t.tableNumber})` : `Table ${t.tableNumber}`}</option>)}
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

        {/* Payment Method */}
        {paymentCheckDone && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 p-6">
            <h2 className="font-bold text-lg mb-4">Payment Method</h2>
            <div className="grid grid-cols-1 gap-3">
              {/* COD */}
              <button
                type="button"
                onClick={() => setPaymentMethod('COD')}
                className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                  paymentMethod === 'COD'
                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                    : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${paymentMethod === 'COD' ? 'bg-orange-100' : 'bg-neutral-100 dark:bg-neutral-800'}`}>
                  <Banknote className={`w-5 h-5 ${paymentMethod === 'COD' ? 'text-orange-600' : 'text-neutral-500'}`} />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">Cash on Delivery</p>
                  <p className="text-xs text-neutral-500">Pay when your order arrives</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'COD' ? 'border-orange-500' : 'border-neutral-300 dark:border-neutral-600'}`}>
                  {paymentMethod === 'COD' && <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />}
                </div>
              </button>

              {/* Online */}
              {onlinePaymentsAvailable ? (
                <button
                  type="button"
                  onClick={() => setPaymentMethod('ONLINE')}
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                    paymentMethod === 'ONLINE'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${paymentMethod === 'ONLINE' ? 'bg-blue-100' : 'bg-neutral-100 dark:bg-neutral-800'}`}>
                    <CreditCard className={`w-5 h-5 ${paymentMethod === 'ONLINE' ? 'text-blue-600' : 'text-neutral-500'}`} />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">Pay Online</p>
                    <p className="text-xs text-neutral-500">UPI · Cards · NetBanking · Wallets</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'ONLINE' ? 'border-blue-500' : 'border-neutral-300 dark:border-neutral-600'}`}>
                    {paymentMethod === 'ONLINE' && <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />}
                  </div>
                </button>
              ) : (
                <div className="flex items-center gap-4 p-4 rounded-xl border-2 border-dashed border-neutral-200 dark:border-neutral-700 opacity-50">
                  <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-neutral-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-neutral-400">Pay Online</p>
                    <p className="text-xs text-neutral-400">Not available for this restaurant</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bill Details */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 p-6 space-y-3">
          <h3 className="font-bold mb-4">Bill Details</h3>
          <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
            <span>Item Total</span><span>₹{getTotalPrice()}</span>
          </div>
          {appliedCoupon && (
            <div className="flex justify-between text-emerald-600 dark:text-emerald-500 font-medium">
              <span>Item Discount</span><span>-₹{appliedCoupon.discountAmount}</span>
            </div>
          )}
          {orderType === 'DELIVERY' && (
            settings?.hasDeliveryCharge && settings.deliveryChargeAmount > 0 ? (
              <div className="flex justify-between text-neutral-600 dark:text-neutral-400 pb-3 border-b border-neutral-100 dark:border-neutral-800">
                <span>Delivery Fee</span><span>₹{settings.deliveryChargeAmount}</span>
              </div>
            ) : (
              <div className="flex justify-between text-neutral-600 dark:text-neutral-400 pb-3 border-b border-neutral-100 dark:border-neutral-800">
                <span>Delivery Fee</span><span className="text-emerald-600 dark:text-emerald-500 font-medium">Free</span>
              </div>
            )
          )}
          <div className="flex justify-between font-bold text-lg pt-1">
            <span>To Pay</span><span>₹{displayTotal}</span>
          </div>
        </div>
      </main>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 p-4 z-50">
        <div className="max-w-2xl mx-auto">
          {checkoutError && (
            <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-3 rounded-xl flex items-start gap-3 text-sm font-medium shadow-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{checkoutError}</span>
            </div>
          )}
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm text-neutral-500 font-medium">TOTAL</div>
              <div className="font-bold text-2xl">₹{displayTotal}</div>
              {isBelowMinDelivery && <div className="text-xs text-red-500 mt-1 font-medium">Minimum order for delivery is ₹{minDeliveryValue}</div>}
            </div>
            <div className="text-right text-sm">
              <div className="text-neutral-400">Paying via</div>
              <div className="font-semibold text-neutral-700 dark:text-neutral-300">
                {paymentMethod === 'ONLINE' ? '💳 Online' : '💵 Cash on Delivery'}
              </div>
            </div>
          </div>
          <button
            onClick={handlePlaceOrder}
            disabled={isPlacingOrder || isBelowMinDelivery || !formData.name || !formData.phone || (orderType === 'DELIVERY' && (!location || !!distanceError || !formData.address))}
            className={`w-full font-bold text-lg py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
              paymentMethod === 'ONLINE'
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/30'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30'
            }`}
          >
            {isPlacingOrder ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
            ) : paymentMethod === 'ONLINE' ? (
              <><CreditCard className="w-5 h-5" /> Pay ₹{displayTotal} Online</>
            ) : (
              <><CheckCircle2 className="w-5 h-5" /> Place Order & Track</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
