'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Users, LogOut, ShieldAlert, Receipt, TrendingUp, HeartPulse, Contact, ListChecks, AlertTriangle, Briefcase, LifeBuoy, Store } from 'lucide-react';
import { apiClient } from '../../lib/apiClient';

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [unreadSupportCount, setUnreadSupportCount] = useState(0);

  useEffect(() => {
    if (pathname.includes('/login') || pathname.includes('/hidden-setup')) {
      setIsAuthorized(true);
      return;
    }

    const token = localStorage.getItem('superAdminToken');
    const isSuper = localStorage.getItem('superAdminMode');
    
    if (!token || isSuper !== 'true') {
      router.push('/super-admin/login');
    } else {
      setIsAuthorized(true);
    }
  }, [pathname]);

  useEffect(() => {
    if (!isAuthorized) return;

    const fetchCounts = async () => {
      try {
        const res = await apiClient.get('/api/super-admin/support/tickets/unread-count');
        if (res.ok) {
          const data = await res.json();
          setUnreadSupportCount(data.count || 0);
        }
      } catch (error) {
        console.error('Failed to fetch unread support count', error);
      }
    };

    fetchCounts();
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
  }, [isAuthorized, pathname, router]);

  if (!isAuthorized) return null;

  if (pathname.includes('/login') || pathname.includes('/hidden-setup')) {
    return <>{children}</>;
  }

  const handleLogout = () => {
    localStorage.removeItem('superAdminToken');
    localStorage.removeItem('superAdminMode');
    router.push('/super-admin/login');
  };

  return (
    <div className="h-screen overflow-hidden bg-neutral-50 flex font-sans">
      {/* Sidebar */}
      <div className="w-64 bg-black text-white p-6 flex flex-col h-screen overflow-y-auto">
        <div className="flex items-center gap-3 mb-8">
          <ShieldAlert className="w-8 h-8 text-white" />
          <h1 className="font-bold text-xl tracking-tight">Super Admin</h1>
        </div>

        <nav className="flex-1 space-y-1">
          <Link href="/super-admin" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${pathname === '/super-admin' ? 'bg-white text-black' : 'text-neutral-400 hover:text-white hover:bg-neutral-900'}`}>
            <LayoutDashboard className="w-5 h-5" /> Overview
          </Link>
          <Link href="/super-admin/ceo" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${pathname === '/super-admin/ceo' ? 'bg-white text-black' : 'text-neutral-400 hover:text-white hover:bg-neutral-900'}`}>
            <Briefcase className="w-5 h-5" /> CEO Dashboard
          </Link>
          <Link href="/super-admin/health" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${pathname === '/super-admin/health' ? 'bg-white text-black' : 'text-neutral-400 hover:text-white hover:bg-neutral-900'}`}>
            <HeartPulse className="w-5 h-5" /> Health Monitor
          </Link>
          <Link href="/super-admin/crm" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${pathname === '/super-admin/crm' ? 'bg-white text-black' : 'text-neutral-400 hover:text-white hover:bg-neutral-900'}`}>
            <Contact className="w-5 h-5" /> Lead CRM
          </Link>
          <Link href="/super-admin/onboarding" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${pathname === '/super-admin/onboarding' ? 'bg-white text-black' : 'text-neutral-400 hover:text-white hover:bg-neutral-900'}`}>
            <ListChecks className="w-5 h-5" /> Onboarding
          </Link>
          <Link href="/super-admin/churn" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${pathname === '/super-admin/churn' ? 'bg-white text-black' : 'text-neutral-400 hover:text-white hover:bg-neutral-900'}`}>
            <AlertTriangle className="w-5 h-5" /> Churn Predictor
          </Link>
          <Link href="/super-admin/performance" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${pathname === '/super-admin/performance' ? 'bg-white text-black' : 'text-neutral-400 hover:text-white hover:bg-neutral-900'}`}>
            <TrendingUp className="w-5 h-5" /> Performance
          </Link>
          <Link href="/super-admin/tenants" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${pathname === '/super-admin/tenants' ? 'bg-white text-black' : 'text-neutral-400 hover:text-white hover:bg-neutral-900'}`}>
            <Users className="w-5 h-5" /> Customers
          </Link>
          <Link href="/super-admin/billing" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${pathname === '/super-admin/billing' ? 'bg-white text-black' : 'text-neutral-400 hover:text-white hover:bg-neutral-900'}`}>
            <Receipt className="w-5 h-5" /> Billing & Invoices
          </Link>
          <Link href="/super-admin/marketplace/products" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${pathname.startsWith('/super-admin/marketplace') ? 'bg-white text-black' : 'text-neutral-400 hover:text-white hover:bg-neutral-900'}`}>
            <Store className="w-5 h-5" /> Marketplace
          </Link>
          <Link href="/super-admin/support" className={`flex justify-between items-center px-4 py-3 rounded-xl font-medium transition-colors ${pathname.startsWith('/super-admin/support') ? 'bg-white text-black' : 'text-neutral-400 hover:text-white hover:bg-neutral-900'}`}>
            <div className="flex items-center gap-3">
              <LifeBuoy className="w-5 h-5" /> Support Tickets
            </div>
            {unreadSupportCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm animate-pulse">
                {unreadSupportCount}
              </span>
            )}
          </Link>
        </nav>

        <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors mt-auto w-full text-left">
          <LogOut className="w-5 h-5" /> Logout
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto text-neutral-900">
        {children}
      </div>
    </div>
  );
}

