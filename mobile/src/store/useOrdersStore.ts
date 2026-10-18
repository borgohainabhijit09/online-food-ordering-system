import { create } from 'zustand';
import { apiFetch } from '../services/api';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { SoundAlert } from '../services/soundAlert';

export interface OrderItemAddon {
  id: string;
  addonName?: string;
  name?: string;
  price: number;
}

export interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product?: {
    id?: string;
    name: string;
  };
  addons?: OrderItemAddon[];
}

export interface Order {
  id: string;
  orderNumber?: number;
  total: number;
  subtotal?: number;
  status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED' | string;
  orderType: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | string;
  paymentMethod: string;
  customerName?: string;
  customerPhone?: string;
  phone?: string;
  notes?: string;
  remarks?: string;
  createdAt: string;
  table?: {
    id: string;
    tableNumber: string;
  };
  items: OrderItem[];
}

export type TimeframeFilter = 'TODAY' | 'YESTERDAY' | '7_DAYS' | '30_DAYS' | 'ALL_TIME';

export interface RevenueMetrics {
  totalRevenue: number;
  ordersCount: number;
  cashRevenue: number;
  onlineRevenue: number;
  avgOrderValue: number;
}

export interface OperationalAlerts {
  delayedOrders: Order[];
  delayedCount: number;
  pendingCount: number;
  readyCount: number;
}

export function computeRevenueMetrics(orders: Order[], timeframe: TimeframeFilter): RevenueMetrics {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(startOfToday.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(startOfToday.getTime() - 30 * 24 * 60 * 60 * 1000);

  const filtered = orders.filter((o) => {
    if (o.status === 'CANCELLED') return false;
    const orderDate = new Date(o.createdAt);
    switch (timeframe) {
      case 'TODAY':
        return orderDate >= startOfToday;
      case 'YESTERDAY':
        return orderDate >= startOfYesterday && orderDate < startOfToday;
      case '7_DAYS':
        return orderDate >= sevenDaysAgo;
      case '30_DAYS':
        return orderDate >= thirtyDaysAgo;
      case 'ALL_TIME':
      default:
        return true;
    }
  });

  let totalRevenue = 0;
  let cashRevenue = 0;
  let onlineRevenue = 0;

  for (const o of filtered) {
    const amt = Number(o.total) || 0;
    totalRevenue += amt;
    const payMethod = (o.paymentMethod || '').toUpperCase();
    if (payMethod.includes('CASH') || payMethod.includes('COD')) {
      cashRevenue += amt;
    } else {
      onlineRevenue += amt;
    }
  }

  const ordersCount = filtered.length;
  const avgOrderValue = ordersCount > 0 ? Math.round(totalRevenue / ordersCount) : 0;

  return {
    totalRevenue,
    ordersCount,
    cashRevenue,
    onlineRevenue,
    avgOrderValue,
  };
}

export function computeOperationalAlerts(orders: Order[]): OperationalAlerts {
  const now = Date.now();
  const activeStatuses = ['PENDING', 'NEW', 'CONFIRMED', 'ACCEPTED', 'PREPARING'];

  const delayedOrders = orders.filter((o) => {
    if (!activeStatuses.includes(o.status)) return false;
    const createdTime = new Date(o.createdAt).getTime();
    return now - createdTime > 20 * 60 * 1000; // > 20 minutes
  });

  const pendingCount = orders.filter((o) => o.status === 'PENDING' || o.status === 'NEW').length;
  const readyCount = orders.filter((o) => o.status === 'READY').length;

  return {
    delayedOrders,
    delayedCount: delayedOrders.length,
    pendingCount,
    readyCount,
  };
}

interface OrdersState {
  orders: Order[];
  filterStatus: string;
  timeframe: TimeframeFilter;
  isLoading: boolean;
  isRefreshing: boolean;
  soundAlertEnabled: boolean;
  hasPendingAlarm: boolean;
  isKeepAwake: boolean;

  setFilterStatus: (status: string) => void;
  setTimeframe: (timeframe: TimeframeFilter) => void;
  fetchOrders: (tenantSlug?: string) => Promise<void>;
  updateOrderStatus: (orderId: string, status: string, tenantSlug?: string) => Promise<boolean>;
  createQuickOrder: (orderData: any, tenantSlug?: string) => Promise<any>;
  toggleSoundAlert: () => void;
  toggleKeepAwake: () => Promise<void>;
  triggerAlarm: () => Promise<void>;
  dismissAlarm: () => Promise<void>;
}

export const useOrdersStore = create<OrdersState>((set, get) => ({
  orders: [],
  filterStatus: 'ALL',
  timeframe: 'TODAY',
  isLoading: false,
  isRefreshing: false,
  soundAlertEnabled: true,
  hasPendingAlarm: false,
  isKeepAwake: false,

  setFilterStatus: (filterStatus) => set({ filterStatus }),
  setTimeframe: (timeframe) => set({ timeframe }),

  createQuickOrder: async (orderData: any, tenantSlug?: string) => {
    try {
      const res = await apiFetch<any>('/api/orders', {
        method: 'POST',
        tenantSlug,
        body: JSON.stringify(orderData),
      });
      // Refresh orders
      await get().fetchOrders(tenantSlug);
      return res;
    } catch (err: any) {
      console.error('Failed to create quick order:', err.message);
      throw err;
    }
  },

  toggleSoundAlert: () => {
    const next = !get().soundAlertEnabled;
    set({ soundAlertEnabled: next });
    if (!next) {
      get().dismissAlarm();
    }
  },

  toggleKeepAwake: async () => {
    const next = !get().isKeepAwake;
    if (next) {
      await activateKeepAwakeAsync();
    } else {
      deactivateKeepAwake();
    }
    set({ isKeepAwake: next });
  },

  triggerAlarm: async () => {
    const { soundAlertEnabled, hasPendingAlarm } = get();
    if (!soundAlertEnabled || hasPendingAlarm) return;

    set({ hasPendingAlarm: true });
    try {
      await SoundAlert.play();
    } catch (error) {
      console.warn('Could not trigger alarm:', error);
    }
  },

  dismissAlarm: async () => {
    try {
      SoundAlert.stop();
    } catch (err) {
      console.warn('Error stopping sound:', err);
    }
    set({ hasPendingAlarm: false });
  },

  fetchOrders: async (tenantSlug?: string) => {
    set({ isLoading: true });
    try {
      // Query with limit=100 so all active kitchen and live orders are retrieved
      const res = await apiFetch<any>('/api/orders?limit=100', { tenantSlug });
      const ordersList: Order[] = Array.isArray(res)
        ? res
        : Array.isArray(res?.orders)
        ? res.orders
        : [];

      const currentOrders = get().orders;

      // Check if there are newly arrived PENDING or NEW orders
      const isPendingStatus = (s: string) => s === 'PENDING' || s === 'NEW';
      const previousPendingIds = new Set(
        currentOrders.filter((o) => isPendingStatus(o.status)).map((o) => o.id)
      );
      const hasNewPending = ordersList.some(
        (o) => isPendingStatus(o.status) && !previousPendingIds.has(o.id)
      );

      if (hasNewPending && currentOrders.length > 0) {
        get().triggerAlarm();
      }

      set({ orders: ordersList, isLoading: false, isRefreshing: false });
    } catch (err: any) {
      console.warn('Failed to fetch orders:', err.message);
      set({ isLoading: false, isRefreshing: false });
    }
  },

  updateOrderStatus: async (orderId: string, status: string, tenantSlug?: string): Promise<boolean> => {
    try {
      // Normalize status to backend Prisma enum
      let backendStatus = status;
      if (status === 'CONFIRMED') backendStatus = 'ACCEPTED';
      if (status === 'PENDING') backendStatus = 'NEW';
      if (status === 'COMPLETED') backendStatus = 'SERVED';

      await apiFetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        tenantSlug,
        body: JSON.stringify({ status: backendStatus }),
      });

      // Update locally
      set({
        orders: get().orders.map((o) => (o.id === orderId ? { ...o, status: backendStatus as any } : o)),
      });

      // If no more pending/new orders, dismiss alarm
      const isPendingStatus = (s: string) => s === 'PENDING' || s === 'NEW';
      const remainingPending = get().orders.filter(
        (o) => isPendingStatus(o.status) && o.id !== orderId
      );
      if (remainingPending.length === 0) {
        get().dismissAlarm();
      }

      return true;
    } catch (err: any) {
      console.warn('Failed to update status:', err.message);
      return false;
    }
  },
}));
