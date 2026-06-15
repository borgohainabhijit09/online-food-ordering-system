'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Package, Inbox } from 'lucide-react';

export default function SuperAdminMarketplaceLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Marketplace Management</h2>
        <p className="text-sm text-neutral-500 mt-1">Manage products, services, and incoming purchase requests from restaurants.</p>
      </div>

      <div className="border-b border-neutral-200">
        <nav className="-mb-px flex space-x-8">
          <Link
            href="/super-admin/marketplace/products"
            className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              pathname.includes('/products')
                ? 'border-black text-black'
                : 'border-transparent text-neutral-500 hover:text-black hover:border-neutral-300'
            }`}
          >
            <Package className="w-4 h-4" /> Products & Services
          </Link>
          <Link
            href="/super-admin/marketplace/requests"
            className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              pathname.includes('/requests')
                ? 'border-black text-black'
                : 'border-transparent text-neutral-500 hover:text-black hover:border-neutral-300'
            }`}
          >
            <Inbox className="w-4 h-4" /> Incoming Requests
          </Link>
        </nav>
      </div>

      <div>
        {children}
      </div>
    </div>
  );
}
