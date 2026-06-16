'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Lock, Phone, Store, ChevronRight } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';

export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  // Multi-store state
  const [requiresStoreSelection, setRequiresStoreSelection] = useState(false);
  const [availableStores, setAvailableStores] = useState<any[]>([]);
  const [partialToken, setPartialToken] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await apiClient.post('/api/auth/login', { phone, password });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Login failed');
      }

      const data = await res.json();
      
      if (data.requiresStoreSelection) {
        setPartialToken(data.partialToken);
        setAvailableStores(data.stores);
        setRequiresStoreSelection(true);
      } else {
        // Single store, regular login
        localStorage.setItem('adminToken', data.token);
        document.cookie = `adminToken=${data.token}; path=/; max-age=604800; SameSite=Lax`; // 7 days
        
        if (data.user?.forcePasswordChange) {
          router.push('/admin/change-password');
        } else {
          router.push('/admin');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectStore = async (tenantId: string) => {
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/select-store`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${partialToken}`
        },
        body: JSON.stringify({ tenantId })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to select store');
      }

      const data = await res.json();
      localStorage.setItem('adminToken', data.token);
      document.cookie = `adminToken=${data.token}; path=/; max-age=604800; SameSite=Lax`; // 7 days
      
      if (data.user?.forcePasswordChange) {
        router.push('/admin/change-password');
      } else {
        router.push('/admin');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to select store');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
        <div className="p-8 pb-6 border-b border-neutral-200 dark:border-neutral-800 text-center">
          <div className="w-12 h-12 bg-orange-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-orange-600/30 mx-auto mb-4">
            {requiresStoreSelection ? <Store className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
            {requiresStoreSelection ? 'Select a Branch' : 'Admin Secure Login'}
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2">
            {requiresStoreSelection ? 'You have access to multiple restaurants.' : 'Sign in to manage your storefront'}
          </p>
        </div>

        {error && (
          <div className="mx-8 mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-xl text-red-600 dark:text-red-400 text-sm font-medium text-center">
            {error}
          </div>
        )}

        {!requiresStoreSelection ? (
          <form onSubmit={handleLogin} className="p-8 space-y-6 pt-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Phone Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-neutral-400" />
                  </div>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                    placeholder="0000000000"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-neutral-400" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
            </button>
          </form>
        ) : (
          <div className="p-8 space-y-4">
            {availableStores.map((store) => (
              <button
                key={store.id}
                onClick={() => handleSelectStore(store.id)}
                disabled={isLoading}
                className="w-full flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800/50 hover:bg-orange-50 dark:hover:bg-orange-900/20 border border-neutral-200 dark:border-neutral-800 hover:border-orange-200 dark:hover:border-orange-900/50 rounded-xl transition-all group disabled:opacity-50"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center text-neutral-500 group-hover:text-orange-600 group-hover:border-orange-200 dark:group-hover:border-orange-900/50 transition-colors">
                    <Store className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-neutral-900 dark:text-white group-hover:text-orange-700 dark:group-hover:text-orange-400 transition-colors">
                      {store.businessName}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      {store.slug}.restobuddy.com
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-neutral-400 group-hover:text-orange-600 transition-colors" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
