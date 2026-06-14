import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string; // unique generated ID for cart entry
  productId: string;
  name: string;
  price: number;
  quantity: number;
  variant?: {
    id: string;
    name: string;
    price: number;
  };
  addons: Array<{
    id: string;
    name: string;
    price: number;
  }>;
}

export interface AppliedCoupon {
  code: string;
  type: 'PERCENTAGE' | 'FLAT';
  discountAmount: number;
  finalAmount: number;
}

export type OrderType = 'DELIVERY' | 'TAKEAWAY' | 'DINE_IN';

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'id'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  remarks: string;
  setRemarks: (remarks: string) => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
  clearCart: () => void;
  appliedCoupon: AppliedCoupon | null;
  applyCoupon: (coupon: AppliedCoupon) => void;
  removeCoupon: () => void;
  orderType: OrderType | null;
  setOrderType: (type: OrderType) => void;
  tableId: string | null;
  tableNumber: string | null;
  setTableInfo: (tableId: string | null, tableNumber: string | null) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      remarks: '',
      appliedCoupon: null,
      orderType: null,
      tableId: null,
      tableNumber: null,
      
      setOrderType: (type) => set({ orderType: type }),
      setTableInfo: (tableId, tableNumber) => set({ tableId, tableNumber }),
      
      applyCoupon: (coupon) => set({ appliedCoupon: coupon }),
      removeCoupon: () => set({ appliedCoupon: null }),
      
      setRemarks: (remarks) => set({ remarks }),

      addItem: (item) => {
        set((state) => {
          // Check if identical item (same product, variant, and addons) exists
          const existingItemIndex = state.items.findIndex(
            (i) => 
              i.productId === item.productId &&
              i.variant?.id === item.variant?.id &&
              JSON.stringify(i.addons.map(a => a.id).sort()) === JSON.stringify(item.addons.map(a => a.id).sort())
          );

          if (existingItemIndex > -1) {
            const newItems = [...state.items];
            newItems[existingItemIndex].quantity += item.quantity;
            return { items: newItems };
          }

          return { 
            items: [...state.items, { ...item, id: Math.random().toString(36).substring(2, 9) }] 
          };
        });
      },
      
      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        }));
      },
      
      updateQuantity: (id, quantity) => {
        set((state) => ({
          items: state.items.map((i) => 
            i.id === id ? { ...i, quantity: Math.max(1, quantity) } : i
          ),
        }));
      },
      
      clearCart: () => set({ items: [], remarks: '', appliedCoupon: null }),
      
      getTotalPrice: () => {
        const { items } = get();
        return items.reduce((total, item) => {
          let itemTotal = item.variant ? item.variant.price : item.price;
          itemTotal += item.addons.reduce((sum, addon) => sum + addon.price, 0);
          return total + (itemTotal * item.quantity);
        }, 0);
      },
      
      getTotalItems: () => {
        const { items } = get();
        return items.reduce((total, item) => total + item.quantity, 0);
      }
    }),
    {
      name: 'restaurant-cart-storage',
    }
  )
);
