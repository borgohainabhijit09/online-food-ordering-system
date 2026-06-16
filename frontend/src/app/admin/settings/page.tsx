'use client';

import React, { useState, useEffect } from 'react';
import { Save, Loader2, MapPin } from 'lucide-react';
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
}

export default function SettingsPage() {
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
    fssaiNumber: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

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
          fssaiNumber: data.fssaiNumber || ''
        });
      }
    } catch (error) {
      console.error('Failed to fetch settings', error);
    } finally {
      setIsLoading(false);
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

  if (isLoading) return <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-2">Global Settings</h2>
        <p className="text-neutral-500">Configure your restaurant's core operational parameters here.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-sm space-y-6">
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Restaurant Name</label>
            <input 
              type="text" 
              value={settings.restaurantName}
              onChange={e => setSettings({ ...settings, restaurantName: e.target.value })}
              className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-950 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none" 
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">WhatsApp Business Number (Including Country Code)</label>
            <input 
              type="text" 
              value={settings.whatsappNumber}
              onChange={e => setSettings({ ...settings, whatsappNumber: e.target.value })}
              className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-950 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none" 
              placeholder="e.g. +919876543210"
              required
            />
            <p className="text-xs text-neutral-500 mt-1">This number will receive the WhatsApp orders from customers.</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">FSSAI Registration Number (Mandatory) <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              value={settings.fssaiNumber || ''}
              onChange={e => setSettings({ ...settings, fssaiNumber: e.target.value })}
              className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-950 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none" 
              placeholder="e.g. 12345678901234"
              required
            />
            <p className="text-xs text-neutral-500 mt-1">This will be displayed in the footer of your menu to comply with regulations.</p>
          </div>

          <div>
                  <div className="grid gap-2">
                    <label className="block text-sm font-medium mb-1">Restaurant Logo (Optional)</label>
                    <div className="flex items-start gap-4">
                      {settings?.logoUrl && (
                        <div className="w-16 h-16 rounded-lg border overflow-hidden bg-gray-50 shrink-0 flex items-center justify-center">
                          <img src={settings.logoUrl} alt="Logo preview" className="w-full h-full object-contain" />
                        </div>
                      )}
                      <div className="flex-1 space-y-2">
                        <input
                          type="file"
                          accept="image/png, image/jpeg, image/jpg"
                          className="w-full text-sm text-neutral-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            
                            if (file.size > 100 * 1024) {
                              alert("File size must be less than 100KB");
                              e.target.value = '';
                              return;
                            }

                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setSettings({ ...settings, logoUrl: reader.result as string });
                            };
                            reader.readAsDataURL(file);
                          }}
                        />
                        <p className="text-sm text-gray-500">Upload your logo image (PNG/JPG). Max size: 100KB.</p>
                        {settings?.logoUrl && (
                          <button 
                            type="button" 
                            className="text-sm font-medium text-red-500 hover:text-red-700"
                            onClick={() => setSettings({ ...settings, logoUrl: '' })}
                          >
                            Remove Logo
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
          </div>
        </div>

        <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 space-y-4">
          <div className="flex items-center justify-between bg-neutral-50 dark:bg-neutral-950 p-4 rounded-lg border border-neutral-200 dark:border-neutral-800">
            <div>
              <h3 className="font-bold text-lg">Accepting Orders</h3>
              <p className="text-xs text-neutral-500 mt-1">Toggle this to quickly turn off new orders (e.g. if the kitchen is too busy or closing).</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={settings.isAcceptingOrders ?? true}
                onChange={e => setSettings({ ...settings, isAcceptingOrders: e.target.checked })}
              />
              <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-orange-600"></div>
            </label>
          </div>
        </div>

        <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 space-y-4">
          <h3 className="font-bold text-lg">Delivery Configuration</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Restaurant Latitude</label>
              <input 
                type="number" 
                step="any"
                value={settings.restaurantLat}
                onChange={e => setSettings({ ...settings, restaurantLat: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-950 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none" 
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Restaurant Longitude</label>
              <input 
                type="number" 
                step="any"
                value={settings.restaurantLng}
                onChange={e => setSettings({ ...settings, restaurantLng: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-950 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none" 
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Maximum Delivery Radius (km)</label>
            <input 
              type="number" 
              step="0.1"
              value={settings.deliveryRadiusKm}
              onChange={e => setSettings({ ...settings, deliveryRadiusKm: parseFloat(e.target.value) || 0 })}
              className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-950 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none" 
              required
            />
          </div>

          <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Charge Delivery Fee?</h4>
                <p className="text-xs text-neutral-500 mt-1">If enabled, this fee will be added to customer orders.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={settings.hasDeliveryCharge}
                  onChange={e => setSettings({ ...settings, hasDeliveryCharge: e.target.checked })}
                />
                <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-orange-600"></div>
              </label>
            </div>

            {settings.hasDeliveryCharge && (
              <div>
                <label className="block text-sm font-medium mb-1">Delivery Charge Amount (₹)</label>
                <input 
                  type="number" 
                  step="1"
                  value={settings.deliveryChargeAmount}
                  onChange={e => setSettings({ ...settings, deliveryChargeAmount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-950 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none" 
                  required={settings.hasDeliveryCharge}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">Minimum Order Value for Delivery (₹)</label>
              <input 
                type="number" 
                step="1"
                value={settings.minOrderValueForDelivery}
                onChange={e => setSettings({ ...settings, minOrderValueForDelivery: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-950 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none" 
                placeholder="e.g. 200"
              />
              <p className="text-xs text-neutral-500 mt-1">Delivery orders below this amount will not be accepted. Set to 0 to disable.</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between pt-4 gap-4">
          <div className="text-sm font-medium text-emerald-600 dark:text-emerald-500 order-2 sm:order-1">
            {saveMessage}
          </div>
          <button 
            type="submit"
            disabled={isSaving}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-6 rounded-lg transition-colors disabled:opacity-50 order-1 sm:order-2"
          >
            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Save Settings
          </button>
        </div>
      </form>
    </div>
  );
}
