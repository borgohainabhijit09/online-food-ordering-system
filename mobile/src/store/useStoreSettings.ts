import { create } from 'zustand';
import { apiFetch } from '../services/api';

interface StoreSettingsState {
  isAcceptingOrders: boolean;
  restaurantName: string;
  isLoading: boolean;
  fetchSettings: (tenantSlug?: string) => Promise<void>;
  toggleStoreStatus: (tenantSlug?: string) => Promise<boolean>;
}

export const useStoreSettings = create<StoreSettingsState>((set, get) => ({
  isAcceptingOrders: true,
  restaurantName: '',
  isLoading: false,

  fetchSettings: async (tenantSlug?: string) => {
    try {
      set({ isLoading: true });
      const data = await apiFetch<any>('/api/settings', { tenantSlug });
      set({
        isAcceptingOrders: data?.isAcceptingOrders !== undefined ? Boolean(data.isAcceptingOrders) : true,
        restaurantName: data?.restaurantName || '',
        isLoading: false,
      });
    } catch (err: any) {
      console.warn('Could not load store settings:', err.message);
      set({ isLoading: false });
    }
  },

  toggleStoreStatus: async (tenantSlug?: string): Promise<boolean> => {
    const nextStatus = !get().isAcceptingOrders;
    // Optimistic update
    set({ isAcceptingOrders: nextStatus });
    try {
      await apiFetch('/api/settings', {
        method: 'PUT',
        tenantSlug,
        body: JSON.stringify({ isAcceptingOrders: nextStatus }),
      });
      return true;
    } catch (err: any) {
      // Revert on failure
      set({ isAcceptingOrders: !nextStatus });
      console.warn('Failed to toggle store status:', err.message);
      return false;
    }
  },
}));
