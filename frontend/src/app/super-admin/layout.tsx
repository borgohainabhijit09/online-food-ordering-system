'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Users, LogOut, ShieldAlert, Receipt } from 'lucide-react';

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (pathname.includes('/login') || pathname.includes('/hidden-setup')) {
      setIsAuthorized(true);
      return;
    }

    const token = localStorage.getItem('adminToken');
    const isSuper = localStorage.getItem('superAdminMode');
    
    if (!token || isSuper !== 'true') {
      router.push('/super-admin/login');
    } else {
      setIsAuthorized(true);
    }
  }, [pathname]);

  if (!isAuthorized) return null;

  if (pathname.includes('/login') || pathname.includes('/hidden-setup')) {
    return <>{children}</>;
  }

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('superAdminMode');
    router.push('/super-admin/login');
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex font-sans">
      {/* Sidebar */}
      <div className="w-64 bg-black text-white p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-12">
          <ShieldAlert className="w-8 h-8 text-white" />
          <h1 className="font-bold text-xl tracking-tight">Super Admin</h1>
        </div>

        <nav className="flex-1 space-y-2">
          <Link href="/super-admin" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${pathname === '/super-admin' ? 'bg-white text-black' : 'text-neutral-400 hover:text-white hover:bg-neutral-900'}`}>
            <LayoutDashboard className="w-5 h-5" /> Dashboard
          </Link>
          <Link href="/super-admin/tenants" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${pathname === '/super-admin/tenants' ? 'bg-white text-black' : 'text-neutral-400 hover:text-white hover:bg-neutral-900'}`}>
            <Users className="w-5 h-5" /> Tenants
          </Link>
          <Link href="/super-admin/billing" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${pathname === '/super-admin/billing' ? 'bg-white text-black' : 'text-neutral-400 hover:text-white hover:bg-neutral-900'}`}>
            <Receipt className="w-5 h-5" /> Billing & Invoices
          </Link>
        </nav>

        <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors mt-auto w-full text-left">
          <LogOut className="w-5 h-5" /> Logout
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}
