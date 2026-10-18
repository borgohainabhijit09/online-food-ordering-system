import { create } from 'zustand';
import { apiFetch } from '../services/api';

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  basePrice: number;
  offerPrice?: number | null;
  isActive: boolean;
  dietaryPreference?: 'VEG' | 'NON_VEG' | 'VEGAN' | 'EGG';
  categoryId?: string;
  category?: {
    id: string;
    name: string;
  };
}

interface MenuStockState {
  products: MenuItem[];
  isLoading: boolean;
  searchQuery: string;
  selectedCategory: string;

  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string) => void;
  fetchProducts: (tenantSlug?: string) => Promise<void>;
  toggleProductStock: (productId: string, nextStatus: boolean, tenantSlug?: string) => Promise<boolean>;
}

export const useMenuStockStore = create<MenuStockState>((set, get) => ({
  products: [],
  isLoading: false,
  searchQuery: '',
  selectedCategory: 'ALL',

  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSelectedCategory: (selectedCategory) => set({ selectedCategory }),

  fetchProducts: async (tenantSlug?: string) => {
    try {
      set({ isLoading: true });
      const data = await apiFetch<any>('/api/products', { tenantSlug });
      const list: MenuItem[] = Array.isArray(data) ? data : data?.products || [];
      set({ products: list, isLoading: false });
    } catch (err: any) {
      console.warn('Could not fetch products for stock manager:', err.message);
      set({ isLoading: false });
    }
  },

  toggleProductStock: async (productId: string, nextStatus: boolean, tenantSlug?: string): Promise<boolean> => {
    // Optimistic UI update
    set({
      products: get().products.map((p) =>
        p.id === productId ? { ...p, isActive: nextStatus } : p
      ),
    });

    try {
      await apiFetch(`/api/products/${productId}/status`, {
        method: 'PATCH',
        tenantSlug,
        body: JSON.stringify({ isActive: nextStatus }),
      });
      return true;
    } catch (err: any) {
      // Revert on error
      set({
        products: get().products.map((p) =>
          p.id === productId ? { ...p, isActive: !nextStatus } : p
        ),
      });
      console.error('Failed to toggle product status:', err.message);
      return false;
    }
  },
}));
