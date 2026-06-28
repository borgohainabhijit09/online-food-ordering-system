'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, ShoppingBag, ListOrdered, Settings, LogOut, Plus, Loader2, Copy, ExternalLink, CheckCircle2, Tag, Menu, X, Users, Grid, LifeBuoy, Store, ChefHat, Award, Receipt, Boxes, BrainCircuit, TrendingUp, BarChart3, Lock, UserCog, CalendarDays } from 'lucide-react';
import { OrderNotification } from '../../components/OrderNotification';
import { apiClient } from '../../lib/apiClient';
import { SubscriptionProvider, useSubscription } from '../../components/SubscriptionContext';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SubscriptionProvider>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </SubscriptionProvider>
  );
}

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [tenantSlug, setTenantSlug] = useState('');
  const [copied, setCopied] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [settings, setSettings] = useState<any>(null);
  
  // Store switcher state
  const [availableStores, setAvailableStores] = useState<any[]>([]);
  const [isSwitching, setIsSwitching] = useState(false);
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const [unreadSupportCount, setUnreadSupportCount] = useState(0);

  // RBAC state
  const [userRole, setUserRole] = useState('ADMIN');
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [userName, setUserName] = useState('');

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

    // We do not clear superAdminMode here because it breaks the Super Admin session 
    // if the user has both panels open in different tabs.

    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
      return null;
    };

    const cookieToken = getCookie('adminToken');
    const token = sessionStorage.getItem('impersonatedToken') || localStorage.getItem('adminToken') || cookieToken;
    
    if (!token) {
      if (pathname !== '/admin/login') router.push('/admin/login');
      setIsLoading(false);
      return;
    }

    // Sync cookie token back to localStorage if it was wiped
    if (token && token === cookieToken && !localStorage.getItem('adminToken') && !sessionStorage.getItem('impersonatedToken')) {
      localStorage.setItem('adminToken', token);
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));

      // A SUPER_ADMIN token in adminToken is a leftover — remove it and send to login
      if (payload.role === 'SUPER_ADMIN') {
        localStorage.removeItem('adminToken');
        if (pathname !== '/admin/login') router.push('/admin/login');
        return;
      }

      // Regular users without a selected store should re-login
      if (!payload.tenantId && !payload.tenantSlug) {
        router.push('/admin/login');
        return;
      }

      // Valid tenant session — proceed
      if (payload.tenantSlug) setTenantSlug(payload.tenantSlug);
      setUserRole(payload.role || 'ADMIN');
      setUserPermissions(payload.permissions || []);
      setUserName(payload.name || 'User');
      setIsAuthenticated(true);

      // Fetch Settings and Stores
      const fetchInitialData = async () => {
        try {
          const [settingsRes, storesRes] = await Promise.all([
            apiClient.get('/api/settings'),
            apiClient.get('/api/auth/me/stores')
          ]);
          
          if (settingsRes.ok) {
            setSettings(await settingsRes.json());
          }
          if (storesRes.ok) {
            const myStores = await storesRes.json();
            setAvailableStores(myStores);

            if (myStores.length > 0) {
              // Only set default if we don't already have one from the JWT
              setTenantSlug(prev => prev || myStores[0].slug);
            }

            const currentStore = myStores.find((s: any) => s.slug === payload.tenantSlug);
            if (currentStore) {
              setUserRole(currentStore.role);
              setUserPermissions(currentStore.permissions || []);
            }
          }
          fetchCounts();
        } catch (e) {}
      };
      fetchInitialData();

      setIsLoading(false);
    } catch (e) {
      // Token is malformed
      router.push('/admin/login');
      return;
    }
  }, [pathname, router]);

  // Separate effect for polling — does NOT depend on pathname,
  // so it persists across navigation instead of restarting every page change.
  useEffect(() => {
    if (!isAuthenticated) return;
    fetchCounts();
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const { hasFeature } = useSubscription();

  const fetchCounts = async () => {
    try {
      const [ordersRes, supportRes] = await Promise.all([
        apiClient.get('/api/orders/new-count'),
        apiClient.get('/api/support/unread-count')
      ]);
      if (ordersRes.ok) {
        const data = await ordersRes.json();
        setNewOrdersCount(data.count || 0);
      }
      if (supportRes.ok) {
        const data = await supportRes.json();
        setUnreadSupportCount(data.count || 0);
      } else {
        const errData = await supportRes.json().catch(() => ({}));
        console.error('Support unread count error:', errData);
      }
    } catch (error) {
      console.error('Failed to fetch notification counts', error);
    }
  };

  const hasPermission = (perm: string) => {
    if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') return true;
    return userPermissions.includes(perm);
  };

  const handleSwitchStore = async (newTenantId: string) => {
    setIsSwitching(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/select-store`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ tenantId: newTenantId })
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('adminToken', data.token);
        document.cookie = `adminToken=${data.token}; path=/; max-age=604800; SameSite=Lax`;
        window.location.reload(); // Reload the whole app to clear React state and fetch new store data
      }
    } catch (e) {
      console.error('Failed to switch store', e);
    } finally {
      setIsSwitching(false);
    }
  };

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
      <aside className={`fixed inset-y-0 left-0 z-50 w-56 bg-white dark:bg-neutral-950 border-r border-neutral-200 dark:border-neutral-800 flex flex-col transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4 flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-2">
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
              <nav className="flex-1 px-4 space-y-6 mt-4 overflow-y-auto pb-4">
          
          {/* Overview Group */}
          <div>
            <div className="text-[10px] font-bold uppercase text-neutral-400 mb-2 px-2 tracking-wider">Overview</div>
            <div className="space-y-1">
              {hasPermission('dashboard.view') && (
                <Link href="/admin" className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${pathname === '/admin' ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-500 font-medium' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400'}`}>
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>
              )}
              
              {hasPermission('orders.view') && (
                <Link href="/admin/orders" className={`flex justify-between items-center px-3 py-2 text-sm rounded-lg transition-colors ${pathname === '/admin/orders' ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-500 font-medium' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400'}`}>
                  <div className="flex items-center gap-2">
                    <ListOrdered className="w-4 h-4" />
                    <span>Orders</span>
                  </div>
                {newOrdersCount > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm animate-pulse">
                    {newOrdersCount}
                  </span>
                )}
              </Link>
              )}
              
              {hasPermission('kitchen.view') && (
                <Link href="/admin/kot" className={`flex justify-between items-center px-3 py-2 text-sm rounded-lg transition-colors ${pathname === '/admin/kot' ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-500 font-medium' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400'}`}>
                  <div className="flex items-center gap-2">
                    <ChefHat className="w-4 h-4" />
                    <span>Kitchen (KOT)</span>
                  </div>
                {newOrdersCount > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm animate-pulse">
                    {newOrdersCount}
                  </span>
                )}
              </Link>
              )}
              
              {hasPermission('orders.view') && (
                <Link href="/admin/tables" className={`flex justify-between items-center px-3 py-2 text-sm rounded-lg transition-colors ${pathname === '/admin/tables' ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-500 font-medium' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400'}`}>
                  <div className="flex items-center gap-2">
                    <Grid className="w-4 h-4" />
                    <span>Tables</span>
                  </div>
                {!hasFeature('RESERVATIONS') && <Lock className="w-3 h-3 text-neutral-400 shrink-0" />}
              </Link>
              )}

              {hasPermission('reports.view') && (
                <Link href="/admin/analytics" className={`flex justify-between items-center px-3 py-2 text-sm rounded-lg transition-colors ${pathname === '/admin/analytics' ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-500 font-medium' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400'}`}>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    <span>Advanced Analytics</span>
                  </div>
                {!hasFeature('ADVANCED_ANALYTICS') && <Lock className="w-3 h-3 text-neutral-400 shrink-0" />}
              </Link>
              )}

              {hasPermission('reports.view') && (
                <Link href="/admin/billing" className={`flex justify-between items-center px-3 py-2 text-sm rounded-lg transition-colors ${pathname === '/admin/billing' ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-500 font-medium' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400'}`}>
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4" />
                    <span>Sales & Billing</span>
                  </div>
                {!hasFeature('BILLING') && <Lock className="w-3 h-3 text-neutral-400 shrink-0" />}
              </Link>
              )}
            </div>
          </div>

          {/* Menu Management Group */}
          {hasPermission('menu.manage') || hasPermission('inventory.manage') ? (
            <div>
              <div className="text-[10px] font-bold uppercase text-neutral-400 mb-2 px-2 tracking-wider">Menu Management</div>
              <div className="space-y-1">
                {hasPermission('menu.manage') && (
                  <>
                    <Link href="/admin/categories" className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${pathname === '/admin/categories' ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-500 font-medium' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400'}`}>
                      <LayoutDashboard className="w-4 h-4" />
                      <span>Categories</span>
                    </Link>
                    <Link href="/admin/products" className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${pathname === '/admin/products' ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-500 font-medium' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400'}`}>
                      <ShoppingBag className="w-4 h-4" />
                      <span>Products</span>
                    </Link>
                    <Link href="/admin/addons" className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${pathname === '/admin/addons' ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-500 font-medium' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400'}`}>
                      <Plus className="w-4 h-4" />
                      <span>Addons</span>
                    </Link>
                  </>
                )}
                
                {hasPermission('inventory.manage') && (
                  <>
                    <Link href="/admin/inventory" className={`flex justify-between items-center px-3 py-2 text-sm rounded-lg transition-colors ${pathname === '/admin/inventory' ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-500 font-medium' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400'}`}>
                      <div className="flex items-center gap-2">
                        <Boxes className="w-4 h-4" />
                        <span>Recipe Inventory</span>
                      </div>
                      {!hasFeature('INVENTORY') && <Lock className="w-3 h-3 text-neutral-400 shrink-0" />}
                    </Link>

                    <Link href="/admin/ai-recipe" className={`flex justify-between items-center px-3 py-2 text-sm rounded-lg transition-colors ${pathname === '/admin/ai-recipe' ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-500 font-medium' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400'}`}>
                      <div className="flex items-center gap-2">
                        <BrainCircuit className="w-4 h-4" />
                        <span>AI Recipe Suggestions</span>
                      </div>
                      {!hasFeature('AI_RECIPE_SUGGESTIONS') && <Lock className="w-3 h-3 text-neutral-400 shrink-0" />}
                    </Link>

                    <Link href="/admin/consumption-forecast" className={`flex justify-between items-center px-3 py-2 text-sm rounded-lg transition-colors ${pathname === '/admin/consumption-forecast' ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-500 font-medium' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400'}`}>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        <span>Consumption Forecast</span>
                      </div>
                      {!hasFeature('CONSUMPTION_FORECAST') && <Lock className="w-3 h-3 text-neutral-400 shrink-0" />}
                    </Link>
                  </>
                )}
              </div>
            </div>
          ) : null}

          {/* Growth & Sales Group */}
          {hasPermission('customers.manage') ? (
            <div>
              <div className="text-[10px] font-bold uppercase text-neutral-400 mb-2 px-2 tracking-wider">Growth & Sales</div>
              <div className="space-y-1">
                <Link href="/admin/customers" className={`flex justify-between items-center px-3 py-2 text-sm rounded-lg transition-colors ${pathname === '/admin/customers' ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-500 font-medium' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400'}`}>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>Customers</span>
                  </div>
                {!hasFeature('CUSTOMER_CRM') && <Lock className="w-3 h-3 text-neutral-400 shrink-0" />}
              </Link>
              <Link href="/admin/coupons" className={`flex justify-between items-center px-3 py-2 text-sm rounded-lg transition-colors ${pathname === '/admin/coupons' ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-500 font-medium' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400'}`}>
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  <span>Coupons</span>
                </div>
                {!hasFeature('COUPONS') && <Lock className="w-3 h-3 text-neutral-400 shrink-0" />}
              </Link>

              <Link href="/admin/marketplace/products" className={`flex justify-between items-center px-3 py-2 text-sm rounded-lg transition-colors ${pathname.startsWith('/admin/marketplace') ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-500 font-medium' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400'}`}>
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4" />
                  <span>Marketplace</span>
                </div>
                {!hasFeature('MARKETPLACE') && <Lock className="w-3 h-3 text-neutral-400 shrink-0" />}
              </Link>

              <Link href="/admin/marketing-calendar" className={`flex justify-between items-center px-3 py-2 text-sm rounded-lg transition-colors ${pathname.startsWith('/admin/marketing-calendar') ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-500 font-medium' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400'}`}>
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4" />
                  <span>Content Calendar</span>
                </div>
              </Link>
            </div>
          </div>
          ) : null}

          {/* System Group */}
          <div>
            <div className="text-[10px] font-bold uppercase text-neutral-400 mb-2 px-2 tracking-wider">System</div>
            <div className="space-y-1">
              {hasPermission('settings.manage') && (
                <Link href="/admin/staff" className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${pathname === '/admin/staff' ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-500 font-medium' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400'}`}>
                  <UserCog className="w-4 h-4" />
                  <span>Staff & Roles</span>
                </Link>
              )}
              {hasPermission('settings.manage') && (
                <Link href="/admin/settings" className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${pathname === '/admin/settings' ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-500 font-medium' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400'}`}>
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </Link>
              )}
              <Link href="/admin/support" className={`flex justify-between items-center px-3 py-2 text-sm rounded-lg transition-colors ${pathname.startsWith('/admin/support') ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-500 font-medium' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400'}`}>
                <div className="flex items-center gap-2">
                  <LifeBuoy className="w-4 h-4" />
                  <span>Support</span>
                </div>
                {unreadSupportCount > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm animate-pulse">
                    {unreadSupportCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </nav>
        
        <div className="p-3 border-t border-neutral-200 dark:border-neutral-800 space-y-2">
          {tenantSlug && (
            <div className="bg-neutral-50 dark:bg-neutral-900 rounded-lg p-3 border border-neutral-200 dark:border-neutral-800">
              <p className="text-[10px] font-bold uppercase text-neutral-400 mb-1.5 tracking-wider">Your Store Link</p>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300 truncate flex-1">/{tenantSlug}</span>
                <button onClick={handleCopyLink} className="p-1.5 text-neutral-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded transition-colors shrink-0" title="Copy link">
                  {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <a href={`/${tenantSlug}`} target="_blank" rel="noopener noreferrer" className="p-1.5 text-neutral-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded transition-colors shrink-0" title="Visit store">
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}
          <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2 w-full text-left text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-colors">
            <LogOut className="w-4 h-4" />
            <span className="font-medium">Log out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden w-full">
        {/* Top Header */}
        <header className="h-14 flex items-center px-4 bg-white dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800 shrink-0 gap-2">
          {/* Left: Hamburger + Admin (mobile only) */}
          <div className="flex items-center gap-2 md:hidden shrink-0">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 -ml-2 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>

          {/* Center: Store URL */}
          {tenantSlug && (
            <div className="hidden sm:flex items-center gap-1 md:gap-2 bg-neutral-100 dark:bg-neutral-900 py-1 md:py-1.5 px-2 md:px-3 rounded-full border border-neutral-200 dark:border-neutral-800 text-xs md:text-sm min-w-0">
              <span className="hidden md:inline text-neutral-500 dark:text-neutral-400 shrink-0">Store URL:</span>
              <a href={`/${tenantSlug}`} target="_blank" rel="noopener noreferrer" className="font-medium hover:text-orange-600 transition-colors flex items-center gap-1 min-w-0">
                <span className="truncate">/{tenantSlug}</span> <ExternalLink className="w-3 h-3 md:w-3.5 md:h-3.5 shrink-0" />
              </a>
              <button onClick={handleCopyLink} className="ml-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors shrink-0" title="Copy link">
                {copied ? <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4 text-emerald-500" /> : <Copy className="w-3 h-3 md:w-4 md:h-4" />}
              </button>
            </div>
          )}

          {/* Right: Store Switcher + Avatar */}
          <div className="ml-auto flex items-center gap-2 md:gap-4 shrink-0">
            {/* Mobile-only: small store link icon */}
            {tenantSlug && (
              <a href={`/${tenantSlug}`} target="_blank" rel="noopener noreferrer" className="sm:hidden p-2 text-neutral-500 hover:text-orange-600 transition-colors" title={`Visit /${tenantSlug}`}>
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
            {availableStores.length > 1 && (
              <div className="relative flex items-center">
                {isSwitching && <Loader2 className="w-4 h-4 mr-2 animate-spin text-orange-500 absolute -left-6" />}
                {hasFeature('MULTI_BRANCH') ? (
                  <select
                    disabled={isSwitching}
                    className="bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs md:text-sm rounded-lg px-2 md:px-3 py-1.5 outline-none focus:ring-2 focus:ring-orange-500 max-w-[120px] md:max-w-none"
                    value={availableStores.find(s => s.slug === tenantSlug)?.id || ''}
                    onChange={(e) => handleSwitchStore(e.target.value)}
                  >
                    {availableStores.map(store => (
                      <option key={store.id} value={store.id}>
                        {store.businessName}
                      </option>
                    ))}
                  </select>
                ) : (
                  <select
                    disabled={true}
                    className="bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs md:text-sm rounded-lg px-2 md:px-3 py-1.5 outline-none opacity-60 cursor-not-allowed max-w-[120px] md:max-w-none"
                    value={availableStores.find(s => s.slug === tenantSlug)?.id || ''}
                  >
                    <option value={availableStores.find(s => s.slug === tenantSlug)?.id || ''}>
                      {availableStores.find(s => s.slug === tenantSlug)?.businessName || 'Store'} (🔒 Upgrade for Multi-Branch)
                    </option>
                  </select>
                )}
              </div>
            )}
            <div className="flex items-center gap-2 md:gap-3 shrink-0 ml-2">
              <span className="hidden sm:inline-block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Welcome, {userName}
              </span>
              <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold shrink-0 text-sm shadow-sm border border-orange-200 dark:border-orange-900/50">
                {userName ? userName.charAt(0).toUpperCase() : 'U'}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-4 pb-24 md:pb-4">
          {children}
        </div>
        <OrderNotification />
      </main>
    </div>
  );
}
