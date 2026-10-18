import { create } from 'zustand';
import {
  CustomerProfile,
  getStoredProfile,
  setStoredProfile,
  getStoredDeliveryAddress,
  setStoredDeliveryAddress,
  getStoredSavedAddresses,
  setStoredSavedAddresses,
  fetchCustomerProfile,
  saveCustomerProfile,
} from '../services/api';

export interface SavedAddress {
  id: string;
  label: 'Home' | 'Work' | 'Other' | 'Current Location';
  address: string;
}

export interface CartAddon {
  id: string;
  name: string;
  price: number;
}

export interface CartVariant {
  id: string;
  name: string;
  price: number;
}

export interface CartItem {
  id: string; // unique cart line item id
  productId: string;
  name: string;
  price: number; // base or variant unit price
  quantity: number;
  dietaryPreference?: 'VEG' | 'NON_VEG' | 'VEGAN' | 'EGG';
  variant?: CartVariant | null;
  addons: CartAddon[];
  remarks?: string;
}

export interface RestaurantMeta {
  id: string;
  name: string;
  slug: string;
  deliveryFee: number;
  minOrder: number;
  phone?: string;
  logoUrl?: string;
}

export interface LoyaltyPass {
  tenantId: string;
  restaurantName: string;
  restaurantSlug: string;
  restaurantLogo?: string | null;
  points: number;
  pointValueInRupees: number;
  minimumPointsToRedeem: number;
}

export type OrderType = 'DELIVERY' | 'TAKEAWAY' | 'DINE_IN';

interface CustomerState {
  // Profile & Auth
  profile: CustomerProfile;
  isLoggedIn: boolean;
  loyaltyPasses: LoyaltyPass[];
  totalPastOrders: number;
  setProfile: (profile: Partial<CustomerProfile>) => void;
  loadStoredProfile: () => Promise<void>;
  loginWithPhone: (phone: string, name?: string) => Promise<{ success: boolean; isNew: boolean }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;

  // Addresses
  savedAddresses: SavedAddress[];
  selectedAddressId: string | null;
  deliveryAddress: string;
  setDeliveryAddress: (address: string, addressId?: string) => void;
  addSavedAddress: (label: 'Home' | 'Work' | 'Other', address: string) => void;
  removeSavedAddress: (id: string) => void;
  loadStoredAddresses: () => Promise<void>;

  // Cart
  cartRestaurant: RestaurantMeta | null;
  items: CartItem[];
  orderType: OrderType;
  tableNumber: string;
  couponCode: string | null;
  discountAmount: number;
  cookingInstructions: string;

  // Actions
  addItem: (
    restaurant: RestaurantMeta,
    product: { id: string; name: string; price: number; dietaryPreference?: any },
    variant?: CartVariant | null,
    addons?: CartAddon[]
  ) => { success: boolean; conflictRestaurant?: string };
  updateItemQuantity: (cartItemId: string, delta: number) => void;
  removeItem: (cartItemId: string) => void;
  clearCart: () => void;
  setOrderType: (type: OrderType) => void;
  setTableNumber: (table: string) => void;
  setCookingInstructions: (text: string) => void;
  // Coupon & Loyalty
  applyCoupon: (code: string, discount: number) => void;
  removeCoupon: () => void;
  isLoyaltyRedeemed: boolean;
  loyaltyDiscountAmount: number;
  redeemedLoyaltyPoints: number;
  setLoyaltyRedemption: (redeemed: boolean, discountAmount?: number, points?: number) => void;

  // Calculations
  getItemsSubtotal: () => number;
  getDeliveryFee: () => number;
  getGrandTotal: () => number;
  getItemCount: () => number;

  // Active / Tracked Orders
  trackedOrderIds: string[];
  addTrackedOrder: (orderId: string) => void;
}

export const useCustomerStore = create<CustomerState>((set, get) => ({
  profile: {
    name: '',
    phone: '',
    email: '',
    address: '',
  },
  isLoggedIn: false,
  loyaltyPasses: [],
  totalPastOrders: 0,

  setProfile: (updates) => {
    set((state) => {
      const newProfile = { ...state.profile, ...updates };
      setStoredProfile(newProfile);
      return {
        profile: newProfile,
        isLoggedIn: Boolean(newProfile.phone && newProfile.phone.replace(/\D/g, '').length >= 10),
      };
    });
  },

  loadStoredProfile: async () => {
    const saved = await getStoredProfile();
    if (saved && saved.phone && saved.phone.replace(/\D/g, '').length >= 10) {
      set({
        profile: saved,
        isLoggedIn: true,
      });
      if (saved.address && !get().deliveryAddress) {
        set({ deliveryAddress: saved.address });
      }
      // Background sync profile & loyalty & past addresses
      get().refreshProfile().catch(() => {});
    } else {
      set({ isLoggedIn: false });
    }
  },

  loginWithPhone: async (phone: string, optionalName?: string) => {
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (!cleanPhone || cleanPhone.length < 10) {
      return { success: false, isNew: false };
    }

    try {
      const remoteData = await fetchCustomerProfile(cleanPhone);
      const resolvedName = optionalName?.trim() || remoteData?.name || get().profile.name || 'Foodie';
      const resolvedAddress = remoteData?.addresses?.[0]?.address || get().deliveryAddress || '';

      const updatedProfile: CustomerProfile = {
        name: resolvedName,
        phone: cleanPhone,
        address: resolvedAddress,
      };

      await setStoredProfile(updatedProfile);

      // Merge saved addresses from backend with local addresses
      let mergedAddresses: SavedAddress[] = [...get().savedAddresses];
      if (remoteData?.addresses && remoteData.addresses.length > 0) {
        remoteData.addresses.forEach((addr) => {
          if (!mergedAddresses.some((m) => m.address.trim() === addr.address.trim())) {
            mergedAddresses.push({
              id: addr.id || Date.now().toString(),
              label: addr.label || 'Home',
              address: addr.address,
            });
          }
        });
      }

      set({
        profile: updatedProfile,
        isLoggedIn: true,
        deliveryAddress: resolvedAddress || get().deliveryAddress,
        savedAddresses: mergedAddresses,
        loyaltyPasses: remoteData?.loyalty || [],
        totalPastOrders: remoteData?.totalOrders || 0,
      });

      if (mergedAddresses.length > 0) {
        setStoredSavedAddresses(mergedAddresses).catch(() => {});
      }
      if (resolvedAddress) {
        setStoredDeliveryAddress(resolvedAddress).catch(() => {});
      }

      return {
        success: true,
        isNew: !remoteData || !remoteData.name,
      };
    } catch (err) {
      // Offline fallback: save phone locally so user is still authenticated
      const localProfile: CustomerProfile = {
        name: optionalName?.trim() || get().profile.name || 'Foodie',
        phone: cleanPhone,
        address: get().deliveryAddress || '',
      };
      await setStoredProfile(localProfile);
      set({ profile: localProfile, isLoggedIn: true });
      return { success: true, isNew: true };
    }
  },

  logout: async () => {
    const emptyProfile: CustomerProfile = {
      name: '',
      phone: '',
      address: '',
    };
    await setStoredProfile(emptyProfile);
    set({
      profile: emptyProfile,
      isLoggedIn: false,
      loyaltyPasses: [],
      totalPastOrders: 0,
    });
  },

  refreshProfile: async () => {
    const phone = get().profile.phone;
    if (!phone) return;
    try {
      const remoteData = await fetchCustomerProfile(phone);
      if (remoteData) {
        set((state) => ({
          loyaltyPasses: remoteData.loyalty || [],
          totalPastOrders: remoteData.totalOrders || state.totalPastOrders,
          profile: {
            ...state.profile,
            name: state.profile.name || remoteData.name || 'Foodie',
          },
        }));
      }
    } catch {}
  },

  savedAddresses: [],
  selectedAddressId: null,
  deliveryAddress: '',
  setDeliveryAddress: (address, addressId) => {
    set({ deliveryAddress: address, selectedAddressId: addressId || null });
    setStoredDeliveryAddress(address);
  },
  addSavedAddress: (label, address) => {
    const id = Date.now().toString();
    const newAddr: SavedAddress = { id, label, address };
    const updated = [newAddr, ...get().savedAddresses.filter((a) => a.address !== address)];
    set({ savedAddresses: updated, deliveryAddress: address, selectedAddressId: id });
    setStoredDeliveryAddress(address);
    setStoredSavedAddresses(updated);
  },
  removeSavedAddress: (id) => {
    const updated = get().savedAddresses.filter((a) => a.id !== id);
    set({ savedAddresses: updated });
    setStoredSavedAddresses(updated);
  },
  loadStoredAddresses: async () => {
    try {
      const [savedAddr, savedList] = await Promise.all([
        getStoredDeliveryAddress(),
        getStoredSavedAddresses(),
      ]);
      if (savedList && Array.isArray(savedList)) {
        set({ savedAddresses: savedList });
      }
      if (savedAddr) {
        set({ deliveryAddress: savedAddr });
      }
    } catch {
      // Ignore
    }
  },

  cartRestaurant: null,
  items: [],
  orderType: 'DELIVERY',
  tableNumber: '',
  couponCode: null,
  discountAmount: 0,
  cookingInstructions: '',
  isLoyaltyRedeemed: false,
  loyaltyDiscountAmount: 0,
  redeemedLoyaltyPoints: 0,

  addItem: (restaurant, product, variant, addons = []) => {
    const state = get();

    // Check if cart already has items from another restaurant
    if (state.cartRestaurant && state.cartRestaurant.slug !== restaurant.slug && state.items.length > 0) {
      return { success: false, conflictRestaurant: state.cartRestaurant.name };
    }

    const rawBase = (product as any).offerPrice ?? (product.price || (product as any).basePrice || 0);
    const unitPrice = variant ? (variant.price || (variant as any).offerPrice || rawBase) : rawBase;
    const addonsKey = addons.map((a) => a.id).sort().join('-');
    const cartItemId = `${product.id}_${variant ? variant.id : 'base'}_${addonsKey}`;

    const existingIndex = state.items.findIndex((item) => item.id === cartItemId);

    if (existingIndex >= 0) {
      const updated = [...state.items];
      updated[existingIndex].quantity += 1;
      set({ items: updated, cartRestaurant: restaurant });
    } else {
      const newItem: CartItem = {
        id: cartItemId,
        productId: product.id,
        name: product.name,
        price: unitPrice,
        quantity: 1,
        dietaryPreference: product.dietaryPreference || 'VEG',
        variant: variant || null,
        addons: addons || [],
      };
      set({
        items: [...state.items, newItem],
        cartRestaurant: restaurant,
      });
    }

    return { success: true };
  },

  updateItemQuantity: (cartItemId, delta) => {
    const state = get();
    const updated = state.items
      .map((item) => {
        if (item.id === cartItemId) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      })
      .filter(Boolean) as CartItem[];

    set({
      items: updated,
      cartRestaurant: updated.length === 0 ? null : state.cartRestaurant,
      couponCode: updated.length === 0 ? null : state.couponCode,
      discountAmount: updated.length === 0 ? 0 : state.discountAmount,
      isLoyaltyRedeemed: updated.length === 0 ? false : state.isLoyaltyRedeemed,
      loyaltyDiscountAmount: updated.length === 0 ? 0 : state.loyaltyDiscountAmount,
      redeemedLoyaltyPoints: updated.length === 0 ? 0 : state.redeemedLoyaltyPoints,
    });
  },

  removeItem: (cartItemId) => {
    const state = get();
    const updated = state.items.filter((item) => item.id !== cartItemId);
    set({
      items: updated,
      cartRestaurant: updated.length === 0 ? null : state.cartRestaurant,
      couponCode: updated.length === 0 ? null : state.couponCode,
      discountAmount: updated.length === 0 ? 0 : state.discountAmount,
      isLoyaltyRedeemed: updated.length === 0 ? false : state.isLoyaltyRedeemed,
      loyaltyDiscountAmount: updated.length === 0 ? 0 : state.loyaltyDiscountAmount,
      redeemedLoyaltyPoints: updated.length === 0 ? 0 : state.redeemedLoyaltyPoints,
    });
  },

  clearCart: () => {
    set({
      items: [],
      cartRestaurant: null,
      couponCode: null,
      discountAmount: 0,
      tableNumber: '',
      cookingInstructions: '',
      isLoyaltyRedeemed: false,
      loyaltyDiscountAmount: 0,
      redeemedLoyaltyPoints: 0,
    });
  },

  setOrderType: (type) => set({ orderType: type }),
  setTableNumber: (table) => set({ tableNumber: table, orderType: 'DINE_IN' }),
  setCookingInstructions: (text) => set({ cookingInstructions: text }),

  applyCoupon: (code, discount) => set({ couponCode: code, discountAmount: discount }),
  removeCoupon: () => set({ couponCode: null, discountAmount: 0 }),
  setLoyaltyRedemption: (redeemed, discount = 0, points = 0) =>
    set({
      isLoyaltyRedeemed: redeemed,
      loyaltyDiscountAmount: redeemed ? discount : 0,
      redeemedLoyaltyPoints: redeemed ? points : 0,
    }),

  getItemsSubtotal: () => {
    const { items } = get();
    return items.reduce((sum, item) => {
      const addonsTotal = item.addons.reduce((a, addon) => a + addon.price, 0);
      return sum + (item.price + addonsTotal) * item.quantity;
    }, 0);
  },

  getDeliveryFee: () => {
    const { orderType, cartRestaurant, getItemsSubtotal } = get();
    if (orderType !== 'DELIVERY' || !cartRestaurant) return 0;
    const subtotal = getItemsSubtotal();
    if (cartRestaurant.minOrder > 0 && subtotal >= cartRestaurant.minOrder) {
      return 0; // Free delivery threshold
    }
    return cartRestaurant.deliveryFee || 0;
  },

  getGrandTotal: () => {
    const subtotal = get().getItemsSubtotal();
    const delivery = get().getDeliveryFee();
    const discount = get().discountAmount;
    const loyaltyDiscount = get().isLoyaltyRedeemed ? get().loyaltyDiscountAmount : 0;
    return Math.max(0, subtotal + delivery - discount - loyaltyDiscount);
  },

  getItemCount: () => {
    const { items } = get();
    return items.reduce((sum, item) => sum + item.quantity, 0);
  },

  trackedOrderIds: [],
  addTrackedOrder: (orderId) => {
    set((state) => ({
      trackedOrderIds: [orderId, ...state.trackedOrderIds.filter((id) => id !== orderId)].slice(0, 10),
    }));
  },
}));
