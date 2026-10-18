import { create } from 'zustand';
import {
  apiFetch,
  getStoredToken,
  setStoredToken,
  clearStoredToken,
  getStoredActiveStore,
  setStoredActiveStore,
  clearStoredActiveStore,
} from '../services/api';

export interface StoreInfo {
  id: string;
  slug: string;
  businessName: string;
  role: string;
  permissions?: string[];
}

export interface UserInfo {
  id: string;
  name: string;
  phone: string;
  role: string;
  tenantId?: string;
  tenantSlug?: string;
  permissions?: string[];
}

function decodeJwtPayload(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    let decodedStr = '';
    if (typeof atob === 'function') {
      decodedStr = atob(base64);
    } else {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
      const str = base64.replace(/=+$/, '');
      let output = '';
      for (
        let bc = 0, bs = 0, buffer, idx = 0;
        (buffer = str.charAt(idx++));
        ~buffer && ((bs = bc % 4 ? bs * 64 + buffer : buffer), bc++ % 4)
          ? (output += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6))))
          : 0
      ) {
        buffer = chars.indexOf(buffer);
      }
      decodedStr = output;
    }
    return JSON.parse(decodedStr);
  } catch (err) {
    return null;
  }
}

interface AuthState {
  token: string | null;
  partialToken: string | null;
  user: UserInfo | null;
  stores: StoreInfo[];
  activeStore: StoreInfo | null;
  isLoading: boolean;
  requiresStoreSelection: boolean;
  error: string | null;

  restoreSession: () => Promise<void>;
  login: (phone: string, pass: string) => Promise<boolean>;
  selectStore: (storeId: string) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  partialToken: null,
  user: null,
  stores: [],
  activeStore: null,
  isLoading: false,
  requiresStoreSelection: false,
  error: null,

  clearError: () => set({ error: null }),

  restoreSession: async () => {
    set({ isLoading: true, error: null });
    try {
      const token = await getStoredToken();
      if (!token) {
        set({ token: null, user: null, activeStore: null, isLoading: false });
        return;
      }

      // Check cached active store first so UI immediately knows the branch
      const cachedStore = await getStoredActiveStore();
      const decoded = decodeJwtPayload(token);
      const userFromToken: UserInfo | null = decoded
        ? {
            id: decoded.id,
            name: decoded.name,
            phone: decoded.phone,
            role: decoded.role,
            tenantId: decoded.tenantId,
            tenantSlug: decoded.tenantSlug,
            permissions: decoded.permissions || [],
          }
        : null;

      if (cachedStore || userFromToken) {
        set({
          token,
          user: userFromToken,
          activeStore: cachedStore,
        });
      }

      // Fetch stores list from backend with timeout
      try {
        const res = await apiFetch<any>('/api/auth/me/stores', { timeoutMs: 8000 });
        const stores: StoreInfo[] = Array.isArray(res) ? res : res?.stores || [];

        // Pick active store: match user's tenantId/tenantSlug, or cachedStore, or first store
        let active =
          stores.find(
            (s) =>
              s.id === userFromToken?.tenantId ||
              s.slug === userFromToken?.tenantSlug ||
              s.id === cachedStore?.id
          ) ||
          cachedStore ||
          (stores.length > 0 ? stores[0] : null);

        if (active) {
          await setStoredActiveStore(active);
        }

        set({
          token,
          stores,
          activeStore: active,
          user: userFromToken || (res.user ? res.user : null),
          isLoading: false,
        });
      } catch (networkErr: any) {
        console.warn('Network fetch of stores failed, continuing with cached session:', networkErr.message);
        set({
          token,
          user: userFromToken,
          activeStore: cachedStore,
          isLoading: false,
        });
      }
    } catch (err: any) {
      console.warn('Session restoration failed:', err.message);
      await clearStoredToken();
      await clearStoredActiveStore();
      set({ token: null, user: null, activeStore: null, isLoading: false });
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (phone: string, password: string): Promise<boolean> => {
    set({ isLoading: true, error: null });
    try {
      const data = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ phone, password }),
      });

      if (data.requiresStoreSelection) {
        set({
          partialToken: data.partialToken,
          requiresStoreSelection: true,
          stores: data.stores || [],
          user: data.user,
          isLoading: false,
        });
        return false;
      }

      const activeStore = data.stores && data.stores.length > 0 ? data.stores[0] : null;
      await setStoredToken(data.token);
      if (activeStore) {
        await setStoredActiveStore(activeStore);
      }

      set({
        token: data.token,
        user: data.user,
        stores: data.stores || [],
        activeStore: activeStore,
        requiresStoreSelection: false,
        isLoading: false,
      });
      return true;
    } catch (err: any) {
      set({ error: err.message || 'Login failed', isLoading: false });
      return false;
    }
  },

  selectStore: async (storeId: string): Promise<boolean> => {
    const { partialToken, stores } = get();
    set({ isLoading: true, error: null });
    try {
      const data = await apiFetch('/api/auth/select-store', {
        method: 'POST',
        headers: partialToken ? { Authorization: `Bearer ${partialToken}` } : {},
        body: JSON.stringify({ tenantId: storeId }),
      });

      const selected =
        stores.find((s) => s.id === storeId) ||
        data.selectedStore ||
        (data.user?.tenantId
          ? {
              id: data.user.tenantId,
              slug: data.user.tenantSlug,
              businessName: data.user.name,
              role: data.user.role,
            }
          : null);

      await setStoredToken(data.token);
      if (selected) {
        await setStoredActiveStore(selected);
      }

      set({
        token: data.token,
        user: data.user,
        activeStore: selected,
        requiresStoreSelection: false,
        partialToken: null,
        isLoading: false,
      });
      return true;
    } catch (err: any) {
      set({ error: err.message || 'Store selection failed', isLoading: false });
      return false;
    }
  },

  logout: async () => {
    await clearStoredToken();
    await clearStoredActiveStore();
    set({
      token: null,
      partialToken: null,
      user: null,
      stores: [],
      activeStore: null,
      requiresStoreSelection: false,
      error: null,
    });
  },
}));

