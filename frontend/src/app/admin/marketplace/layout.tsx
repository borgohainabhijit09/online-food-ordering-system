'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Store, ShoppingBag } from 'lucide-react';

export default function AdminMarketplaceLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">Partner Marketplace</h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Discover services and supplies designed to help your restaurant grow.</p>
      </div>

      <div className="border-b border-neutral-200 dark:border-neutral-800">
        <nav className="-mb-px flex space-x-8">
          <Link
            href="/admin/marketplace/products"
            className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              pathname.includes('/products')
                ? 'border-orange-500 text-orange-600 dark:text-orange-500'
                : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:border-neutral-300 dark:hover:border-neutral-700'
            }`}
          >
            <Store className="w-4 h-4" /> Storefront
          </Link>
          <Link
            href="/admin/marketplace/requests"
            className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              pathname.includes('/requests')
                ? 'border-orange-500 text-orange-600 dark:text-orange-500'
                : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:border-neutral-300 dark:hover:border-neutral-700'
            }`}
          >
            <ShoppingBag className="w-4 h-4" /> My Requests
          </Link>
        </nav>
      </div>

      <div className="pb-12">
        {children}
      </div>
    </div>
  );
}
