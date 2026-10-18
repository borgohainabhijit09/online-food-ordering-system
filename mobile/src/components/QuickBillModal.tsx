import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Colors } from '../theme/colors';
import { useMenuStockStore, MenuItem } from '../store/useMenuStockStore';
import { useOrdersStore } from '../store/useOrdersStore';
import { apiFetch } from '../services/api';
import {
  X,
  Search,
  Plus,
  Minus,
  Printer,
  ShoppingBag,
  Utensils,
  CreditCard,
  Banknote,
  CheckCircle2,
} from 'lucide-react-native';

interface QuickBillModalProps {
  visible: boolean;
  onClose: () => void;
  tenantSlug?: string;
  onOrderCreated?: (order: any) => void;
}

interface CartItem {
  product: MenuItem;
  quantity: number;
}

interface TableOption {
  id: string;
  tableNumber: string;
}

export function QuickBillModal({
  visible,
  onClose,
  tenantSlug,
  onOrderCreated,
}: QuickBillModalProps) {
  const { products, fetchProducts } = useMenuStockStore();
  const { createQuickOrder } = useOrdersStore();

  const [orderType, setOrderType] = useState<'DINE_IN' | 'TAKEAWAY'>('TAKEAWAY');
  const [selectedTableId, setSelectedTableId] = useState<string>('');
  const [tables, setTables] = useState<TableOption[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI'>('CASH');
  const [customerName, setCustomerName] = useState('Walk-in Guest');
  const [customerPhone, setCustomerPhone] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [cart, setCart] = useState<Record<string, CartItem>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      fetchProducts(tenantSlug);
      // Fetch tables
      apiFetch<TableOption[]>('/api/tables', { tenantSlug })
        .then((data) => {
          const list = Array.isArray(data) ? data : (data as any)?.tables || [];
          setTables(list);
          if (list.length > 0 && !selectedTableId) {
            setSelectedTableId(list[0].id);
          }
        })
        .catch(() => {});
    }
  }, [visible, tenantSlug]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category?.name) set.add(p.category.name);
    });
    return ['ALL', ...Array.from(set)];
  }, [products]);

  // Only show active (in stock) products
  const availableProducts = useMemo(() => {
    return products.filter((p) => {
      if (!p.isActive) return false;
      const matchesCat = selectedCategory === 'ALL' || p.category?.name === selectedCategory;
      const matchesSearch =
        !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.category?.name && p.category.name.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCat && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  const cartList = useMemo(() => Object.values(cart), [cart]);

  const cartTotal = useMemo(() => {
    return cartList.reduce((sum, item) => sum + item.product.basePrice * item.quantity, 0);
  }, [cartList]);

  const cartItemsCount = useMemo(() => {
    return cartList.reduce((sum, item) => sum + item.quantity, 0);
  }, [cartList]);

  const handleAddToCart = (product: MenuItem) => {
    setCart((prev) => {
      const existing = prev[product.id];
      if (existing) {
        return {
          ...prev,
          [product.id]: { ...existing, quantity: existing.quantity + 1 },
        };
      }
      return {
        ...prev,
        [product.id]: { product, quantity: 1 },
      };
    });
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart((prev) => {
      const existing = prev[productId];
      if (!existing) return prev;
      if (existing.quantity <= 1) {
        const next = { ...prev };
        delete next[productId];
        return next;
      }
      return {
        ...prev,
        [productId]: { ...existing, quantity: existing.quantity - 1 },
      };
    });
  };

  const resetForm = () => {
    setCart({});
    setCustomerName('Walk-in Guest');
    setCustomerPhone('');
    setSearchQuery('');
  };

  const handlePunchAndPrint = async () => {
    if (cartList.length === 0) {
      Alert.alert('Empty Cart', 'Please add at least 1 item to punch order.');
      return;
    }

    if (orderType === 'DINE_IN' && !selectedTableId) {
      Alert.alert('Table Required', 'Please select a table for Dine-in order.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        customerName: customerName.trim() || 'Walk-in Guest',
        phone: customerPhone.trim() || '9999999999',
        total: cartTotal,
        orderType,
        tableId: orderType === 'DINE_IN' ? selectedTableId : undefined,
        paymentMethod,
        paymentStatus: paymentMethod === 'CASH' ? 'PAID' : 'PAID',
        remarks: `Counter POS • ${paymentMethod}`,
        items: cartList.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          price: item.product.basePrice,
          addons: [],
        })),
      };

      const createdOrder = await createQuickOrder(payload, tenantSlug);

      // Trigger Print receipt simulation
      const tableName = tables.find((t) => t.id === selectedTableId)?.tableNumber;
      Alert.alert(
        'Order Punched & Printed!',
        `[ESC/POS SUCCESS]\nBill printed for ${orderType === 'DINE_IN' ? `Table ${tableName}` : 'Takeaway'}\nTotal: ₹${cartTotal} (${paymentMethod})`,
        [{ text: 'OK' }]
      );

      resetForm();
      onClose();
      onOrderCreated?.(createdOrder);
    } catch (err: any) {
      Alert.alert('Failed to Punch Order', err.message || 'Network error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>10-Second Quick Bill</Text>
              <Text style={styles.subtitle}>Punch counter order & print instant ticket</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollArea} keyboardShouldPersistTaps="handled">
            {/* Order Type Toggle */}
            <View style={styles.orderTypeRow}>
              <TouchableOpacity
                style={[
                  styles.orderTypeBtn,
                  orderType === 'TAKEAWAY' && styles.orderTypeBtnActive,
                ]}
                onPress={() => setOrderType('TAKEAWAY')}
                activeOpacity={0.7}
              >
                <ShoppingBag
                  size={16}
                  color={orderType === 'TAKEAWAY' ? '#ffffff' : Colors.textSecondary}
                />
                <Text
                  style={[
                    styles.orderTypeText,
                    orderType === 'TAKEAWAY' && styles.orderTypeTextActive,
                  ]}
                >
                  Takeaway
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.orderTypeBtn,
                  orderType === 'DINE_IN' && styles.orderTypeBtnActive,
                ]}
                onPress={() => setOrderType('DINE_IN')}
                activeOpacity={0.7}
              >
                <Utensils
                  size={16}
                  color={orderType === 'DINE_IN' ? '#ffffff' : Colors.textSecondary}
                />
                <Text
                  style={[
                    styles.orderTypeText,
                    orderType === 'DINE_IN' && styles.orderTypeTextActive,
                  ]}
                >
                  Dine-In
                </Text>
              </TouchableOpacity>
            </View>

            {/* Table Selector (If Dine In) */}
            {orderType === 'DINE_IN' ? (
              <View style={styles.tableSelector}>
                <Text style={styles.sectionLabel}>SELECT TABLE</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tablesScroll}>
                  {tables.map((t) => {
                    const isSelected = t.id === selectedTableId;
                    return (
                      <TouchableOpacity
                        key={t.id}
                        style={[styles.tablePill, isSelected && styles.tablePillActive]}
                        onPress={() => setSelectedTableId(t.id)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.tablePillText,
                            isSelected && styles.tablePillTextActive,
                          ]}
                        >
                          {t.tableNumber.startsWith('T') ? t.tableNumber : `T-${t.tableNumber}`}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            ) : null}

            {/* Payment Method Toggle */}
            <View style={styles.paymentMethodRow}>
              <Text style={styles.sectionLabel}>PAYMENT METHOD</Text>
              <View style={styles.paymentButtons}>
                <TouchableOpacity
                  style={[styles.payBtn, paymentMethod === 'CASH' && styles.payBtnActive]}
                  onPress={() => setPaymentMethod('CASH')}
                  activeOpacity={0.7}
                >
                  <Banknote
                    size={14}
                    color={paymentMethod === 'CASH' ? '#ffffff' : '#059669'}
                  />
                  <Text
                    style={[
                      styles.payBtnText,
                      paymentMethod === 'CASH' && styles.payBtnTextActive,
                    ]}
                  >
                    Cash
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.payBtn, paymentMethod === 'UPI' && styles.payBtnActive]}
                  onPress={() => setPaymentMethod('UPI')}
                  activeOpacity={0.7}
                >
                  <CreditCard
                    size={14}
                    color={paymentMethod === 'UPI' ? '#ffffff' : '#2563eb'}
                  />
                  <Text
                    style={[
                      styles.payBtnText,
                      paymentMethod === 'UPI' && styles.payBtnTextActive,
                    ]}
                  >
                    UPI / QR
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Dish Search & Categories */}
            <View style={styles.searchContainer}>
              <Search size={16} color="#94a3b8" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search menu items..."
                placeholderTextColor="#94a3b8"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <X size={15} color="#94a3b8" />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Category Pills */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.catChip,
                    selectedCategory === cat && styles.catChipActive,
                  ]}
                  onPress={() => setSelectedCategory(cat)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.catChipText,
                      selectedCategory === cat && styles.catChipTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Available Dishes Grid */}
            <View style={styles.dishesList}>
              {availableProducts.map((p) => {
                const inCartQty = cart[p.id]?.quantity || 0;
                return (
                  <View key={p.id} style={styles.dishCard}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.dishName}>{p.name}</Text>
                      <Text style={styles.dishPrice}>₹{p.basePrice}</Text>
                    </View>

                    {inCartQty > 0 ? (
                      <View style={styles.qtyControl}>
                        <TouchableOpacity
                          style={styles.qtyBtn}
                          onPress={() => handleRemoveFromCart(p.id)}
                        >
                          <Minus size={14} color="#ffffff" />
                        </TouchableOpacity>
                        <Text style={styles.qtyText}>{inCartQty}</Text>
                        <TouchableOpacity
                          style={styles.qtyBtn}
                          onPress={() => handleAddToCart(p)}
                        >
                          <Plus size={14} color="#ffffff" />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.addBtn}
                        onPress={() => handleAddToCart(p)}
                        activeOpacity={0.7}
                      >
                        <Plus size={14} color={Colors.primary} />
                        <Text style={styles.addBtnText}>ADD</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </View>
          </ScrollView>

          {/* Cart Tray & Punch Action Button */}
          <View style={styles.footer}>
            <View style={styles.cartSummaryRow}>
              <View>
                <Text style={styles.cartCountText}>{cartItemsCount} Items in Order</Text>
                <Text style={styles.cartTotalText}>Total: ₹{cartTotal}</Text>
              </View>
              <Text style={styles.paymentTag}>{paymentMethod} PAYMENT</Text>
            </View>

            <TouchableOpacity
              style={[
                styles.punchBtn,
                cartList.length === 0 && styles.punchBtnDisabled,
              ]}
              onPress={handlePunchAndPrint}
              disabled={submitting || cartList.length === 0}
              activeOpacity={0.8}
            >
              {submitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Printer size={18} color="#ffffff" />
                  <Text style={styles.punchBtnText}>
                    Punch & Print Bill • ₹{cartTotal}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    height: '92%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  scrollArea: {
    flex: 1,
    paddingHorizontal: 16,
  },
  orderTypeRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  orderTypeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
  },
  orderTypeBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  orderTypeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
  },
  orderTypeTextActive: {
    color: '#ffffff',
  },
  tableSelector: {
    marginTop: 12,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  tablesScroll: {
    flexDirection: 'row',
  },
  tablePill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tablePillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tablePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  tablePillTextActive: {
    color: '#ffffff',
  },
  paymentMethodRow: {
    marginTop: 12,
  },
  paymentButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  payBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 6,
  },
  payBtnActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  payBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  payBtnTextActive: {
    color: '#ffffff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0f172a',
    padding: 0,
  },
  categoryScroll: {
    marginTop: 8,
    marginBottom: 8,
  },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    marginRight: 6,
  },
  catChipActive: {
    backgroundColor: Colors.primary,
  },
  catChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  catChipTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  dishesList: {
    gap: 8,
    paddingBottom: 20,
  },
  dishCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  dishName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
  },
  dishPrice: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primary,
    marginTop: 2,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#fed7aa',
    gap: 4,
  },
  addBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
  },
  qtyControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 6,
    padding: 2,
    gap: 6,
  },
  qtyBtn: {
    padding: 4,
  },
  qtyText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 13,
    minWidth: 16,
    textAlign: 'center',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    backgroundColor: '#ffffff',
  },
  cartSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cartCountText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  cartTotalText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
  },
  paymentTag: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  punchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  punchBtnDisabled: {
    backgroundColor: '#cbd5e1',
    shadowOpacity: 0,
  },
  punchBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
});
