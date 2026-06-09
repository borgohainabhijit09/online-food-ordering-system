'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, ShoppingBag, ListOrdered, Settings, LogOut, Plus, Loader2, Copy, ExternalLink, CheckCircle2 } from 'lucide-react';
import { OrderNotification } from '../../components/OrderNotification';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [tenantSlug, setTenantSlug] = useState('');
  const [copied, setCopied] = useState(false);

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
    <div className="flex h-screen bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-50">
      
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-neutral-950 border-r border-neutral-200 dark:border-neutral-800 hidden md:flex flex-col">
        <div className="p-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-600 rounded flex items-center justify-center text-white font-bold text-xs">
              O
            </div>
            <span className="font-bold tracking-tight text-neutral-900 dark:text-white">OmniServe</span>
          </Link>
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
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 flex items-center justify-between px-6 bg-white dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800">
          <div className="font-medium md:hidden">Admin Panel</div>
          <div className="hidden md:flex items-center gap-4 text-sm">
            {tenantSlug && (
              <div className="flex items-center gap-2 bg-neutral-100 dark:bg-neutral-900 py-1.5 px-3 rounded-full border border-neutral-200 dark:border-neutral-800">
                <span className="text-neutral-500 dark:text-neutral-400">Store URL:</span>
                <Link href={`/${tenantSlug}`} target="_blank" className="font-medium hover:text-orange-600 transition-colors flex items-center gap-1">
                  /{tenantSlug} <ExternalLink className="w-3.5 h-3.5" />
                </Link>
                <button onClick={handleCopyLink} className="ml-2 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors" title="Copy link">
                  {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
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
        <div className="flex-1 overflow-auto p-6">
          {children}
        </div>
        <OrderNotification />
      </main>
    </div>
  );
}
