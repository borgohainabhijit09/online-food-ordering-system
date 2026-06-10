'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, ShoppingBag, ListOrdered, Settings, LogOut, Plus, Loader2, Copy, ExternalLink, CheckCircle2, Tag, Menu, X } from 'lucide-react';
import { OrderNotification } from '../../components/OrderNotification';
import { apiClient } from '../../lib/apiClient';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [tenantSlug, setTenantSlug] = useState('');
  const [copied, setCopied] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [settings, setSettings] = useState<any>(null);

  // Close mobile menu when pathname changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    // Check URL params for impersonation token
    const searchParams = new URLSearchParams(window.location.search);
    const impersonateToken = searchParams.get('impersonate');
    if (impersonateToken) {
      sessionStorage.setItem('impersonatedToken', impersonateToken);
      // Clean up URL
      window.history.replaceState(null, '', pathname);
    }

    const token = sessionStorage.getItem('impersonatedToken') || localStorage.getItem('adminToken');
    if (!token && pathname !== '/admin/login') {
      router.push('/admin/login');
    } else if (token) {
      setIsAuthenticated(true);
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.tenantSlug) setTenantSlug(payload.tenantSlug);
      } catch (e) {}

      // Fetch Settings
      const fetchSettings = async () => {
        try {
          const res = await apiClient.get('/api/settings');
          if (res.ok) {
            setSettings(await res.json());
          }
        } catch (e) {}
      };
      fetchSettings();
    }
    setIsLoading(false);
  }, [pathname, router]);

  const handleLogout = () => {
    if (sessionStorage.getItem('impersonatedToken')) {
      sessionStorage.removeItem('impersonatedToken');
      window.close();
      return;
    }
    localStorage.removeItem('adminToken');
    router.push('/admin/login');
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/${tenantSlug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return <div className="h-screen w-screen flex items-center justify-center bg-neutral-100 dark:bg-neutral-950"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>;
  }

  // Do not render the sidebar if on the login page
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  if (!isAuthenticated) return null;

  return (
    <div className="flex h-screen bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-50 overflow-hidden">
      
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm" 
          onClick={() => setIsMobileMenuOpen(false)} 
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-neutral-950 border-r border-neutral-200 dark:border-neutral-800 flex flex-col transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            {settings?.logoUrl ? (
              <img src={settings.logoUrl} alt="Restaurant Logo" className="w-8 h-8 rounded object-cover" />
            ) : (
              <div className="w-8 h-8 bg-orange-600 rounded flex items-center justify-center text-white font-bold text-xs">
                {settings?.restaurantName ? settings.restaurantName[0] : 'R'}
              </div>
            )}
            <span className="font-bold tracking-tight text-neutral-900 dark:text-white">
              {settings?.restaurantName || 'RestoBuddy'}
            </span>
          </Link>
          <button 
            className="md:hidden p-1 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <Link href="/admin" className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${pathname === '/admin' ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-500 font-medium' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400'}`}>
            <LayoutDashboard className="w-5 h-5" />
            <span>Dashboard</span>
          </Link>
          <Link href="/admin/orders" className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${pathname === '/admin/orders' ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-500 font-medium' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400'}`}>
            <ListOrdered className="w-5 h-5" />
            <span>Orders</span>
          </Link>
          <Link href="/admin/categories" className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${pathname === '/admin/categories' ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-500 font-medium' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400'}`}>
            <LayoutDashboard className="w-5 h-5" />
            <span>Categories</span>
          </Link>
          <Link href="/admin/addons" className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${pathname === '/admin/addons' ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-500 font-medium' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400'}`}>
            <Plus className="w-5 h-5" />
            <span>Addons</span>
          </Link>
          <Link href="/admin/products" className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${pathname === '/admin/products' ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-500 font-medium' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400'}`}>
            <ShoppingBag className="w-5 h-5" />
            <span>Products</span>
          </Link>
          <Link href="/admin/coupons" className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${pathname === '/admin/coupons' ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-500 font-medium' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400'}`}>
            <Tag className="w-5 h-5" />
            <span>Coupons</span>
          </Link>
          <Link href="/admin/settings" className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${pathname === '/admin/settings' ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-500 font-medium' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400'}`}>
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </Link>
        </nav>
        
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800">
          <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2 w-full text-left text-red-500 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-colors">
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Log out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden w-full">
        {/* Top Header */}
        <header className="h-16 flex items-center justify-between px-4 md:px-6 bg-white dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800 shrink-0">
          <div className="flex items-center gap-3 md:hidden">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 -ml-2 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <span className="font-bold tracking-tight">Admin</span>
          </div>
          <div className="flex items-center gap-2 md:gap-4 text-xs md:text-sm overflow-hidden">
            {tenantSlug && (
              <div className="flex items-center gap-1 md:gap-2 bg-neutral-100 dark:bg-neutral-900 py-1 md:py-1.5 px-2 md:px-3 rounded-full border border-neutral-200 dark:border-neutral-800 shrink max-w-[140px] sm:max-w-none">
                <span className="hidden md:inline text-neutral-500 dark:text-neutral-400">Store URL:</span>
                <Link href={`/${tenantSlug}`} target="_blank" className="font-medium hover:text-orange-600 transition-colors flex items-center gap-1 truncate">
                  <span className="truncate">/{tenantSlug}</span> <ExternalLink className="w-3 h-3 md:w-3.5 md:h-3.5 shrink-0" />
                </Link>
                <button onClick={handleCopyLink} className="ml-1 md:ml-2 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors shrink-0" title="Copy link">
                  {copied ? <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4 text-emerald-500" /> : <Copy className="w-3 h-3 md:w-4 md:h-4" />}
                </button>
              </div>
            )}
          </div>
          <div className="ml-auto flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold">
              A
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-4 md:p-6 pb-24 md:pb-6">
          {children}
        </div>
        <OrderNotification />
      </main>
    </div>
  );
}
