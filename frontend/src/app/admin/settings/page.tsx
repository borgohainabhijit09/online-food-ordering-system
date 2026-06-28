'use client';

import React, { useState, useEffect } from 'react';
import { Save, Loader2, MapPin, Download, Printer, CreditCard, CheckCircle2, AlertTriangle, Eye, EyeOff, Unlink, Zap, Lock } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { apiClient } from '@/lib/apiClient';

interface Settings {
  id?: string;
  restaurantName: string;
  isAcceptingOrders: boolean;
  deliveryRadiusKm: number;
  restaurantLat: number;
  restaurantLng: number;
  whatsappNumber: string;
  hasDeliveryCharge: boolean;
  deliveryChargeAmount: number;
  minOrderValueForDelivery: number;
  logoUrl?: string;
  fssaiNumber?: string;
  tenantSlug?: string;
  restaurantId?: string;
  loyaltyEnabled: boolean;
  loyaltyPointsExpiryDays?: number | null;
  pointsEarningMultiplier: number;
  pointsEarningSpendUnit: number;
  pointValueInRupees: number;
  minimumPointsToRedeem: number;
  repeatOrderThreshold: number;
  vipSpendThreshold: number;
}

interface PaymentStatus {
  connected: boolean;
  keyId: string | null;
  enabled: boolean;
}

type Tab = 'general' | 'delivery' | 'payments' | 'loyalty';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [settings, setSettings] = useState<Settings>({
    restaurantName: '',
    isAcceptingOrders: true,
    deliveryRadiusKm: 5,
    restaurantLat: 0,
    restaurantLng: 0,
    whatsappNumber: '',
    hasDeliveryCharge: false,
    deliveryChargeAmount: 0,
    minOrderValueForDelivery: 0,
    logoUrl: '',
    fssaiNumber: '',
    loyaltyEnabled: false,
    loyaltyPointsExpiryDays: null,
    pointsEarningMultiplier: 1.0,
    pointsEarningSpendUnit: 100.0,
    pointValueInRupees: 1.0,
    minimumPointsToRedeem: 50,
    repeatOrderThreshold: 5,
    vipSpendThreshold: 3000
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Payment state
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>({ connected: false, keyId: null, enabled: false });
  const [paymentLoading, setPaymentLoading] = useState(true);
  const [keyId, setKeyId] = useState('');
  const [keySecret, setKeySecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [paymentMsg, setPaymentMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => { fetchSettings(); fetchPaymentStatus(); }, []);

  const fetchSettings = async () => {
    try {
      const res = await apiClient.get('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings({
          restaurantName: data.restaurantName || '',
          isAcceptingOrders: data.isAcceptingOrders ?? true,
          deliveryRadiusKm: data.deliveryRadiusKm || 5,
          restaurantLat: data.restaurantLat || 0,
          restaurantLng: data.restaurantLng || 0,
          whatsappNumber: data.whatsappNumber || '',
          hasDeliveryCharge: data.hasDeliveryCharge ?? false,
          deliveryChargeAmount: data.deliveryChargeAmount || 0,
          minOrderValueForDelivery: data.minOrderValueForDelivery || 0,
          logoUrl: data.logoUrl || '',
          fssaiNumber: data.fssaiNumber || '',
          tenantSlug: data.tenantSlug || '',
          restaurantId: data.restaurantId || '',
          loyaltyEnabled: data.loyaltyEnabled ?? false,
          loyaltyPointsExpiryDays: data.loyaltyPointsExpiryDays || null,
          pointsEarningMultiplier: data.pointsEarningMultiplier ?? 1.0,
          pointsEarningSpendUnit: data.pointsEarningSpendUnit ?? 100.0,
          pointValueInRupees: data.pointValueInRupees ?? 1.0,
          minimumPointsToRedeem: data.minimumPointsToRedeem ?? 50,
          repeatOrderThreshold: data.repeatOrderThreshold ?? 5,
          vipSpendThreshold: data.vipSpendThreshold ?? 3000
        });
      }
    } catch (error) {
      console.error('Failed to fetch settings', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPaymentStatus = async () => {
    try {
      setPaymentLoading(true);
      const res = await apiClient.get('/api/settings/payment-gateway');
      if (res.ok) {
        const data = await res.json();
        setPaymentStatus(data);
      }
    } catch (error) {
      console.error('Failed to fetch payment status', error);
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMessage('');
    try {
      const res = await apiClient.put('/api/settings', settings);
      if (res.ok) {
        setSaveMessage('Settings saved successfully!');
        setTimeout(() => setSaveMessage(''), 3000);
      }
    } catch (error) {
      console.error('Failed to update settings', error);
      setSaveMessage('Error saving settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConnectRazorpay = async () => {
    if (!keyId || !keySecret) {
      setPaymentMsg({ text: 'Please enter both Key ID and Key Secret', type: 'error' });
      return;
    }
    setIsConnecting(true);
    setPaymentMsg(null);
    try {
      const res = await apiClient.post('/api/settings/payment-gateway', { keyId, keySecret });
      const data = await res.json();
      if (res.ok) {
        setPaymentMsg({ text: '✅ Razorpay connected successfully!', type: 'success' });
        setKeyId('');
        setKeySecret('');
        await fetchPaymentStatus();
      } else {
        setPaymentMsg({ text: data.message || 'Failed to connect', type: 'error' });
      }
    } catch (err) {
      setPaymentMsg({ text: 'Network error. Please try again.', type: 'error' });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnectRazorpay = async () => {
    if (!confirm('Are you sure you want to disconnect Razorpay? Customers will only be able to pay via Cash on Delivery.')) return;
    setIsDisconnecting(true);
    try {
      const res = await apiClient.delete('/api/settings/payment-gateway');
      if (res.ok) {
        setPaymentMsg({ text: 'Razorpay disconnected.', type: 'success' });
        await fetchPaymentStatus();
      }
    } catch (err) {
      setPaymentMsg({ text: 'Failed to disconnect.', type: 'error' });
    } finally {
      setIsDisconnecting(false);
    }
  };

  const downloadStoreQR = () => {
    if (!settings.tenantSlug) return;
    const svg = document.getElementById('store-qr-code');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        const a = document.createElement('a');
        a.download = `store-${settings.tenantSlug}-qr.png`;
        a.href = canvas.toDataURL('image/png');
        a.click();
      }
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const printStoreQR = () => {
    if (!settings.tenantSlug) return;
    const svg = document.getElementById('store-qr-code');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const windowContent = '<!DOCTYPE html><html><head><title>Print Store QR</title><style>body{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;font-family:sans-serif;}svg{width:300px;height:300px;}</style></head><body><h2>' + settings.restaurantName + '</h2>' + svgData + '</body></html>';
    const printWin = window.open('', '', 'width=600,height=600');
    if (printWin) {
      printWin.document.open();
      printWin.document.write(windowContent);
      printWin.document.close();
      printWin.focus();
      setTimeout(() => { printWin.print(); printWin.close(); }, 500);
    }
  };

  if (isLoading) return <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>;

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'general', label: 'General', icon: <MapPin className="w-4 h-4" /> },
    { key: 'delivery', label: 'Delivery', icon: <Zap className="w-4 h-4" /> },
    { key: 'payments', label: 'Payments', icon: <CreditCard className="w-4 h-4" /> },
    { key: 'loyalty', label: 'Loyalty & Customers', icon: <CheckCircle2 className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-2">Settings</h2>
        <p className="text-neutral-500">Configure your restaurant's core operational parameters.</p>
      </div>

      {/* Tab Nav */}
      <div className="flex gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl w-fit">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === tab.key
                ? 'bg-white dark:bg-neutral-900 text-orange-600 shadow-sm'
                : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.key === 'payments' && paymentStatus.connected && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 ml-0.5" />
            )}
          </button>
        ))}
      </div>

      {/* ── GENERAL TAB ─────────────────────────────────────────────────── */}
      {activeTab === 'general' && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-sm space-y-6">
          <div className="space-y-4">
            <div className="bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800">
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">Unique Restaurant ID</label>
              <div className="flex items-center gap-2">
                <code className="text-lg font-mono font-bold text-orange-600 bg-orange-50 dark:bg-orange-900/20 px-3 py-1 rounded-lg">{settings.restaurantId || 'N/A'}</code>
                <span className="text-xs text-neutral-400 font-medium">Your global identification ID</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Restaurant Name</label>
              <input type="text" value={settings.restaurantName} onChange={e => setSettings({ ...settings, restaurantName: e.target.value })} className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-950 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none" required />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">WhatsApp Business Number (Including Country Code)</label>
              <input type="text" value={settings.whatsappNumber} onChange={e => setSettings({ ...settings, whatsappNumber: e.target.value })} className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-950 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none" placeholder="e.g. +919876543210" required />
              <p className="text-xs text-neutral-500 mt-1">This number will receive the WhatsApp orders from customers.</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">FSSAI Registration Number (Mandatory) <span className="text-red-500">*</span></label>
              <input type="text" value={settings.fssaiNumber || ''} onChange={e => setSettings({ ...settings, fssaiNumber: e.target.value })} className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-950 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none" placeholder="e.g. 12345678901234" required />
              <p className="text-xs text-neutral-500 mt-1">Displayed in the footer of your menu to comply with regulations.</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Restaurant Logo (Optional)</label>
              <div className="flex items-start gap-4">
                {settings?.logoUrl && (
                  <div className="w-16 h-16 rounded-lg border overflow-hidden bg-gray-50 shrink-0 flex items-center justify-center">
                    <img src={settings.logoUrl} alt="Logo preview" className="w-full h-full object-contain" />
                  </div>
                )}
                <div className="flex-1 space-y-2">
                  <input type="file" accept="image/png, image/jpeg, image/jpg" className="w-full text-sm text-neutral-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 100 * 1024) { alert("File size must be less than 100KB"); e.target.value = ''; return; }
                      const reader = new FileReader();
                      reader.onloadend = () => { setSettings({ ...settings, logoUrl: reader.result as string }); };
                      reader.readAsDataURL(file);
                    }}
                  />
                  <p className="text-sm text-gray-500">Upload PNG/JPG. Max size: 100KB.</p>
                  {settings?.logoUrl && <button type="button" className="text-sm font-medium text-red-500 hover:text-red-700" onClick={() => setSettings({ ...settings, logoUrl: '' })}>Remove Logo</button>}
                </div>
              </div>
            </div>
          </div>

          {/* Accepting Orders toggle */}
          <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center justify-between bg-neutral-50 dark:bg-neutral-950 p-4 rounded-lg border border-neutral-200 dark:border-neutral-800">
              <div>
                <h3 className="font-bold text-lg">Accepting Orders</h3>
                <p className="text-xs text-neutral-500 mt-1">Toggle this to quickly turn off new orders (e.g. if the kitchen is too busy or closing).</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={settings.isAcceptingOrders ?? true} onChange={e => setSettings({ ...settings, isAcceptingOrders: e.target.checked })} />
                <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-orange-600"></div>
              </label>
            </div>
          </div>

          {/* Store QR */}
          {settings.tenantSlug && (
            <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 space-y-4">
              <h3 className="font-bold text-lg">Store Link & QR Code</h3>
              <div className="bg-neutral-50 dark:bg-neutral-950 p-6 rounded-xl border border-neutral-200 dark:border-neutral-800 flex flex-col md:flex-row items-center gap-6">
                <div className="bg-white p-4 rounded-xl shadow-sm">
                  <QRCodeSVG id="store-qr-code" value={typeof window !== 'undefined' ? `${window.location.origin}/${settings.tenantSlug}` : `https://restobuddy.in/${settings.tenantSlug}`} size={160} level="H" includeMargin={true} />
                </div>
                <div className="flex flex-col flex-1 w-full text-center md:text-left">
                  <p className="text-sm font-bold text-neutral-500 mb-2 uppercase tracking-wider">Your Customer Portal</p>
                  <div className="flex items-center gap-2 mb-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 px-3 py-2 rounded-lg break-all text-sm">
                    <a href={`/${settings.tenantSlug}`} target="_blank" rel="noreferrer" className="text-orange-600 hover:underline">
                      {typeof window !== 'undefined' ? `${window.location.origin}/${settings.tenantSlug}` : `https://restobuddy.in/${settings.tenantSlug}`}
                    </a>
                  </div>
                  <div className="flex gap-3">
                    <button type="button" onClick={downloadStoreQR} className="flex-1 flex justify-center items-center gap-2 bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 px-4 py-2 rounded-lg font-medium transition-colors text-sm">
                      <Download className="w-4 h-4" /> Download
                    </button>
                    <button type="button" onClick={printStoreQR} className="flex-1 flex justify-center items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm text-sm">
                      <Printer className="w-4 h-4" /> Print
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-between pt-4 gap-4">
            <div className="text-sm font-medium text-emerald-600 dark:text-emerald-500 order-2 sm:order-1">{saveMessage}</div>
            <button type="submit" disabled={isSaving} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-6 rounded-lg transition-colors disabled:opacity-50 order-1 sm:order-2">
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Save Settings
            </button>
          </div>
        </form>
      )}

      {/* ── DELIVERY TAB ─────────────────────────────────────────────────── */}
      {activeTab === 'delivery' && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-sm space-y-6">
          <h3 className="font-bold text-lg">Delivery Configuration</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Restaurant Latitude</label>
              <input type="number" step="any" value={settings.restaurantLat} onChange={e => setSettings({ ...settings, restaurantLat: parseFloat(e.target.value) || 0 })} className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-950 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Restaurant Longitude</label>
              <input type="number" step="any" value={settings.restaurantLng} onChange={e => setSettings({ ...settings, restaurantLng: parseFloat(e.target.value) || 0 })} className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-950 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none" required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Maximum Delivery Radius (km)</label>
            <input type="number" step="0.1" value={settings.deliveryRadiusKm} onChange={e => setSettings({ ...settings, deliveryRadiusKm: parseFloat(e.target.value) || 0 })} className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-950 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none" required />
          </div>
          <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Charge Delivery Fee?</h4>
                <p className="text-xs text-neutral-500 mt-1">If enabled, this fee will be added to customer orders.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={settings.hasDeliveryCharge} onChange={e => setSettings({ ...settings, hasDeliveryCharge: e.target.checked })} />
                <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-orange-600"></div>
              </label>
            </div>
            {settings.hasDeliveryCharge && (
              <div>
                <label className="block text-sm font-medium mb-1">Delivery Charge Amount (₹)</label>
                <input type="number" step="1" value={settings.deliveryChargeAmount} onChange={e => setSettings({ ...settings, deliveryChargeAmount: parseFloat(e.target.value) || 0 })} className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-950 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none" required={settings.hasDeliveryCharge} />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1">Minimum Order Value for Delivery (₹)</label>
              <input type="number" step="1" value={settings.minOrderValueForDelivery} onChange={e => setSettings({ ...settings, minOrderValueForDelivery: parseFloat(e.target.value) || 0 })} className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-950 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none" placeholder="e.g. 200" />
              <p className="text-xs text-neutral-500 mt-1">Delivery orders below this amount will not be accepted. Set to 0 to disable.</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between pt-4 gap-4">
            <div className="text-sm font-medium text-emerald-600 dark:text-emerald-500 order-2 sm:order-1">{saveMessage}</div>
            <button type="submit" disabled={isSaving} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-6 rounded-lg transition-colors disabled:opacity-50 order-1 sm:order-2">
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Save Settings
            </button>
          </div>
        </form>
      )}

      {/* ── PAYMENTS TAB ─────────────────────────────────────────────────── */}
      {activeTab === 'payments' && (
        <div className="space-y-4">

          {paymentLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>
          ) : paymentStatus.connected ? (
            /* ── CONNECTED STATE ── */
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-sm space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-emerald-700 dark:text-emerald-400">Razorpay Connected</h3>
                  <p className="text-sm text-neutral-500">Online payments are active on your storefront</p>
                </div>
              </div>

              <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500 font-medium">Key ID</span>
                  <code className="font-mono text-emerald-700 dark:text-emerald-400 font-bold">{paymentStatus.keyId}</code>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500 font-medium">Mode</span>
                  <span className={`font-bold px-2 py-0.5 rounded text-xs ${paymentStatus.keyId?.includes('test') ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {paymentStatus.keyId?.includes('test') ? '⚠️ Test Mode' : '🟢 Live Mode'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500 font-medium">Accepted Methods</span>
                  <span className="font-medium text-neutral-700 dark:text-neutral-300">UPI · Cards · NetBanking · Wallets</span>
                </div>
              </div>

              {paymentStatus.keyId?.includes('test') && (
                <div className="flex gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-sm text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Test Mode Active</p>
                    <p className="mt-0.5">Use test card <code className="font-mono bg-amber-100 dark:bg-amber-900 px-1 rounded">4111 1111 1111 1111</code> with any future date and any CVV. No real money is charged.</p>
                  </div>
                </div>
              )}

              {paymentMsg && (
                <div className={`p-3 rounded-lg text-sm font-medium ${paymentMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                  {paymentMsg.text}
                </div>
              )}

              <button
                onClick={handleDisconnectRazorpay}
                disabled={isDisconnecting}
                className="w-full flex items-center justify-center gap-2 border border-red-200 dark:border-red-800 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 font-semibold py-3 rounded-xl transition-all text-sm"
              >
                {isDisconnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Unlink className="w-4 h-4" />}
                Disconnect Razorpay
              </button>
            </div>
          ) : (
            /* ── NOT CONNECTED STATE ── */
            <div className="space-y-4">
              <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-sm space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#072654] flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-[#3395FF]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Connect Razorpay</h3>
                    <p className="text-sm text-neutral-500">Accept UPI, Cards, NetBanking & Wallets from customers</p>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 text-sm text-blue-700 dark:text-blue-400 space-y-1">
                  <p className="font-bold">How to get your API keys:</p>
                  <ol className="list-decimal list-inside space-y-1 text-blue-600 dark:text-blue-300">
                    <li>Login to <a href="https://dashboard.razorpay.com" target="_blank" rel="noreferrer" className="underline font-semibold">dashboard.razorpay.com</a></li>
                    <li>Go to Settings → API Keys</li>
                    <li>Click <strong>Generate Test Key</strong> (for testing) or <strong>Generate Live Key</strong></li>
                    <li>Copy the Key ID and Key Secret below</li>
                  </ol>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1.5">Razorpay Key ID</label>
                    <input
                      type="text"
                      value={keyId}
                      onChange={e => setKeyId(e.target.value)}
                      placeholder="rzp_test_xxxxxxxxxxxxxxxx"
                      className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1.5">Razorpay Key Secret</label>
                    <div className="relative">
                      <input
                        type={showSecret ? 'text' : 'password'}
                        value={keySecret}
                        onChange={e => setKeySecret(e.target.value)}
                        placeholder="••••••••••••••••••••••••"
                        className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-mono text-sm pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSecret(!showSecret)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                      >
                        {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-neutral-400 mt-1.5 flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Stored encrypted — never visible after saving
                    </p>
                  </div>

                  {paymentMsg && (
                    <div className={`p-3 rounded-lg text-sm font-medium ${paymentMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                      {paymentMsg.text}
                    </div>
                  )}

                  <button
                    onClick={handleConnectRazorpay}
                    disabled={isConnecting || !keyId || !keySecret}
                    className="w-full bg-[#072654] hover:bg-[#0a3275] disabled:opacity-50 text-white font-bold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
                  >
                    {isConnecting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
                    Connect Razorpay
                  </button>
                </div>
              </div>

              <div className="bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl p-4 text-sm text-neutral-500 space-y-2">
                <p className="font-semibold text-neutral-700 dark:text-neutral-300">What happens after connecting?</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Customers see a <strong>"Pay Online"</strong> button at checkout</li>
                  <li>Payments go directly to your Razorpay account</li>
                  <li>Settlement to your bank account in T+2 days</li>
                  <li>RestoBuddy never touches your money</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── LOYALTY TAB ─────────────────────────────────────────────────── */}
      {activeTab === 'loyalty' && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-sm space-y-6 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800">
            <div>
              <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Enable Loyalty & Rewards
              </h3>
              <p className="text-xs text-neutral-500 mt-1">Allow customers to earn points on every order and redeem them for discounts.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={settings.loyaltyEnabled} onChange={(e) => setSettings({ ...settings, loyaltyEnabled: e.target.checked })} />
              <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
            </label>
          </div>

          {settings.loyaltyEnabled && (
            <div className="space-y-6 pt-4 border-t border-neutral-200 dark:border-neutral-800">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Earning Rule</label>
                    <p className="text-xs text-neutral-500 mb-2">How many points they earn per spend amount.</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Earn</span>
                    <input type="number" step="0.1" value={settings.pointsEarningMultiplier} onChange={(e) => setSettings({ ...settings, pointsEarningMultiplier: parseFloat(e.target.value) || 1 })} className="w-20 px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
                    <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">points per ₹</span>
                    <input type="number" step="1" value={settings.pointsEarningSpendUnit} onChange={(e) => setSettings({ ...settings, pointsEarningSpendUnit: parseFloat(e.target.value) || 100 })} className="w-24 px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Redemption Value</label>
                    <p className="text-xs text-neutral-500 mb-2">How much 1 point is worth in actual rupees.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">1 point = ₹</span>
                    <input type="number" step="0.1" value={settings.pointValueInRupees} onChange={(e) => setSettings({ ...settings, pointValueInRupees: parseFloat(e.target.value) || 1 })} className="w-24 px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Minimum Points to Redeem</label>
                  <p className="text-xs text-neutral-500 mb-2">Customers must have this many points to use them.</p>
                  <input type="number" step="1" value={settings.minimumPointsToRedeem} onChange={(e) => setSettings({ ...settings, minimumPointsToRedeem: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Points Expiry (Days)</label>
                  <p className="text-xs text-neutral-500 mb-2">Leave blank if points should never expire.</p>
                  <input type="number" step="1" value={settings.loyaltyPointsExpiryDays || ''} onChange={(e) => setSettings({ ...settings, loyaltyPointsExpiryDays: e.target.value ? parseInt(e.target.value) : null })} placeholder="e.g. 90 or blank" className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
                </div>
              </div>
            </div>
          )}

          <div className="space-y-6 pt-4 border-t border-neutral-200 dark:border-neutral-800">
            <div>
              <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-200">Customer Tiers & Analytics</h3>
              <p className="text-xs text-neutral-500 mt-1">Configure when a customer is classified as a Repeat or VIP customer across your dashboards.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Repeat Customer Threshold</label>
                <p className="text-xs text-neutral-500 mb-2">Number of total orders required to become a Repeat customer.</p>
                <input type="number" step="1" min="2" value={settings.repeatOrderThreshold} onChange={(e) => setSettings({ ...settings, repeatOrderThreshold: parseInt(e.target.value) || 5 })} className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">VIP Spend Threshold (₹)</label>
                <p className="text-xs text-neutral-500 mb-2">Total spend amount required to become a VIP customer.</p>
                <input type="number" step="1" min="0" value={settings.vipSpendThreshold} onChange={(e) => setSettings({ ...settings, vipSpendThreshold: parseInt(e.target.value) || 3000 })} className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 flex justify-end items-center gap-4">
            {saveMessage && <span className="text-sm font-medium text-emerald-600">{saveMessage}</span>}
            <button type="submit" disabled={isSaving} className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold rounded-lg shadow-sm flex items-center gap-2 disabled:opacity-50 transition-all">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
