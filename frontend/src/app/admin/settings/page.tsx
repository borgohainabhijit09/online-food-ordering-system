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
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    restaurantName: '',
    isAcceptingOrders: true,
    deliveryRadiusKm: 5,
    restaurantLat: 0,
    restaurantLng: 0,
    whatsappNumber: ''
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
        setSettings(data);
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
          
          <div className="grid grid-cols-2 gap-4">
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
        </div>

        <div className="flex items-center justify-between pt-4">
          <div className="text-sm font-medium text-emerald-600 dark:text-emerald-500">
            {saveMessage}
          </div>
          <button 
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-6 rounded-lg transition-colors disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Save Settings
          </button>
        </div>
      </form>
    </div>
  );
}
