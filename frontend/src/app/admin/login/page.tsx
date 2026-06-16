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
    <div className="min-h-screen flex">
      {/* Left side - Branding/Image */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 p-12 flex-col justify-between relative overflow-hidden">
        {/* Decorative background patterns */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
        <div className="absolute -top-32 -left-32 w-[30rem] h-[30rem] bg-white/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-32 -right-32 w-[30rem] h-[30rem] bg-black/20 rounded-full blur-3xl"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 text-white mb-8">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/30 shadow-lg">
              <Store className="w-6 h-6" />
            </div>
            <span className="text-3xl font-black tracking-tight">RestoBuddy</span>
          </div>
        </div>
        
        <div className="relative z-10 text-white space-y-6 max-w-lg mb-20">
          <h2 className="text-5xl font-bold leading-tight tracking-tight">
            Manage your restaurant <br/><span className="text-orange-200">like a pro.</span>
          </h2>
          <p className="text-orange-100 text-lg leading-relaxed font-medium">
            Everything you need to run your business efficiently, right at your fingertips. Log in to access your dashboard, menus, and incoming orders.
          </p>
        </div>
        
        <div className="relative z-10 text-orange-200/80 text-sm font-medium">
          &copy; {new Date().getFullYear()} RestoBuddy Platform. All rights reserved.
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 bg-white dark:bg-neutral-950 flex flex-col justify-center items-center p-6 sm:p-12 relative">
        {/* Mobile Logo */}
        <div className="lg:hidden absolute top-8 left-8 flex items-center gap-2 text-neutral-900 dark:text-white">
          <Store className="w-6 h-6 text-orange-600" />
          <span className="text-xl font-bold tracking-tight">RestoBuddy</span>
        </div>

        <div className="w-full max-w-md mt-16 lg:mt-0">
          <div className="text-center lg:text-left mb-8">
            <div className="w-14 h-14 bg-orange-100 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center text-orange-600 dark:text-orange-500 mb-6 mx-auto lg:mx-0 shadow-sm border border-orange-200 dark:border-orange-800/50">
              {requiresStoreSelection ? <Store className="w-7 h-7" /> : <Lock className="w-7 h-7" />}
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white mb-2">
              {requiresStoreSelection ? 'Select a Branch' : 'Welcome back'}
            </h1>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm">
              {requiresStoreSelection ? 'You have access to multiple restaurants.' : 'Please enter your details to securely sign in.'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-xl text-red-600 dark:text-red-400 text-sm font-medium flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-red-600 dark:bg-red-500"></div>
              {error}
            </div>
          )}

          {!requiresStoreSelection ? (
            <div>
              <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">Phone Number</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-orange-600">
                      <Phone className="h-5 w-5 text-neutral-400 group-focus-within:text-orange-500 transition-colors" />
                    </div>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="block w-full pl-11 pr-4 py-3.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:bg-white dark:focus:bg-neutral-950 outline-none transition-all shadow-sm"
                      placeholder="e.g. 9876543210"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">Password</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-orange-600">
                      <Lock className="h-5 w-5 text-neutral-400 group-focus-within:text-orange-500 transition-colors" />
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-11 pr-4 py-3.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:bg-white dark:focus:bg-neutral-950 outline-none transition-all shadow-sm"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center items-center py-3.5 px-4 rounded-xl shadow-lg shadow-orange-600/20 text-sm font-bold text-white bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0 disabled:shadow-none"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
                </button>
              </div>
            </form>
            
            <div className="mt-8 pt-6 border-t border-neutral-100 dark:border-neutral-800 text-center space-y-3">
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Trouble logging in or forgot password?</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm font-medium text-neutral-500 dark:text-neutral-400">
                <a href="https://wa.me/917002309306" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-orange-600 transition-colors bg-neutral-50 dark:bg-neutral-900 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-orange-200 dark:hover:border-orange-900/50">
                  <Phone className="w-4 h-4" /> +91 70023 09306
                </a>
                <a href="https://wa.me/917760133445" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-orange-600 transition-colors bg-neutral-50 dark:bg-neutral-900 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-orange-200 dark:hover:border-orange-900/50">
                  <Phone className="w-4 h-4" /> +91 77601 33445
                </a>
              </div>
              <p className="text-xs text-neutral-400">Reach out to us via Phone or WhatsApp for immediate support.</p>
            </div>
          </div>
          ) : (
            <div className="space-y-3 pt-2">
              {availableStores.map((store) => (
                <button
                  key={store.id}
                  onClick={() => handleSelectStore(store.id)}
                  disabled={isLoading}
                  className="w-full flex items-center justify-between p-4 bg-white dark:bg-neutral-900 hover:bg-orange-50 dark:hover:bg-orange-900/20 border-2 border-neutral-100 dark:border-neutral-800 hover:border-orange-200 dark:hover:border-orange-900/50 rounded-2xl shadow-sm hover:shadow-md transition-all group disabled:opacity-50 text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-500 group-hover:scale-110 transition-transform">
                      <Store className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-bold text-neutral-900 dark:text-white text-lg">
                        {store.businessName}
                      </p>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        {store.slug}.restobuddy.com
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-neutral-300 group-hover:text-orange-500 transition-colors group-hover:translate-x-1" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
