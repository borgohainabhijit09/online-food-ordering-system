'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Store, Loader2, ArrowRight } from 'lucide-react';
import { apiClient } from '../../lib/apiClient';

export default function SignupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [successData, setSuccessData] = useState<{slug: string, businessName: string} | null>(null);
  
  const [formData, setFormData] = useState({
    businessName: '',
    slug: '',
    ownerName: '',
    email: '',
    phone: '',
    password: '',
    plan: 'Starter'
  });

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const planQuery = searchParams.get('plan');
      if (planQuery === 'Starter' || planQuery === 'Growth') {
        setFormData(prev => ({ ...prev, plan: planQuery }));
      }
    }
  }, []);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData({
      ...formData,
      businessName: name,
      slug: generateSlug(name)
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await apiClient.post('/api/auth/register', formData);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      // Automatically log them in by setting the token
      localStorage.setItem('adminToken', data.token);
      document.cookie = `adminToken=${data.token}; path=/; max-age=604800; SameSite=Lax`; // 7 days
      
      // Instead of redirecting immediately, show success state with QR code
      setSuccessData({
        slug: formData.slug,
        businessName: formData.businessName
      });
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="flex items-center justify-center gap-2 mb-6">
          <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-orange-600/30">
            R
          </div>
          <span className="font-bold text-2xl tracking-tight">RestoBuddy</span>
        </Link>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-neutral-900 dark:text-white">
          Create your storefront
        </h2>
        <p className="mt-2 text-center text-sm text-neutral-600 dark:text-neutral-400">
          Or{' '}
          <Link href="/admin/login" className="font-medium text-orange-600 hover:text-orange-500">
            log in to your existing account
          </Link>
        </p>
      </div>

      {isSuccess && successData ? (
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white dark:bg-neutral-900 py-8 px-6 shadow-xl sm:rounded-3xl border border-neutral-100 dark:border-neutral-800 text-center">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">Store Created!</h3>
            <p className="text-neutral-500 mb-6">Welcome to RestoBuddy, {successData.businessName}!</p>
            
            <div className="bg-neutral-50 dark:bg-neutral-950 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 mb-6 inline-block">
              <p className="text-sm font-bold text-neutral-500 mb-4 uppercase tracking-wider">Your Store QR Code</p>
              <div className="bg-white p-4 rounded-xl shadow-sm inline-block">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(typeof window !== 'undefined' ? `${window.location.origin}/${successData.slug}` : '')}`} 
                  alt="Store QR Code" 
                  className="w-40 h-40"
                />
              </div>
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mt-4 break-all">
                {typeof window !== 'undefined' ? window.location.origin : ''}/{successData.slug}
              </p>
            </div>

            <button
              onClick={() => router.push('/admin')}
              className="w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-orange-600 hover:bg-orange-700 transition-colors"
            >
              Go to your Admin Dashboard <ArrowRight className="ml-2 w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
          <div className="bg-white dark:bg-neutral-900 py-6 px-4 shadow-xl shadow-neutral-200/20 dark:shadow-none sm:rounded-3xl sm:px-10 border border-neutral-100 dark:border-neutral-800">
            <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 p-3 rounded-r-md">
                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Restaurant Name
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Store className="h-4 w-4 text-neutral-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.businessName}
                    onChange={handleNameChange}
                    className="block w-full pl-9 pr-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-xl focus:ring-orange-500 focus:border-orange-500 sm:text-sm bg-transparent"
                    placeholder="Demo Restaurant"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Store URL
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-500 sm:text-sm">
                    restobuddy.com/
                  </span>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="flex-1 block w-full min-w-0 rounded-none rounded-r-xl sm:text-sm border-neutral-300 dark:border-neutral-700 focus:ring-orange-500 focus:border-orange-500 bg-transparent py-2 px-3 border"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Your Name
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    required
                    value={formData.ownerName}
                    onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                    className="block w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-xl focus:ring-orange-500 focus:border-orange-500 sm:text-sm bg-transparent"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Email Address
                </label>
                <div className="mt-1">
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="block w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-xl focus:ring-orange-500 focus:border-orange-500 sm:text-sm bg-transparent"
                    placeholder="admin@restaurant.com"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Phone Number
                </label>
                <div className="mt-1">
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="block w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-xl focus:ring-orange-500 focus:border-orange-500 sm:text-sm bg-transparent"
                    placeholder="9876543210"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Password
                </label>
                <div className="mt-1">
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="block w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-xl focus:ring-orange-500 focus:border-orange-500 sm:text-sm bg-transparent"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Select Package
              </label>
              <select
                value={formData.plan}
                onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                className="block w-full px-3 py-2.5 border border-neutral-300 dark:border-neutral-700 rounded-xl focus:ring-orange-500 focus:border-orange-500 sm:text-sm bg-transparent outline-none text-neutral-900 dark:text-white"
              >
                <option value="Starter" className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white">RestoBuddy Starter (₹499/mo)</option>
                <option value="Growth" className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white">RestoBuddy Growth (₹599/mo)</option>
              </select>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Launch Store <ArrowRight className="ml-2 w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
